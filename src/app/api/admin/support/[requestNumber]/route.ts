import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isOwnerAdmin, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ message: z.string().trim().min(1).max(2000) });
export async function POST(request: Request, context: { params: Promise<{ requestNumber: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  const user = await currentUser();
  if (!isOwnerAdmin(user)) return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
  const { requestNumber: raw } = await context.params;
  const requestNumber = Number(raw);
  if (!Number.isSafeInteger(requestNumber) || requestNumber < 1) return NextResponse.json({ error: "شناسه درخواست معتبر نیست." }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "متن پاسخ را بررسی کنید." }, { status: 400 });
  const support = await db.supportRequest.findFirst({ where: { requestNumber, source: "WEBSITE", userId: { not: null } } });
  if (!support) return NextResponse.json({ error: "گفت‌وگوی خصوصی پیدا نشد." }, { status: 404 });
  const reply = await db.$transaction(async tx => {
    const saved = await tx.supportReply.create({ data: { requestId: support.id, adminTelegramUserId: null, text: parsed.data.message, isAdmin: true } });
    await tx.supportRequest.update({ where: { id: support.id }, data: { status: "REPLIED", closedAt: null } });
    return saved;
  });
  return NextResponse.json({ reply: { id: reply.id, text: reply.text, isAdmin: true, createdAt: reply.createdAt.toISOString() } }, { status: 201 });
}
