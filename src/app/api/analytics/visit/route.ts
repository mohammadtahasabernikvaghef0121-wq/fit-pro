import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    const body: unknown = await req.json();
    const path = typeof body === "object" && body !== null && "path" in body && typeof body.path === "string" ? body.path : "";
    if (!path.startsWith("/") || path.length > 200 || /[?#\u0000-\u001f]/.test(path) || path.startsWith("/admin") || path.startsWith("/api/")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await db.siteVisit.create({ data: { path } });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
