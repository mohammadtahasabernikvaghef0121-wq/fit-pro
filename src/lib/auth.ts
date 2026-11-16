import { randomBytes, createHmac, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { Role } from "@/generated/prisma/client";
import {canSendOtp,isOtpUsable,hasRole} from "@/lib/policies";

const pepper = () => {
  const value=process.env.SESSION_SECRET;
  if(!value||value.length<32)throw new Error("SESSION_SECRET باید حداقل ۳۲ نویسه باشد.");
  return value;
};
export const hash = (value: string) => createHmac("sha256", pepper()).update(value).digest("hex");
export function isSameOrigin(req:Request){const origin=req.headers.get("origin");if(!origin)return process.env.NODE_ENV!=="production";try{const expected=process.env.NEXT_PUBLIC_SITE_URL?new URL(process.env.NEXT_PUBLIC_SITE_URL).origin:new URL(req.url).origin;return new URL(origin).origin===expected}catch{return false}}
export const normalizePhone = (input: string) => {
  const digits = input.replace(/[\s()-]/g, "").replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const iran = digits.startsWith("+98") ? `0${digits.slice(3)}` : digits.startsWith("0098") ? `0${digits.slice(4)}` : digits;
  if (!/^09\d{9}$/.test(iran)) throw new Error("شماره همراه معتبر نیست.");
  return iran;
};

export async function issueOtp(phone: string) {
  const since = new Date(Date.now() - 60_000);
  const recent = await db.otpCode.count({ where: { phone, createdAt: { gte: since } } });
  const last = await db.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!canSendOtp(recent,last?.createdAt)) throw new Error(recent>=3?"درخواست‌های شما زیاد است. کمی بعد دوباره تلاش کنید.":"برای ارسال دوباره کد، کمی صبر کنید.");
  const code = String(randomInt(100000, 1000000));
  await db.otpCode.create({ data: { phone, hash: hash(`${phone}:${code}`), expiresAt: new Date(Date.now() + 5 * 60_000) } });
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_OTP_TEMPLATE;
  if (!apiKey || !template) throw new Error("سرویس ورود هنوز پیکربندی نشده است.");
  const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`);
  url.search = new URLSearchParams({ receptor: phone, token: code, template, type: "sms" }).toString();
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || body?.return?.status !== 200) throw new Error("ارسال کد با مشکل روبه‌رو شد. دوباره تلاش کنید.");
}

export async function verifyOtp(phone: string, code: string) {
  const record = await db.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!record || !isOtpUsable(record.expiresAt,record.attempts)) return null;
  const updated = await db.otpCode.updateMany({ where: { id: record.id, attempts: record.attempts }, data: { attempts: { increment: 1 } } });
  if (!updated.count || hash(`${phone}:${code}`) !== record.hash) return null;
  await db.otpCode.deleteMany({ where: { phone } });
  const user = await db.user.upsert({ where: { phone }, create: { phone }, update: {} });
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000);
  await db.session.create({ data: { userId: user.id, tokenHash: hash(token), expiresAt } });
  const jar = await cookies();
  jar.set("fit_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
  return user;
}

export async function currentUser() {
  const jar = await cookies();
  const token = jar.get("fit_session")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export function isOwnerAdmin(user: { phone: string; role: Role } | null | undefined) {
  const configured = process.env.ADMIN_PHONE;
  if (!user || user.role !== "ADMIN" || !configured) return false;
  try { return normalizePhone(user.phone) === normalizePhone(configured); } catch { return false; }
}

export async function createDevOwnerSession() {
  if (process.env.NODE_ENV !== "development" || !process.env.ADMIN_PHONE) throw new Error("ورود آزمایشی فعال نیست.");
  const user = await db.user.upsert({ where: { phone: normalizePhone(process.env.ADMIN_PHONE) }, create: { phone: normalizePhone(process.env.ADMIN_PHONE), role: "ADMIN" }, update: { role: "ADMIN" } });
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000);
  await db.session.create({ data: { userId: user.id, tokenHash: hash(token), expiresAt } });
  const jar = await cookies();
  jar.set("fit_session", token, { httpOnly: true, secure: false, sameSite: "lax", path: "/", expires: expiresAt });
  return user;
}

export async function requireRole(role?: Role) {
  const user = await currentUser();
  if (!user || (role && !hasRole(user.role,role))) throw new Error("اجازه دسترسی ندارید.");
  return user;
}
