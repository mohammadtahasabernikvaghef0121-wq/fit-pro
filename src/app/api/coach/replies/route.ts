import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWebsiteFollowupToTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
const replySchema = z.object({ requestNumber: z.number().int().positive(), message: z.string().trim().min(1).max(2000) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "برای ارسال پیام وارد حساب شوید." }, { status: 401 });
  if (user.role !== "CLIENT") return NextResponse.json({ error: "این بخش برای حساب مشتریان است." }, { status: 403 });
  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "متن پیام را بررسی کنید." }, { status: 400 });

  const requestRow = await db.supportRequest.findFirst({ where: { requestNumber: parsed.data.requestNumber, userId: user.id, source: "WEBSITE" } });
  if (!requestRow) return NextResponse.json({ error: "گفت‌وگو پیدا نشد." }, { status: 404 });
  if (requestRow.status === "CLOSED") return NextResponse.json({ error: "این گفت‌وگو بسته شده است؛ برای ادامه یک درخواست تازه ثبت کنید." }, { status: 409 });

  const savedReply = await db.supportReply.create({ data: { requestId: requestRow.id, text: parsed.data.message, isAdmin: false } });
  await db.supportRequest.update({ where: { id: requestRow.id }, data: { status: "IN_PROGRESS" } });
  let telegramNotified = false;
  try {
    telegramNotified = await sendWebsiteFollowupToTelegram({ requestNumber: requestRow.requestNumber, name: user.name || "مشتری Fit Pro", message: savedReply.text });
  } catch (error) {
    console.error("Website support follow-up notification failed", error instanceof Error ? error.message : "unknown error");
  }
  return NextResponse.json({ reply: { id: savedReply.id, text: savedReply.text, isAdmin: false, createdAt: savedReply.createdAt.toISOString() }, telegramNotified }, { status: 201 });
}
