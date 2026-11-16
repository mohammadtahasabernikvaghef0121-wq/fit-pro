import { NextResponse } from "next/server";
import { z } from "zod";
import { issueOtp, normalizePhone, isSameOrigin, hash } from "@/lib/auth";
import { db } from "@/lib/db";
import { canSendOtp } from "@/lib/policies";
import { randomInt } from "node:crypto";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if(!isSameOrigin(req))return NextResponse.json({error:"درخواست معتبر نیست."},{status:403});
  try {
    const data = z.object({ phone: z.string().min(8).max(20) }).parse(await req.json());
    const phone = normalizePhone(data.phone);
    if (process.env.NODE_ENV === "development" && process.env.OTP_DEMO_MODE === "true") {
      const since = new Date(Date.now() - 60_000);
      const recent = await db.otpCode.count({ where: { phone, createdAt: { gte: since } } });
      const last = await db.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
      if (!canSendOtp(recent, last?.createdAt)) return NextResponse.json({ error: recent >= 3 ? "درخواست‌های شما زیاد است. کمی بعد دوباره تلاش کنید." : "برای ارسال دوباره کد، کمی صبر کنید." }, { status: 429 });
      const demoCode = String(randomInt(100000, 1000000));
      await db.otpCode.create({ data: { phone, hash: hash(`${phone}:${demoCode}`), expiresAt: new Date(Date.now() + 5 * 60_000) } });
      return NextResponse.json({ ok: true, message: "کد نمایشی فقط در محیط توسعه ساخته شد.", demoCode });
    }
    await issueOtp(phone);
    return NextResponse.json({ ok: true, message: "کد ورود برای شما ارسال شد." });
  } catch (e) { const message=e instanceof Error?e.message:"";const safe=["شماره همراه معتبر نیست.","درخواست‌های شما زیاد است. کمی بعد دوباره تلاش کنید.","برای ارسال دوباره کد، کمی صبر کنید.","سرویس ورود هنوز پیکربندی نشده است.","ارسال کد با مشکل روبه‌رو شد. دوباره تلاش کنید.","SESSION_SECRET باید حداقل ۳۲ نویسه باشد."];return NextResponse.json({error:safe.includes(message)?message:"امکان ارسال کد وجود ندارد."},{status:400}); }
}
