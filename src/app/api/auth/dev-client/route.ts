import { NextResponse } from "next/server";
import { createDevClientSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const host = req.headers.get("host")?.split(":")[0];
  const origin = req.headers.get("origin");
  let localSameOrigin = false;
  try {
    localSameOrigin = !!origin && new URL(origin).host === req.headers.get("host");
  } catch {
    localSameOrigin = false;
  }
  if (process.env.NODE_ENV !== "development" || !localSameOrigin || !["localhost", "127.0.0.1", "[::1]"].includes(host ?? "")) {
    return NextResponse.json({ error: "ورود آزمایشی فقط روی همین رایانه فعال است." }, { status: 403 });
  }
  try {
    await createDevClientSession();
    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (error) {
    console.error("Could not create local client preview", error);
    return NextResponse.json({ error: "ساخت حساب آزمایشی انجام نشد؛ پایگاه‌داده یا کلید رمزگذاری را بررسی کنید." }, { status: 503 });
  }
}
