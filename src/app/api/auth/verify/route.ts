import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone, verifyOtp, isSameOrigin } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if(!isSameOrigin(req))return NextResponse.json({error:"درخواست معتبر نیست."},{status:403});
  try {
    const data = z.object({ phone: z.string(), code: z.string().min(6).max(6) }).parse(await req.json());
    const code=data.code.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    if(!/^\d{6}$/.test(code))return NextResponse.json({error:"کد نادرست یا منقضی شده است."},{status:401});
    const user = await verifyOtp(normalizePhone(data.phone), code);
    if (!user) return NextResponse.json({ error: "کد نادرست یا منقضی شده است." }, { status: 401 });
    return NextResponse.json({ ok: true, redirect: user.role === "ADMIN" ? "/admin" : "/dashboard" });
  } catch { return NextResponse.json({ error: "اطلاعات واردشده معتبر نیست." }, { status: 400 }); }
}
