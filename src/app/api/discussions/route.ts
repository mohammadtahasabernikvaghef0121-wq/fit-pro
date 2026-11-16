import { NextResponse } from "next/server";

function retired() {
  return NextResponse.json({ error: "بخش دیدگاه‌ها فعلاً غیرفعال است." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  return retired();
}

export async function POST() {
  return retired();
}
