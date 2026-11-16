import Link from "next/link";
import { db } from "@/lib/db";
import { formatTomans } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Pricing() {
  const packages = await db.coachingPackage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return <main className="container page">
    <span className="eyebrow">شفاف و متناسب با نیاز شما</span>
    <h1>برنامه‌های همراهی</h1>
    <p className="muted">برنامه را انتخاب کنید، پرداخت را انجام دهید و پس از تأیید، اطلاعات لازم برای تنظیم برنامه را در پنل وارد کنید.</p>
    <div className="grid3" style={{ marginTop: 30 }}>
      {packages.map(item => <article key={item.id} className="card">
        <h2>{item.title}</h2>
        <p className="muted">{item.description}</p>
        <p>مدت همراهی: {item.durationDays.toLocaleString("en-US")} روز</p>
        <ul>{(Array.isArray(item.deliverables) ? item.deliverables : []).map((deliverable, index) => <li key={index}>{String(deliverable)}</li>)}</ul>
        {item.slug === "combined" && <p><span className="tag">15% تخفیف · قیمت قبلی 1,000,000 تومان</span></p>}
        <div className="price">{formatTomans(item.priceRials)} <small>تومان</small></div>
        <Link className="btn" href={`/login?next=${encodeURIComponent(`/dashboard/requests/new?package=${item.id}`)}`}>انتخاب و پرداخت</Link>
      </article>)}
    </div>
    {packages.length === 0 && <div className="card">در حال آماده‌سازی برنامه‌ها هستیم. کمی بعد دوباره سر بزنید.</div>}
  </main>;
}
