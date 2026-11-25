"use client";

import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import AnimatedCounter from "@/components/animated-counter";

type Payment = { id: string; orderRef: string; amountToman: number; status: string; createdAt: string; paidAt: string | null; programTitle: string };
type Program = { id: string; title: string; description: string; durationDays: number; requestType: string; status: string; createdAt: string; paymentStatus: string; intake: Record<string, unknown>; plans: { id: string; title: string; createdAt: string }[]; payments: Payment[] };
type DashboardData = { account: { id: string; name: string | null; phone: string; createdAt: string }; programs: Program[]; payments: Payment[]; summary: { programCount: number; deliveredCount: number; transactionCount: number; paidTotalToman: number } };
const formatNumber = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
const formatMoney = (value: number) => `${formatNumber(value)} تومان`;
const formatDate = (value: string) => new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { dateStyle: "medium", timeZone: "Asia/Tehran" }).format(new Date(value));
const typeName: Record<string, string> = { TRAINING: "برنامهٔ تمرینی", NUTRITION: "برنامهٔ غذایی", COMBINED: "بستهٔ ترکیبی" };
const requestName: Record<string, string> = { DRAFT: "پیش‌نویس", NEW: "در انتظار پرداخت", PAID: "تکمیل اطلاعات", UNDER_REVIEW: "در حال بررسی", IN_PROGRESS: "در حال آماده‌سازی", DELIVERED: "تحویل‌شده", CANCELLED: "لغوشده" };
const paymentName: Record<string, string> = { PAID: "پرداخت‌شده", DEMO_PAID: "پرداخت آزمایشی", PENDING: "در انتظار پرداخت", FAILED: "ناموفق", REFUNDED: "بازپرداخت‌شده" };

export default function UserDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [paymentSort, setPaymentSort] = useState("newest");

  useEffect(() => {
    let active = true;
    fetch("/api/user-data/user-dashboard", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "دریافت اطلاعات حساب انجام نشد.");
        return result as DashboardData;
      })
      .then((result) => { if (active) setData(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const programs = useMemo(() => (data?.programs ?? []).filter((program) => selectedProgram === "all" || program.requestType === selectedProgram), [data, selectedProgram]);
  const payments = useMemo(() => {
    const list = [...(data?.payments ?? [])];
    if (paymentSort === "oldest") return list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    if (paymentSort === "amount-high") return list.sort((a, b) => b.amountToman - a.amountToman);
    if (paymentSort === "amount-low") return list.sort((a, b) => a.amountToman - b.amountToman);
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [data, paymentSort]);

  return <main className="user-dashboard" dir="rtl">
    <aside className="user-side">
      <div className="user-brand">FIT<span>PRO</span><small>پنل کاربری</small></div>
      <span className="user-nav-caption">حساب من</span>
      <a className="user-nav-link active" href="#overview">▦ <span>نمای کلی</span></a>
      <a className="user-nav-link" href="#programs">▤ <span>برنامه‌های من</span></a>
      <a className="user-nav-link" href="#payments">↗ <span>تراکنش‌ها</span></a>
      <Link className="user-nav-link" href="/support">? <span>پشتیبانی</span></Link>
      <Link className="user-nav-link" href="/shop">＋ <span>خرید برنامه</span></Link>
      <div className="user-side-bottom"><LogoutButton>خروج از حساب ←</LogoutButton></div>
    </aside>
    <section className="user-main" id="overview">
      <header className="user-topbar"><div><span className="user-eyebrow">FIT PRO / MY ACCOUNT</span><h1>پنل کاربری</h1></div><div className="user-profile-chip"><div className="user-avatar">{(data?.account.name || "ک").trim().charAt(0)}</div><span>{data?.account.name || "حساب کاربری"}<small dir="ltr">{data?.account.phone || ""}</small></span></div></header>
      <div className="user-content">
        <div className="user-welcome"><div><b>{data?.account.name ? `سلام ${data.account.name}، خوش آمدی` : "خوش آمدی"}</b><p>وضعیت برنامه‌ها و پرداخت‌های حساب خودت را از اینجا دنبال کن.</p></div><Link className="btn small" href="/shop">مشاهدهٔ برنامه‌ها</Link></div>
        {error && <div className="user-alert" role="alert">{error} <Link href="/login?next=/dashboard">ورود دوباره</Link></div>}
        <div className="user-metrics" aria-busy={loading}>
          <Metric label="برنامه‌های ثبت‌شده" value={loading ? "—" : formatNumber(data?.summary.programCount ?? 0)} icon="▤" tone="red" />
          <Metric label="برنامه‌های تحویل‌شده" value={loading ? "—" : formatNumber(data?.summary.deliveredCount ?? 0)} icon="✓" tone="green" progress={loading || !data ? undefined : data.summary.programCount ? (data.summary.deliveredCount / data.summary.programCount) * 100 : 0} />
          <Metric label="تراکنش‌ها" value={loading ? "—" : formatNumber(data?.summary.transactionCount ?? 0)} icon="↗" tone="gold" />
          <Metric label="مجموع پرداخت واقعی" value={loading ? "—" : formatMoney(data?.summary.paidTotalToman ?? 0)} icon="تومان" tone="dark" />
        </div>

        <section className="user-account-card"><div className="user-account-icon">{(data?.account.name || "ک").trim().charAt(0)}</div><div className="user-account-info"><span>اطلاعات حساب</span><strong>{data?.account.name || "نام ثبت نشده"}</strong><small dir="ltr">{data?.account.phone || "—"}</small></div><div className="user-account-meta"><span>عضویت از</span><b>{data?.account.createdAt ? formatDate(data.account.createdAt) : "—"}</b></div></section>

        <section className="user-section" id="programs"><div className="user-section-head"><div><span>سفارش‌ها و برنامه‌ها</span><h2>برنامه‌های من</h2></div><label>نوع برنامه<select aria-label="فیلتر نوع برنامه" value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)}><option value="all">همهٔ برنامه‌ها</option><option value="TRAINING">تمرینی</option><option value="NUTRITION">غذایی</option><option value="COMBINED">ترکیبی</option></select></label></div>
          {loading ? <div className="user-empty">در حال دریافت برنامه‌ها…</div> : programs.length === 0 ? <div className="user-empty"><b>هنوز برنامه‌ای برای نمایش نداری</b><p>بعد از خرید برنامه، جزئیات و فایل‌های تحویلی در همین بخش قرار می‌گیرند.</p><Link className="btn small" href="/shop">رفتن به فروشگاه</Link></div> : <div className="user-program-list">{programs.map((program) => <article className="user-program-card" key={program.id}><div className="user-program-top"><div><span className="user-program-type">{typeName[program.requestType] || "برنامه"}</span><h3>{program.title}</h3></div><span className={`user-state ${program.status === "DELIVERED" ? "done" : ""}`}>{requestName[program.status] || program.status}</span></div><p className="user-program-description">{program.description}</p><div className="user-program-facts"><span>مدت <b>{formatNumber(program.durationDays)} روز</b></span><span>ثبت سفارش <b>{formatDate(program.createdAt)}</b></span><span>پرداخت <b>{paymentName[program.paymentStatus] || paymentName.PENDING}</b></span></div>
            {program.status === "PAID" && <Link className="btn small" href={`/dashboard/requests/new?request=${encodeURIComponent(program.id)}`}>تکمیل اطلاعات برنامه</Link>}
            {Object.values(program.intake).some((value) => value !== undefined && value !== null && String(value).length > 0) && <div className="user-intake"><span>اطلاعات برنامه</span>{program.intake.height != null && <b>قد: {String(program.intake.height)} سانتی‌متر</b>}{program.intake.weight != null && <b>وزن: {String(program.intake.weight)} کیلوگرم</b>}{program.intake.goal != null && <b>هدف: {String(program.intake.goal)}</b>}</div>}
            {program.plans.length > 0 && <div className="user-delivered-plans"><span>فایل‌های برنامه</span>{program.plans.map((plan) => <div className="user-delivered-plan" key={plan.id}><div><b>{plan.title}</b><small>{formatDate(plan.createdAt)} · PDF</small></div><Link className="btn small" href={`/dashboard/plans/${encodeURIComponent(plan.id)}`}>مشاهده برنامه</Link></div>)}</div>}
          </article>)}</div>}
        </section>

        <section className="user-section" id="payments"><div className="user-section-head"><div><span>سوابق مالی حساب</span><h2>تراکنش‌ها</h2></div><label>مرتب‌سازی<select aria-label="مرتب‌سازی تراکنش‌ها" value={paymentSort} onChange={(event) => setPaymentSort(event.target.value)}><option value="newest">جدیدترین</option><option value="oldest">قدیمی‌ترین</option><option value="amount-high">بیشترین مبلغ</option><option value="amount-low">کمترین مبلغ</option></select></label></div>
          {loading ? <div className="user-empty">در حال دریافت تراکنش‌ها…</div> : payments.length === 0 ? <div className="user-empty">هنوز تراکنشی برای نمایش ثبت نشده است.</div> : <div className="user-table-wrap"><table><thead><tr><th>برنامه</th><th>شمارهٔ سفارش</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><b>{payment.programTitle}</b></td><td dir="ltr">{payment.orderRef}</td><td>{formatMoney(payment.amountToman)}</td><td><span className={`user-state ${payment.status === "PAID" ? "done" : ""}`}>{paymentName[payment.status] || payment.status}</span></td><td>{formatDate(payment.paidAt || payment.createdAt)}</td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </section>
  </main>;
}

function Metric({ label, value, icon, tone, progress }: { label: string; value: string; icon: string; tone: string; progress?: number }) {
  const circumference = 2 * Math.PI * 17;
  const ringStyle = progress === undefined ? undefined : { "--ring-target-offset": circumference * (1 - Math.max(0, Math.min(100, progress)) / 100) } as CSSProperties;
  return <article className={`user-metric ${progress === undefined ? "" : "has-progress"}`}>
    <div className="user-metric-icon-frame">
      {progress !== undefined && <svg className="user-progress-ring" viewBox="0 0 40 40" aria-hidden="true"><circle className="user-progress-ring-track" cx="20" cy="20" r="17" /><circle className="user-progress-ring-value" cx="20" cy="20" r="17" style={ringStyle} /></svg>}
      <div className={`user-metric-icon ${tone}`}>{icon}</div>
    </div>
    <span>{label}</span><strong><AnimatedCounter value={value} /></strong><small>حساب شخصی شما</small>
  </article>;
}
