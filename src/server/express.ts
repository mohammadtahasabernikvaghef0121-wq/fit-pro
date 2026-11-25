import express, { type NextFunction, type Request, type Response } from "express";
import { createHmac } from "node:crypto";
import { db } from "../lib/db";
import { decryptHealthData } from "../lib/health-data";
import bmiRouter from "./routes/bmi";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

function cookieValue(header: string | undefined, key: string) {
  return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${key}=`))?.slice(key.length + 1);
}
function normalizePhone(value: string | undefined) {
  const digits = (value || "").replace(/[\s()-]/g, "");
  return digits.startsWith("+98") ? `0${digits.slice(3)}` : digits.startsWith("0098") ? `0${digits.slice(4)}` : digits;
}

async function requireOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.SESSION_SECRET;
    const token = cookieValue(req.headers.cookie, "fit_session");
    if (!secret || secret.length < 32 || !token) return res.status(401).json({ error: "ورود مدیر لازم است." });
    const tokenHash = createHmac("sha256", secret).update(decodeURIComponent(token)).digest("hex");
    const session = await db.session.findUnique({ where: { tokenHash }, include: { user: true } });
    const configuredPhone = normalizePhone(process.env.ADMIN_PHONE);
    const userPhone = normalizePhone(session?.user.phone);
    if (!session || session.expiresAt < new Date() || session.user.role !== "ADMIN" || !configuredPhone || userPhone !== configuredPhone) {
      return res.status(403).json({ error: "دسترسی مدیر مجاز نیست." });
    }
    next();
  } catch (error) {
    next(error);
  }
}

async function requireSignedInUser(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.SESSION_SECRET;
    const token = cookieValue(req.headers.cookie, "fit_session");
    if (!secret || secret.length < 32 || !token) return res.status(401).json({ error: "برای دیدن پنل وارد حساب شوید." });
    const tokenHash = createHmac("sha256", secret).update(decodeURIComponent(token)).digest("hex");
    const session = await db.session.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) return res.status(401).json({ error: "نشست ورود معتبر نیست؛ دوباره وارد شوید." });
    res.locals.account = { id: session.user.id, name: session.user.name, phone: session.user.phone, createdAt: session.user.createdAt };
    next();
  } catch (error) { next(error); }
}

function rangeStart(value: unknown) {
  const now = new Date();
  if (value === "7d") now.setDate(now.getDate() - 7);
  else if (value === "30d") now.setDate(now.getDate() - 30);
  else if (value === "12m") now.setFullYear(now.getFullYear() - 1);
  else return new Date(0);
  return now;
}

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/bmi", bmiRouter);
app.get("/user-dashboard", requireSignedInUser, async (_req, res, next) => {
  try {
    const account = res.locals.account as { id: string; name: string | null; phone: string; createdAt: Date };
    const requests = await db.coachingRequest.findMany({
      where: { userId: account.id },
      orderBy: { createdAt: "desc" },
      include: {
        package: { select: { title: true, description: true, durationDays: true, requestType: true } },
        payments: { orderBy: { createdAt: "desc" }, select: { id: true, orderRef: true, amountRials: true, status: true, createdAt: true, paidAt: true } },
        plans: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, createdAt: true } },
      },
    });
    const programs = requests.map((request) => {
      let intake: Record<string, unknown> = {};
      try { intake = decryptHealthData(request.intake); } catch { /* Keep the panel available if health data cannot be decrypted. */ }
      return {
        id: request.id,
        title: request.package.title,
        description: request.package.description,
        durationDays: request.package.durationDays,
        requestType: request.requestType,
        status: request.status,
        paymentStatus: request.payments[0]?.status ?? "PENDING",
        createdAt: request.createdAt,
        intake: { age: intake.age, height: intake.height, weight: intake.weight, goal: intake.goal, experience: intake.experience, injuries: intake.injuries },
        plans: request.plans.map((plan) => ({ id: plan.id, title: plan.title, createdAt: plan.createdAt })),
        payments: request.payments.map((payment) => ({ id: payment.id, orderRef: payment.orderRef, amountToman: Number(payment.amountRials) / 10, status: payment.status, createdAt: payment.createdAt, paidAt: payment.paidAt })),
      };
    });
    const payments = programs.flatMap((program) => program.payments.map((payment) => ({ ...payment, programTitle: program.title })));
    const paidTotalToman = payments.filter((payment) => payment.status === "PAID").reduce((total, payment) => total + payment.amountToman, 0);
    res.json({ account, programs, payments, summary: { programCount: programs.filter((program) => program.status !== "DRAFT").length, deliveredCount: programs.filter((program) => program.plans.length > 0).length, transactionCount: payments.length, paidTotalToman } });
  } catch (error) { next(error); }
});
app.get("/metrics", requireOwner, async (req, res, next) => {
  try {
    const from = rangeStart(req.query.range);
    const [visitors, requests, transactions, revenueRials, recentRequests, recentPayments, packages] = await Promise.all([
      db.siteVisit.count({ where: { visitedAt: { gte: from } } }),
      db.coachingRequest.count({ where: { createdAt: { gte: from }, status: { not: "DRAFT" } } }),
      db.payment.count({ where: { createdAt: { gte: from }, status: "PAID" } }),
      db.payment.aggregate({ where: { createdAt: { gte: from }, status: "PAID" }, _sum: { amountRials: true } }),
      db.coachingRequest.findMany({ take: 8, where: { createdAt: { gte: from }, status: { not: "DRAFT" } }, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, phone: true } }, package: { select: { title: true } }, payments: { select: { status: true, amountRials: true }, orderBy: { createdAt: "desc" }, take: 1 } } }),
      db.payment.findMany({ take: 8, where: { createdAt: { gte: from } }, orderBy: { createdAt: "desc" }, include: { request: { include: { user: { select: { name: true, phone: true } }, package: { select: { title: true } } } } } }),
      db.coachingPackage.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, title: true, description: true, durationDays: true, priceRials: true, requestType: true, active: true, deliverables: true } }),
    ]);
    res.json({
      metrics: { visitors, requests, transactions, revenueToman: Number(revenueRials._sum.amountRials ?? BigInt(0)) / 10 },
      requests: recentRequests.map((item) => ({ id: item.id, name: item.user.name || "مشتری", phone: item.user.phone, package: item.package.title, status: item.status, paymentStatus: item.payments[0]?.status ?? "PENDING", createdAt: item.createdAt })),
      payments: recentPayments.map((item) => ({ id: item.id, orderRef: item.orderRef, name: item.request.user.name || "مشتری", phone: item.request.user.phone, package: item.request.package.title, amountToman: Number(item.amountRials) / 10, status: item.status, createdAt: item.createdAt })),
      packages: packages.map((item) => ({ ...item, priceToman: Number(item.priceRials) / 10, priceRials: undefined })),
    });
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  console.error("Admin API request failed", error instanceof Error ? error.name : "UnknownError");
  res.status(500).json({ error: "دریافت اطلاعات پنل انجام نشد." });
});

const port = Number(process.env.ADMIN_API_PORT || 4001);
const server = app.listen(port, "127.0.0.1", () => console.info(`Admin Express API listening on 127.0.0.1:${port}`));
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => server.close(() => process.exit(0)));
