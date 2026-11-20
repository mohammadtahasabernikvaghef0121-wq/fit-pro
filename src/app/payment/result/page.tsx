import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTomans } from "@/lib/money";

export const metadata: Metadata = { title: "وضعیت پرداخت", robots: { index: false, follow: false } };

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(value);
}

export default async function PaymentResult({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; request?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/payment/result");

  const query = await searchParams;
  const request = query.request
    ? await db.coachingRequest.findFirst({
        where: { id: query.request, userId: user.id },
        include: {
          package: { select: { title: true } },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      })
    : null;
  const payment = request?.payments[0] ?? null;
  const status = payment?.status;
  const paid = status === "PAID" || status === "DEMO_PAID";
  const pending = status === "PENDING" || (!payment && query.status === "pending");
  const refunded = status === "REFUNDED";
  const failed = status === "FAILED" || (!payment && query.status === "failed");
  if (paid && request?.status === "PAID") {
    redirect(`/dashboard/requests/new?request=${encodeURIComponent(request.id)}`);
  }
  const title = paid ? "پرداخت تأیید شد" : pending ? "پرداخت در انتظار تأیید" : refunded ? "مبلغ بازپرداخت شد" : failed ? "پرداخت ناموفق بود" : "جزئیات پرداخت در دسترس نیست";
  const statusLabel = status === "DEMO_PAID" ? "موفق · آزمایشی" : status === "PAID" ? "موفق · تأییدشده" : status === "PENDING" || pending ? "در انتظار تأیید" : refunded ? "بازپرداخت‌شده" : "ناموفق";
  const date = payment ? formatDate(payment.paidAt ?? payment.createdAt) : null;
  const transactionId = payment?.trackId || payment?.orderRef || null;

  return (
    <main className="container page payment-result-page" dir="rtl">
      <section className={`payment-result-card ${paid ? "is-paid" : pending ? "is-pending" : "is-failed"}`}>
        <header className="payment-result-heading">
          <span className={`payment-result-symbol ${paid ? "" : pending ? "pending" : "failed"}`} aria-hidden="true">
            {paid ? "✓" : pending ? "…" : "!"}
          </span>
          <span className="eyebrow">FIT PRO / PAYMENT</span>
          <h1>{title}</h1>
          <span className={`payment-result-badge ${paid ? "good" : pending ? "waiting" : "bad"}`}>{statusLabel}</span>
        </header>

        {status === "DEMO_PAID" && (
          <p className="payment-demo-note">پرداخت آزمایشی است؛ پول واقعی جابه‌جا نشده است.</p>
        )}

        {payment && request ? (
          <section className="payment-details-grid" aria-label="جزئیات تراکنش">
            <article className="payment-detail-card payment-detail-product">
              <span className="payment-detail-icon" aria-hidden="true">▤</span>
              <div><span>محصول خریداری‌شده</span><strong>{request.package.title}</strong></div>
            </article>
            <article className="payment-detail-card">
              <span className="payment-detail-icon amount" aria-hidden="true">ت</span>
              <div><span>مبلغ</span><strong>{formatTomans(payment.amountRials)} <small>تومان</small></strong></div>
            </article>
            <article className="payment-detail-card">
              <span className="payment-detail-icon id" aria-hidden="true">#</span>
              <div><span>شناسه تراکنش</span><strong className="payment-detail-ltr" dir="ltr">{transactionId}</strong></div>
            </article>
            <article className="payment-detail-card">
              <span className="payment-detail-icon date" aria-hidden="true">◷</span>
              <div><span>تاریخ و ساعت</span><strong>{date}</strong></div>
            </article>
            <article className="payment-detail-card">
              <span className="payment-detail-icon status" aria-hidden="true">✓</span>
              <div><span>وضعیت پرداخت</span><strong>{statusLabel}</strong></div>
            </article>
            <article className="payment-detail-card">
              <span className="payment-detail-icon order" aria-hidden="true">⌁</span>
              <div><span>شماره سفارش</span><strong className="payment-detail-ltr" dir="ltr">{payment.orderRef}</strong></div>
            </article>
          </section>
        ) : (
          <p className="payment-result-empty">جزئیات این تراکنش برای حساب شما پیدا نشد.</p>
        )}

        <nav className="payment-result-actions" aria-label="اقدامات بعدی">
          {paid && request?.status === "PAID" && (
            <Link className="btn" href={`/dashboard/requests/new?request=${request.id}`}>تکمیل اطلاعات برنامه</Link>
          )}
          <Link className="btn light" href="/dashboard">رفتن به پنل کاربری</Link>
          <Link className="payment-back-link" href="/shop">بازگشت به فروشگاه</Link>
        </nav>
      </section>
    </main>
  );
}
