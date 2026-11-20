import { NextResponse } from "next/server";
import { z } from "zod";
import { intakeSchema } from "@/lib/schemas";
import { encryptHealthData } from "@/lib/health-data";
import { currentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendRequestToTelegram } from "@/lib/telegram";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "برای ثبت اطلاعات وارد شوید." }, { status: 401 });
    const data = intakeSchema.parse(await req.json());
    if (!data.requestId) return NextResponse.json({ error: "ابتدا سفارش و پرداخت را تکمیل کنید." }, { status: 400 });

    const request = await db.coachingRequest.findFirst({
      where: { id: data.requestId, userId: user.id },
      include: { package: true, payments: { where: { status: { in: ["PAID", "DEMO_PAID"] } }, orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!request) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    if (request.status !== "PAID" || request.payments.length === 0) {
      return NextResponse.json({ error: "پرداخت این سفارش تکمیل نشده است. ابتدا پرداخت را انجام دهید." }, { status: 402 });
    }
    if (request.packageId !== data.packageId) return NextResponse.json({ error: "برنامه‌ی انتخاب‌شده با سفارش هم‌خوانی ندارد." }, { status: 400 });

    const saved = await db.coachingRequest.updateMany({
      where: { id: request.id, userId: user.id, status: "PAID" },
      data: { intake: encryptHealthData(data), healthConsent: true, status: "UNDER_REVIEW" },
    });
    if (!saved.count) return NextResponse.json({ error: "اطلاعات این سفارش قبلاً ثبت شده است." }, { status: 409 });

    let telegramSent = false;
    const demoPayment = request.payments.some(payment => payment.status === "DEMO_PAID");
    if (!demoPayment) {
      try {
        telegramSent = await sendRequestToTelegram({ requestId: request.id, phone: user.phone, packageName: request.package.title, intake: data });
      } catch (error) {
        console.error("Telegram request notification failed", error);
      }
    }
    return NextResponse.json({ id: request.id, telegramSent, demoPayment });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "اطلاعات فرم را بررسی کنید." }, { status: 400 });
    console.error("Could not save paid customer intake", error);
    return NextResponse.json({ error: "ثبت اطلاعات انجام نشد؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
