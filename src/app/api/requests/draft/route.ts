import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isSameOrigin } from "@/lib/auth";
import { encryptHealthData } from "@/lib/health-data";
import { db } from "@/lib/db";

const schema = z.object({ requestId: z.string().min(1), intake: z.record(z.string(), z.unknown()) });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "درخواست معتبر نیست." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "برای ادامه وارد حساب شوید." }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const request = await db.coachingRequest.findFirst({
      where: { id: data.requestId, userId: user.id, status: "PAID", payments: { some: { status: "PAID" } } },
      select: { id: true },
    });
    if (!request) return NextResponse.json({ error: "ذخیره اطلاعات فقط پس از تأیید پرداخت ممکن است." }, { status: 402 });
    await db.coachingRequest.update({ where: { id: request.id }, data: { intake: encryptHealthData(data.intake), healthConsent: true } });
    return NextResponse.json({ id: request.id });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "اطلاعات فرم معتبر نیست." }, { status: 400 });
    return NextResponse.json({ error: "ذخیره اطلاعات انجام نشد." }, { status: 500 });
  }
}
