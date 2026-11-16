import { NextResponse } from "next/server";
import { createDevOwnerSession, isSameOrigin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const host = req.headers.get("host")?.split(":")[0];
  if (!isSameOrigin(req) || !["localhost", "127.0.0.1", "[::1]"].includes(host ?? "")) {
    return NextResponse.json({ error: "ورود توسعه فقط روی همین رایانه فعال است." }, { status: 403 });
  }
  try {
    const user = await createDevOwnerSession();
    return NextResponse.json({ ok: true, redirect: "/admin", phone: user.phone });
  } catch {
    return NextResponse.json({ error: "ورود آزمایشی فعال نیست یا پایگاه‌داده در دسترس نیست." }, { status: 503 });
  }
}
