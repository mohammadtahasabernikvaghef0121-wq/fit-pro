"use client";

import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import AnimatedCounter from "@/components/animated-counter";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type RangeKey = "7d" | "30d" | "12m" | "all";
type View = "overview" | "control";
type DashboardData = {
  metrics: { visitors: number; requests: number; transactions: number; revenueToman: number };
  requests: { id: string; name: string; phone: string; package: string; status: string; paymentStatus: string; createdAt: string; intake: Record<string, unknown>; plans: { id: string; title: string; createdAt: string }[] }[];
  payments: { id: string; orderRef: string; name: string; phone: string; package: string; amountToman: number; status: string; createdAt: string }[];
  packages: { id: string; slug: string; title: string; description: string; durationDays: number; priceToman: number; requestType: "NUTRITION" | "TRAINING" | "COMBINED"; active: boolean }[];
};
const emptyData: DashboardData = { metrics: { visitors: 0, requests: 0, transactions: 0, revenueToman: 0 }, requests: [], payments: [], packages: [] };
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
const money = (value: number) => `${number(value)} تومان`;
const date = (value: string) => new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }).format(new Date(value));

export default function AdminDashboard({ initialView }: { initialView: View }) {
  const view = initialView;
  const [range, setRange] = useState<RangeKey>("30d");
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");
  const [form, setForm] = useState({ title: "", slug: "", description: "", durationDays: "30", priceToman: "500000", requestType: "TRAINING" });
  const [notice, setNotice] = useState("");
  const [uploadingPlanFor, setUploadingPlanFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin-data/metrics?range=${range}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "دریافت اطلاعات انجام نشد.");
      setData(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد."); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void load(); });
    return () => { active = false; };
  }, [load]);
  const filteredRequests = useMemo(() => data.requests.filter((item) => `${item.name} ${item.phone} ${item.package} ${item.id}`.toLowerCase().includes(query.toLowerCase())), [data.requests, query]);
  const filteredPayments = useMemo(() => data.payments.filter((item) => `${item.name} ${item.phone} ${item.package} ${item.orderRef}`.toLowerCase().includes(query.toLowerCase())), [data.payments, query]);

  async function updatePackage(id: string, update: { active?: boolean; priceToman?: number }) {
    const response = await fetch(`/api/admin/packages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) });
    const result = await response.json();
    if (!response.ok) { setNotice(result.error || "تغییر ذخیره نشد."); return; }
    setNotice("تغییرات ذخیره شد."); await load();
  }

  async function createPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    const response = await fetch("/api/admin/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, durationDays: Number(form.durationDays), priceToman: Number(form.priceToman), deliverables: "" }) });
    const result = await response.json();
    if (!response.ok) { setNotice(result.error || "ساخت بسته انجام نشد."); return; }
    setForm({ title: "", slug: "", description: "", durationDays: "30", priceToman: "500000", requestType: "TRAINING" });
    setNotice("بستهٔ جدید ساخته شد."); await load();
  }

  async function uploadPlan(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    setNotice("");
    setUploadingPlanFor(requestId);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("requestId", requestId);
    try {
      const response = await fetch("/api/admin/plans", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "بارگذاری برنامه انجام نشد.");
      form.reset();
      setNotice("برنامه بارگذاری شد و در پنل مشتری قرار گرفت.");
      await load();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "بارگذاری برنامه انجام نشد.");
    } finally {
      setUploadingPlanFor(null);
    }
  }

  return <main className="admin-app" dir="rtl">
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/">FIT<span>PRO</span><small>پنل مدیریت</small></Link>
      <div className="admin-nav-label">فضای کاری</div>
      <Link href="/admin" className={`admin-nav-item ${view === "overview" ? "selected" : ""}`}><i>▦</i> نمای کلی</Link>
      <Link href="/admin/control" className={`admin-nav-item ${view === "control" ? "selected" : ""}`}><i>⚙</i> مدیریت سایت</Link>
      <Link href="/shop" className="admin-nav-item"><i>↗</i> مشاهدهٔ فروشگاه</Link>
      <div className="admin-side-bottom"><span className="admin-online-dot" /> سامانه فعال است <LogoutButton>خروج از حساب</LogoutButton></div>
    </aside>
    <section className="admin-main">
      <header className="admin-topbar"><div><span className="admin-eyebrow">FIT PRO / ADMIN</span><h1>{view === "overview" ? "نمای کلی" : "مدیریت سایت"}</h1></div><div className="admin-top-actions"><label className="admin-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی سفارش یا مشتری" /></label><button className="admin-refresh" onClick={() => void load()} aria-label="تازه‌سازی اطلاعات">↻</button><div className="admin-avatar">م</div></div></header>
      <div className="admin-content">
        {view === "overview" ? <>
          <div className="admin-welcome"><div><b>خوش آمدید</b><p>آمار وب‌سایت و سفارش‌های Fit Pro را از اینجا دنبال کنید.</p></div><label className="admin-select-label">بازهٔ گزارش<select value={range} onChange={(event) => setRange(event.target.value as RangeKey)}><option value="7d">۷ روز اخیر</option><option value="30d">۳۰ روز اخیر</option><option value="12m">۱۲ ماه اخیر</option><option value="all">از ابتدا</option></select></label></div>
          {error && <div className="admin-alert">{error} <button onClick={() => void load()}>تلاش دوباره</button></div>}
          {notice && <div className="admin-notice" role="status">{notice}</div>}
          <div className="admin-metrics">
            <Metric icon="◉" label="بازدیدها" value={number(data.metrics.visitors)} tone="red" loading={loading} detail="در بازهٔ انتخاب‌شده" />
            <Metric icon="▤" label="درخواست‌ها" value={number(data.metrics.requests)} tone="gold" loading={loading} detail="بدون پیش‌نویس‌ها" />
            <Metric icon="↗" label="تراکنش‌های موفق" value={number(data.metrics.transactions)} tone="green" loading={loading} detail="پرداخت واقعی تأییدشده" />
            <Metric icon=" تومان" label="درآمد تأییدشده" value={money(data.metrics.revenueToman)} tone="dark" loading={loading} detail="فقط پرداخت‌های واقعی" />
          </div>
          <div className="admin-section-heading"><div><span>فعالیت اخیر</span><h2>درخواست‌های مشتریان</h2></div><Link href="/admin/control">مدیریت بسته‌ها ←</Link></div>
          <div className="admin-table-wrap"><table><thead><tr><th>مشتری</th><th>بسته</th><th>وضعیت</th><th>پرداخت</th><th>زمان ثبت</th></tr></thead><tbody>{loading ? <tr><td colSpan={5}>در حال دریافت اطلاعات…</td></tr> : filteredRequests.length ? filteredRequests.map((item) => <tr key={item.id}><td><b>{item.name}</b><small>{item.phone}</small></td><td>{item.package}</td><td><Status value={item.status} /></td><td><Status value={item.paymentStatus} /></td><td>{date(item.createdAt)}<details className="admin-request-details"><summary>اطلاعات مشتری و ارسال برنامه</summary>{Object.values(item.intake).some((value) => value !== undefined && value !== null && String(value).length > 0) && <dl>{Object.entries(item.intake).filter(([, value]) => value !== undefined && value !== null && String(value).length > 0 && value !== true).map(([key, value]) => <div key={key}><dt>{({ age: "سن", height: "قد", weight: "وزن", goal: "هدف", experience: "سابقه تمرین", activityLevel: "سطح فعالیت", trainingDays: "روزهای تمرین", equipment: "امکانات تمرین", dietaryPreferences: "ترجیحات غذایی", allergies: "حساسیت غذایی", injuries: "آسیب‌دیدگی", healthConditions: "محدودیت سلامتی", notes: "توضیحات" } as Record<string, string>)[key] || key}</dt><dd>{String(value)}</dd></div>)}</dl>}{item.plans.length > 0 && <div className="admin-plan-list"><b>فایل‌های بارگذاری‌شده</b>{item.plans.map((plan) => <a href={`/api/plans/${plan.id}`} key={plan.id}>{plan.title}</a>)}</div>}{item.paymentStatus === "PAID" || item.paymentStatus === "DEMO_PAID" ? <form className="admin-plan-upload" onSubmit={(event) => void uploadPlan(event, item.id)}><label>عنوان برنامه<input name="title" required minLength={2} maxLength={120} placeholder="مثلاً برنامه تمرینی آذر" /></label><label>فایل برنامه (PDF، حداکثر 10 مگابایت)<input name="file" type="file" accept="application/pdf,.pdf" required /></label><button className="admin-primary" disabled={uploadingPlanFor === item.id}>{uploadingPlanFor === item.id ? "در حال بارگذاری…" : "بارگذاری و ارسال به مشتری"}</button></form> : <p className="admin-upload-hint">بعد از تأیید پرداخت، امکان بارگذاری برنامه فعال می‌شود.</p>}</details></td></tr>) : <tr><td colSpan={5}>در این بازه درخواستی ثبت نشده است.</td></tr>}</tbody></table></div>
          <div className="admin-section-heading"><div><span>وضعیت مالی</span><h2>تراکنش‌های اخیر</h2></div><span className="admin-muted">پرداخت آزمایشی در درآمد لحاظ نمی‌شود</span></div>
          <div className="admin-table-wrap"><table><thead><tr><th>شماره سفارش</th><th>مشتری</th><th>بسته</th><th>مبلغ</th><th>وضعیت</th><th>زمان</th></tr></thead><tbody>{loading ? <tr><td colSpan={6}>در حال دریافت اطلاعات…</td></tr> : filteredPayments.length ? filteredPayments.map((item) => <tr key={item.id}><td dir="ltr">{item.orderRef}</td><td><b>{item.name}</b><small>{item.phone}</small></td><td>{item.package}</td><td>{money(item.amountToman)}</td><td><Status value={item.status} /></td><td>{date(item.createdAt)}</td></tr>) : <tr><td colSpan={6}>تراکنشی در این بازه وجود ندارد.</td></tr>}</tbody></table></div>
        </> : <>
          <div className="admin-welcome"><div><b>کنترل محتوای فروشگاه</b><p>بسته‌های قابل خرید و وضعیت نمایش آن‌ها را مدیریت کنید.</p></div><label className="admin-select-label">فیلتر بسته‌ها<select value={packageFilter} onChange={(event) => setPackageFilter(event.target.value)}><option value="all">همهٔ بسته‌ها</option><option value="active">فقط فعال</option><option value="inactive">فقط غیرفعال</option></select></label></div>
          {error && <div className="admin-alert">{error}</div>}{notice && <div className="admin-notice">{notice}</div>}
          <div className="admin-section-heading"><div><span>کنترل فروش</span><h2>بسته‌های برنامه</h2></div><span className="admin-muted">{data.packages.length} بسته</span></div>
          <div className="admin-package-list">{loading ? <div className="admin-empty">در حال بارگذاری…</div> : data.packages.filter((item) => packageFilter === "all" || (packageFilter === "active" ? item.active : !item.active)).map((item) => <article className="admin-package" key={item.id}><div className="admin-package-copy"><span className={`admin-package-state ${item.active ? "is-active" : ""}`}>{item.active ? "فعال" : "غیرفعال"}</span><h3>{item.title}</h3><p>{item.description}</p><small>{number(item.durationDays)} روز · {item.requestType === "TRAINING" ? "تمرینی" : item.requestType === "NUTRITION" ? "تغذیه" : "ترکیبی"}</small></div><div className="admin-package-actions"><label>قیمت (تومان)<input type="number" min="1000" step="1000" defaultValue={item.priceToman} onBlur={(event) => { const next = Number(event.currentTarget.value); if (next > 0 && next !== item.priceToman) void updatePackage(item.id, { priceToman: next }); }} /></label><button className={`admin-toggle ${item.active ? "on" : ""}`} onClick={() => void updatePackage(item.id, { active: !item.active })}>{item.active ? "غیرفعال‌کردن" : "فعال‌کردن"}</button></div></article>)}</div>
          <div className="admin-section-heading"><div><span>افزودن مورد جدید</span><h2>ساخت بستهٔ برنامه</h2></div></div>
          <form className="admin-create-form" onSubmit={createPackage}><label>نام بسته<input required minLength={2} maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>شناسهٔ لاتین<input required pattern="[a-z0-9-]{2,60}" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="training-plan" /></label><label>قیمت به تومان<input required type="number" min="1000" value={form.priceToman} onChange={(e) => setForm({ ...form, priceToman: e.target.value })} /></label><label>مدت (روز)<input required type="number" min="1" max="3650" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} /></label><label>نوع بسته<select value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value })}><option value="TRAINING">تمرینی</option><option value="NUTRITION">تغذیه</option><option value="COMBINED">ترکیبی</option></select></label><label className="wide">توضیحات<textarea required minLength={10} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><button className="admin-primary" type="submit">ثبت بسته</button></form>
        </>}
      </div>
    </section>
  </main>;
}

function Metric({ icon, label, value, detail, tone, loading }: { icon: string; label: string; value: string; detail: string; tone: string; loading: boolean }) {
  return <article className="admin-metric" aria-busy={loading}><div className={`admin-metric-icon ${tone}`}>{icon}</div><span>{label}</span><strong>{loading ? "—" : <AnimatedCounter value={value} />}</strong><small>{detail}</small></article>;
}
function Status({ value }: { value: string }) {
  const good = ["PAID", "DELIVERED", "IN_PROGRESS"].includes(value);
  const labels: Record<string, string> = { PAID: "پرداخت‌شده", DEMO_PAID: "پرداخت آزمایشی", PENDING: "در انتظار", FAILED: "ناموفق", NEW: "جدید", UNDER_REVIEW: "در حال بررسی", IN_PROGRESS: "در حال انجام", DELIVERED: "تحویل‌شده", CANCELLED: "لغوشده", REFUNDED: "بازپرداخت" };
  return <span className={`admin-status ${good ? "good" : ""}`}>{labels[value] || value}</span>;
}
