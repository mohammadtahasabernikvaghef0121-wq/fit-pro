import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentStatusLabel, requestStatusLabel } from "@/lib/labels";

export const metadata = { title: "پرونده مشتری", robots: { index: false, follow: false } };
const date = (value: Date) => new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { dateStyle: "medium", timeZone: "Asia/Tehran" }).format(value);

export default async function ClientDetails({ params }: { params: Promise<{ id: string }> }) {
  const admin = await currentUser();
  if (!admin) redirect("/login?next=/admin/clients");
  if (admin.role !== "ADMIN") redirect("/dashboard");
  const { id } = await params;
  const client = await db.user.findUnique({
    where: { id, role: "CLIENT" },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        include: {
          package: true,
          payments: { orderBy: { createdAt: "desc" } },
          plans: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!client) notFound();
  const delivered = client.requests.flatMap(request => request.plans.map(plan => ({ plan, request })));

  return <main className="container page">
    <Link href="/admin/clients">← بازگشت به مراجعان</Link>
    <h1>پرونده مشتری</h1>
    <section className="grid3">
      <article className="card"><b>نام</b><p>{client.name || "ثبت نشده"}</p></article>
      <article className="card"><b>شماره همراه</b><p dir="ltr">{client.phone}</p></article>
      <article className="card"><b>تعداد برنامه‌های تحویل‌شده</b><p>{delivered.length.toLocaleString("en-US")}</p></article>
    </section>

    <h2 style={{ marginTop: 30 }}>برنامه‌های تحویل‌شده</h2>
    {delivered.length === 0
      ? <div className="card">هنوز برنامه‌ای به این مشتری تحویل نشده است.</div>
      : <div className="admin-support-list">{delivered.map(({ plan, request }) => <article className="card" key={plan.id}>
        <span className="eyebrow">{request.package.title}</span>
        <h3>{plan.title}</h3>
        <p className="muted">تاریخ تحویل: {date(plan.createdAt)}</p>
        <p><a className="btn small" href={`/api/plans/${plan.id}`}>دریافت برنامه</a></p>
        <Link href={`/admin/requests/${request.id}`}>مشاهده جزئیات سفارش</Link>
      </article>)}</div>}

    <h2 style={{ marginTop: 30 }}>سفارش‌ها و پرداخت‌ها</h2>
    {client.requests.length === 0
      ? <div className="card">سفارشی برای این مشتری ثبت نشده است.</div>
      : <div className="table-wrap"><table><thead><tr><th>برنامه</th><th>تاریخ سفارش</th><th>وضعیت سفارش</th><th>وضعیت پرداخت</th><th>برنامه تحویلی</th><th></th></tr></thead>
        <tbody>{client.requests.map(request => <tr key={request.id}>
          <td>{request.package.title}</td><td>{date(request.createdAt)}</td>
          <td>{requestStatusLabel[request.status] ?? request.status}</td>
          <td>{request.payments[0] ? paymentStatusLabel[request.payments[0].status] : "—"}</td>
          <td>{request.plans.map(plan => <a key={plan.id} href={`/api/plans/${plan.id}`} style={{ display: "block" }}>{plan.title}</a>)}</td>
          <td><Link href={`/admin/requests/${request.id}`}>جزئیات</Link></td>
        </tr>)}</tbody>
      </table></div>}
  </main>;
}
