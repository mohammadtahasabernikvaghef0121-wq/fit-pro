import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptHealthData, decryptHealthData } from "@/lib/health-data";
import { sendWebsiteSupportToTelegram } from "@/lib/telegram";

export const runtime = "nodejs";

const requestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(13).max(100),
  height: z.coerce.number().min(80).max(250),
  weight: z.coerce.number().min(20).max(400),
  goal: z.string().trim().min(2).max(300),
  experience: z.string().trim().min(1).max(300),
  activityLevel: z.string().trim().max(200).optional().default(""),
  trainingDays: z.string().trim().max(100).optional().default(""),
  injuries: z.string().trim().max(1500).optional().default(""),
  healthConditions: z.string().trim().max(1500).optional().default(""),
  equipment: z.string().trim().max(300).optional().default(""),
  notes: z.string().trim().max(1500).optional().default(""),
  message: z.string().trim().min(2).max(2000),
  shareHealthData: z.literal(true),
});

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "برای دیدن پیام‌ها وارد حساب شوید." }, { status: 401 });
  if (user.role !== "CLIENT") return NextResponse.json({ error: "این بخش برای حساب مشتریان است." }, { status: 403 });
  const requests = await db.supportRequest.findMany({
    where: { userId: user.id, source: "WEBSITE" },
    include: { replies: { orderBy: { createdAt: "asc" }, select: { id: true, text: true, isAdmin: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests: requests.map((request) => ({
    requestNumber: request.requestNumber,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    message: request.messageText,
    intake: decryptHealthData(request.intake),
    replies: request.replies.map((reply) => ({ ...reply, createdAt: reply.createdAt.toISOString() })),
  })) }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "برای ارسال درخواست ابتدا وارد حساب شوید." }, { status: 401 });
  if (user.role !== "CLIENT") return NextResponse.json({ error: "این بخش برای حساب مشتریان است." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "اطلاعات فرم را بررسی کنید." }, { status: 400 });

  const { name, message, shareHealthData, ...healthDetails } = parsed.data;
  void shareHealthData;
  try {
    const updatedUser = await db.user.update({ where: { id: user.id }, data: { name } });
    const saved = await db.supportRequest.create({ data: {
      userId: user.id,
      source: "WEBSITE",
      phone: user.phone,
      telegramChatId: null,
      telegramUserId: null,
      firstName: name,
      messageText: message,
      intake: encryptHealthData(healthDetails),
      status: "PENDING",
    } });

    let telegramNotified = false;
    try {
      telegramNotified = await sendWebsiteSupportToTelegram({
        requestNumber: saved.requestNumber,
        userId: updatedUser.id,
        name,
        phone: updatedUser.phone,
        message,
        intake: healthDetails,
      });
    } catch (error) {
      console.error("Website support Telegram notification failed", error instanceof Error ? error.message : "unknown error");
    }
    return NextResponse.json({ requestNumber: saved.requestNumber, createdAt: saved.createdAt.toISOString(), message, status: saved.status, replies: [], telegramNotified }, { status: 201 });
  } catch (error) {
    console.error("Website support request could not be saved", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید." }, { status: 500 });
  }
}
