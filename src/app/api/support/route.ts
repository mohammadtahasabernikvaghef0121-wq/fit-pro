import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPrivateSupportNoticeToTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
const schema = z.object({ message: z.string().trim().min(2).max(2000) });

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "برای مشاهده گفت‌وگوها وارد حساب شوید." }, { status: 401 });
  const rows = await db.supportRequest.findMany({
    where: { userId: user.id, source: "WEBSITE" },
    include: { replies: { orderBy: { createdAt: "asc" }, select: { id: true, text: true, isAdmin: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests: rows.map(row => ({ requestNumber: row.requestNumber, status: row.status, createdAt: row.createdAt.toISOString(), message: row.messageText || "", replies: row.replies.map(reply => ({ ...reply, createdAt: reply.createdAt.toISOString() })) })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  const user = await currentUser();
  if (!user || user.role !== "CLIENT") return NextResponse.json({ error: "برای ارسال درخواست پشتیبانی وارد حساب مشتری شوید." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "متن پیام را بررسی کنید." }, { status: 400 });
  const name = user.name || "مشتری Fit Pro";
  try {
    const row = await db.supportRequest.create({ data: { userId: user.id, source: "WEBSITE", phone: user.phone, firstName: name, messageText: parsed.data.message, status: "PENDING" } });
    let telegramNotified = false;
    try { telegramNotified = await sendPrivateSupportNoticeToTelegram(row.requestNumber); }
    catch (error) { console.error("Support Telegram notice failed", error instanceof Error ? error.message : "unknown error"); }
    return NextResponse.json({ requestNumber: row.requestNumber, status: row.status, createdAt: row.createdAt.toISOString(), message: row.messageText, replies: [], telegramNotified }, { status: 201 });
  } catch (error) {
    console.error("Support request could not be created", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "ثبت درخواست انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
