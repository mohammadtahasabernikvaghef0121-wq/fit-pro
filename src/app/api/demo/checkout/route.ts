import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptHealthData } from "@/lib/health-data";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  name: z.string().trim().min(3).max(100),
  items: z.array(z.object({ packageId: z.string().min(1), quantity: z.number().int().min(1).max(10) })).min(1).max(4),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development" || process.env.PAYMENT_MODE !== "mock") {
    return NextResponse.json({ error: "پرداخت آزمایشی در این محیط فعال نیست." }, { status: 404 });
  }
  if (!isSameOrigin(request)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "برای ادامه ابتدا وارد حساب کاربری شوید." }, { status: 401 });

  try {
    const input = checkoutSchema.parse(await request.json());
    if (input.items.reduce((sum, item) => sum + item.quantity, 0) > 6) {
      return NextResponse.json({ error: "در هر پرداخت آزمایشی حداکثر 6 برنامه ثبت می‌شود." }, { status: 400 });
    }
    const packageIds = [...new Set(input.items.map(item => item.packageId))];
    const packages = await db.coachingPackage.findMany({ where: { id: { in: packageIds }, active: true } });
    if (packages.length !== packageIds.length) return NextResponse.json({ error: "یکی از برنامه‌های سبد خرید در دسترس نیست. سبد را تازه‌سازی کنید." }, { status: 400 });
    const packageById = new Map(packages.map(item => [item.id, item]));

    const requestIds = await db.$transaction(async tx => {
      await tx.user.update({ where: { id: user.id }, data: { name: input.name } });
      const ids: string[] = [];
      for (const item of input.items) {
        const coachingPackage = packageById.get(item.packageId)!;
        for (let index = 0; index < item.quantity; index += 1) {
          const created = await tx.coachingRequest.create({
            data: {
              userId: user.id,
              packageId: coachingPackage.id,
              requestType: coachingPackage.requestType,
              status: "PAID",
              intake: encryptHealthData({}),
              healthConsent: false,
              payments: { create: {
                amountRials: coachingPackage.priceRials,
                status: "DEMO_PAID",
                orderRef: `FIT-DEMO-${randomUUID()}`,
                trackId: `DEMO-${randomUUID()}`,
                paidAt: new Date(),
                gatewayResponse: { mode: "mock", realMoneyTransferred: false },
              } },
            },
            select: { id: true },
          });
          ids.push(created.id);
        }
      }
      return ids;
    });

    return NextResponse.json({ demo: true, requestIds, url: `/dashboard/requests/new?request=${encodeURIComponent(requestIds[0])}` }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "اطلاعات سبد خرید معتبر نیست." }, { status: 400 });
    console.error("Could not create demo checkout", error);
    return NextResponse.json({ error: "ثبت سفارش آزمایشی ناموفق بود. دوباره تلاش کنید." }, { status: 500 });
  }
}
