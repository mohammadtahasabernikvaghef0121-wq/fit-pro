import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { currentUser, isOwnerAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { mayReadPlan } from "@/lib/policies";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });

  const { id } = await params;
  const plan = await db.deliveredPlan.findUnique({
    where: { id },
    include: { request: { include: { payments: true } } },
  });
  const isPaid = Boolean(plan?.request.payments.some((payment) => payment.status === "PAID" || payment.status === "DEMO_PAID"));
  const authorizationRole = isOwnerAdmin(user) ? "ADMIN" : user.role;
  if (!plan || !mayReadPlan(authorizationRole, plan.request.userId, user.id, isPaid)) {
    return NextResponse.json({ error: "فایل پیدا نشد." }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(process.cwd(), ".data", "plans", path.basename(plan.storageKey)));
    const viewInBrowser = new URL(req.url).searchParams.get("view") === "1";
    const disposition = viewInBrowser ? "inline" : "attachment";
    const filename = `${encodeURIComponent(plan.title)}.pdf`;
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="fitpro-plan.pdf"; filename*=UTF-8''${filename}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "فایل در دسترس نیست." }, { status: 404 });
  }
}
