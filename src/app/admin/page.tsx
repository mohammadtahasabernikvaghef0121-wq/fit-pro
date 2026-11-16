import { formatTomans } from "@/lib/money";
import Link from "next/link";
import { db } from "@/lib/db";
import { tehranStartOfDay, tehranStartOfMonth, tehranStartOfWeek, tehranStartOfYear } from "@/lib/policies";
import { RevenueChart, RequestChart } from "@/components/admin-chart";
import { paymentStatusLabel, requestStatusLabel } from "@/lib/labels";

export const metadata = { title: "پنل اختصاصی مدیر", robots: { index: false, follow: false } };
const amount = (v: bigint | null) => `${formatTomans(v ?? BigInt(0))} تومان`;
const count = (v: number) => v.toLocaleString("en-US");
const jalali = (d: Date) => new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { dateStyle: "medium", timeZone: "Asia/Tehran" }).format(d);

export default async function Admin({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const params = await searchParams;
  const days = [7, 14, 30, 90].includes(Number(params.days)) ? Number(params.days) : 14;
  const now = new Date();
  const today = tehranStartOfDay(now); const week = tehranStartOfWeek(now); const month = tehranStartOfMonth(now); const year = tehranStartOfYear(now);
  const chartStart = new Date(today.getTime() - (days - 1) * 86400000);
  const windows = [{ key: "week", start: week }, { key: "month", start: month }, { key: "year", start: year }] as const;
  const [revenue, sales, visits, todayRevenue, currentMonthRequests, currentYearRequests, recentRequests, paidPayments, chartRequests] = await Promise.all([
    Promise.all(windows.map(({ start }) => db.payment.aggregate({ where: { status: "PAID", paidAt: { gte: start, lte: now } }, _sum: { amountRials: true } }))),
    Promise.all(windows.map(({ start }) => db.payment.count({ where: { status: "PAID", paidAt: { gte: start, lte: now } } }))),
    Promise.all(windows.map(({ start }) => db.siteVisit.count({ where: { visitedAt: { gte: start, lte: now } } }))),
    db.payment.aggregate({ where: { status: "PAID", paidAt: { gte: today, lte: now } }, _sum: { amountRials: true } }),
    db.coachingRequest.count({ where: { createdAt: { gte: month, lte: now }, status: { not: "DRAFT" } } }),
    db.coachingRequest.count({ where: { createdAt: { gte: year, lte: now }, status: { not: "DRAFT" } } }),
    db.coachingRequest.findMany({ where: { status: { not: "DRAFT" } }, include: { user: true, package: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.payment.findMany({ where: { status: "PAID", paidAt: { gte: chartStart, lte: now } }, select: { paidAt: true, amountRials: true } }),
    db.coachingRequest.findMany({ where: { status: { not: "DRAFT" }, createdAt: { gte: chartStart, lte: now } }, select: { createdAt: true } }),
  ]);
  const series = Array.from({ length: days }, (_, i) => {
    const day = new Date(chartStart.getTime() + i * 86400000); const next = new Date(day.getTime() + 86400000);
    const paid = Math.round(paidPayments.filter(p => p.paidAt && p.paidAt >= day && p.paidAt < next).reduce((s, p) => s + Number(p.amountRials), 0) / 10);
    const requests = chartRequests.filter(r => r.createdAt >= day && r.createdAt < next).length;
    return { label: new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { day: "numeric", month: "short", timeZone: "Asia/Tehran" }).format(day), paid, requests };
  });
  const cards = [
    ["درآمد هفتگی", amount(revenue[0]._sum.amountRials), "پرداخت‌های موفق از شنبه این هفته"], ["درآمد ماهانه", amount(revenue[1]._sum.amountRials), "از ابتدای ماه جاری"], ["درآمد سالانه", amount(revenue[2]._sum.amountRials), "از ابتدای سال جاری"],
    ["فروش هفتگی", count(sales[0]), "تراکنش موفق"], ["فروش ماهانه", count(sales[1]), "تراکنش موفق"], ["فروش سالانه", count(sales[2]), "تراکنش موفق"],
    ["بازدید هفتگی", count(visits[0]), "نمایش صفحه؛ بدون ذخیره IP"], ["بازدید ماهانه", count(visits[1]), "نمایش صفحه؛ بدون ذخیره IP"], ["بازدید سالانه", count(visits[2]), "نمایش صفحه؛ بدون ذخیره IP"],
  ];
  const testGateway = process.env.ZIBAL_MERCHANT === "zibal";
  return <main className="container dashboard"><aside className="side"><a className="active" href="/admin">نمای کلی</a><Link href="/admin/requests">درخواست‌ها</Link><Link href="/admin/support">پشتیبانی سایت</Link><Link href="/admin/packages">بسته‌ها و قیمت‌ها</Link><Link href="/admin/clients">مراجعان</Link><Link href="/admin/payments">تراکنش‌ها</Link></aside><section>
    <div className="dashhead"><div><span className="eyebrow">پنل خصوصی مالک</span><h1 style={{ margin: "8px 0" }}>نمای کلی Fit Pro</h1><p className="muted" style={{ margin: 0 }}>آمار این پنل فقط برای شماره مدیر تنظیم‌شده در محیط پروژه نمایش داده می‌شود.</p></div></div>
    <div className="alert">درگاه زیبال: {testGateway ? "حالت آزمایشی فعال" : "شناسه پذیرنده تنظیم شده"}. پرداخت فقط پس از تأیید درگاه در فروش و درآمد ثبت می‌شود.</div>
    <div className="stats owner-stats">{cards.map(([title, value, note]) => <div className="stat" key={title}><span>{title}</span><b>{value}</b><small className="muted">{note}</small></div>)}</div>
    <div className="stats" style={{ marginTop: 13 }}><div className="stat">درآمد امروز<b>{amount(todayRevenue._sum.amountRials)}</b></div><div className="stat">درخواست‌های این ماه<b>{count(currentMonthRequests)}</b></div><div className="stat">درخواست‌های امسال<b>{count(currentYearRequests)}</b></div></div>
    <form className="card" method="get" style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}><label htmlFor="days">بازه نمودار</label><select id="days" name="days" defaultValue={String(days)}><option value="7">7 روز</option><option value="14">14 روز</option><option value="30">30 روز</option><option value="90">90 روز</option></select><button className="btn small">اعمال</button></form>
    <div className="grid3" style={{ marginTop: 16 }}><div className="card" style={{ gridColumn: "span 2" }}><h3>روند درآمد پرداخت‌شده</h3><p className="muted">فقط تراکنش‌های موفق، بر پایه زمان تهران</p><RevenueChart data={series}/></div><div className="card"><h3>روند درخواست‌ها</h3><p className="muted">بر پایه زمان ثبت در تهران</p><RequestChart data={series}/></div></div>
    <div className="dashhead" style={{ marginTop: 28 }}><h2>درخواست‌های اخیر</h2><Link href="/admin/requests" className="btn light small">همه درخواست‌ها ←</Link></div>
    {recentRequests.length === 0 ? <div className="card">هنوز درخواستی ثبت نشده است.</div> : <div className="table-wrap"><table><thead><tr><th>مراجع</th><th>بسته</th><th>تاریخ</th><th>پرداخت</th><th>وضعیت</th><th></th></tr></thead><tbody>{recentRequests.map(r => <tr key={r.id}><td>{r.user.phone}</td><td>{r.package.title}</td><td>{jalali(r.createdAt)}</td><td>{r.payments[0] ? paymentStatusLabel[r.payments[0].status] ?? "—" : "—"}</td><td><span className="badge">{requestStatusLabel[r.status] ?? r.status}</span></td><td><Link href={`/admin/requests/${r.id}`}>جزئیات</Link></td></tr>)}</tbody></table></div>}
    <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>فروش برابر تعداد پرداخت‌های تأییدشده است. آمار بازدید، نمایش صفحه‌های عمومی را می‌شمارد و اطلاعات شناسایی بازدیدکننده ذخیره نمی‌کند.</p>
  </section></main>;
}
