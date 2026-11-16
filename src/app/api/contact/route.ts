import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPrivateSupportNoticeToTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(2).max(100), message: z.string().trim().min(2).max(2000) });
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  const user = await currentUser();
  if (!user || user.role !== "CLIENT") return NextResponse.json({ error: "برای ارسال پیام خصوصی وارد حساب شوید." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "نام و متن پیام را بررسی کنید." }, { status: 400 });
  try {
    const row = await db.supportRequest.create({ data: { userId: user.id, source: "WEBSITE", phone: user.phone, firstName: parsed.data.name, messageText: parsed.data.message, status: "PENDING" } });
    await sendPrivateSupportNoticeToTelegram(row.requestNumber).catch(error => { console.error("Private contact notice failed", error instanceof Error ? error.message : "unknown error"); return false; });
    return NextResponse.json({ ok: true, requestNumber: row.requestNumber }, { status: 201 });
  } catch { return NextResponse.json({ error: "ثبت پیام انجام نشد. لطفاً دوباره تلاش کنید." }, { status: 500 }); }
}
