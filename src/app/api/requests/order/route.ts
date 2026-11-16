import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isSameOrigin } from "@/lib/auth";
import { encryptHealthData } from "@/lib/health-data";
import { db } from "@/lib/db";

const orderSchema = z.object({
  packageId: z.string().min(1),
  requestId: z.string().optional(),
  name: z.string().trim().min(3).max(100),
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "برای ادامه وارد حساب شوید." }, { status: 401 });

  try {
    const data = orderSchema.parse(await req.json());
    const pkg = await db.coachingPackage.findFirst({ where: { id: data.packageId, active: true } });
    if (!pkg) return NextResponse.json({ error: "این برنامه در دسترس نیست." }, { status: 404 });

    if (data.requestId) {
      const request = await db.coachingRequest.findFirst({
        where: { id: data.requestId, userId: user.id, packageId: pkg.id, status: "NEW" },
        include: { payments: true },
      });
      if (!request || request.payments.some(payment => payment.status === "PAID")) {
        return NextResponse.json({ error: "سفارش برای پرداخت دوباره در دسترس نیست." }, { status: 409 });
      }
      await db.user.update({ where: { id: user.id }, data: { name: data.name } });
      return NextResponse.json({ id: request.id });
    }

    const request = await db.$transaction(async transaction => {
      await transaction.user.update({ where: { id: user.id }, data: { name: data.name } });
      return transaction.coachingRequest.create({
        data: {
          userId: user.id,
          packageId: pkg.id,
          requestType: pkg.requestType,
          status: "NEW",
          intake: encryptHealthData({}),
          healthConsent: false,
        },
      });
    });
    return NextResponse.json({ id: request.id });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "نام و نام خانوادگی را بررسی کنید." }, { status: 400 });
    console.error("Could not create prepayment order", error);
    return NextResponse.json({ error: "ایجاد سفارش ممکن نشد؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
