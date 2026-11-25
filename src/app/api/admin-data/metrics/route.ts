import { NextResponse } from "next/server";
import { currentUser, isOwnerAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptHealthData } from "@/lib/health-data";

export const runtime = "nodejs";

function rangeStart(value: string | null) {
  const start = new Date();
  if (value === "7d") start.setDate(start.getDate() - 7);
  else if (value === "30d") start.setDate(start.getDate() - 30);
  else if (value === "12m") start.setFullYear(start.getFullYear() - 1);
  else return new Date(0);
  return start;
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!isOwnerAdmin(user)) {
    return NextResponse.json({ error: "اجازه دسترسی ندارید." }, { status: user ? 403 : 401 });
  }

  const url = new URL(request.url);
  const from = rangeStart(url.searchParams.get("range"));

  try {
    const [visitors, requests, transactions, revenue, recentRequests, recentPayments, packages] = await Promise.all([
      db.siteVisit.count({ where: { visitedAt: { gte: from } } }),
      db.coachingRequest.count({ where: { createdAt: { gte: from }, status: { not: "DRAFT" } } }),
      db.payment.count({ where: { createdAt: { gte: from }, status: "PAID" } }),
      db.payment.aggregate({ where: { createdAt: { gte: from }, status: "PAID" }, _sum: { amountRials: true } }),
      db.coachingRequest.findMany({
        take: 50,
        where: { createdAt: { gte: from }, status: { not: "DRAFT" } },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, phone: true } },
          package: { select: { title: true } },
          payments: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
          plans: { select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: "desc" } },
        },
      }),
      db.payment.findMany({
        take: 50,
        where: { createdAt: { gte: from } },
        orderBy: { createdAt: "desc" },
        include: { request: { include: { user: { select: { name: true, phone: true } }, package: { select: { title: true } } } } },
      }),
      db.coachingPackage.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    return NextResponse.json({
      metrics: { visitors, requests, transactions, revenueToman: Number(revenue._sum.amountRials ?? BigInt(0)) / 10 },
      requests: recentRequests.map((item) => {
        let intake: Record<string, unknown> = {};
        try { intake = decryptHealthData(item.intake); } catch { /* Keep the admin list usable if one record cannot be decrypted. */ }
        return {
          id: item.id,
          name: item.user.name || "مشتری",
          phone: item.user.phone,
          package: item.package.title,
          status: item.status,
          paymentStatus: item.payments[0]?.status ?? "PENDING",
          createdAt: item.createdAt.toISOString(),
          intake,
          plans: item.plans.map((plan) => ({ id: plan.id, title: plan.title, createdAt: plan.createdAt.toISOString() })),
        };
      }),
      payments: recentPayments.map((item) => ({
        id: item.id,
        orderRef: item.orderRef,
        name: item.request.user.name || "مشتری",
        phone: item.request.user.phone,
        package: item.request.package.title,
        amountToman: Number(item.amountRials) / 10,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      packages: packages.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description,
        durationDays: item.durationDays,
        priceToman: Number(item.priceRials) / 10,
        requestType: item.requestType,
        active: item.active,
        deliverables: item.deliverables,
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Could not load admin dashboard metrics", error);
    return NextResponse.json({ error: "دریافت اطلاعات پنل انجام نشد." }, { status: 500 });
  }
}
