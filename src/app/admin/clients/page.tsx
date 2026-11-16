import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "مراجعان", robots: { index: false, follow: false } };

export default async function Clients() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin/clients");
  if (user.role !== "ADMIN") redirect("/dashboard");
  const clients = await db.user.findMany({
    where: { role: "CLIENT" },
    include: { _count: { select: { requests: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <main className="container page">
    <h1>مراجعان</h1>
    <p className="muted">برای مشاهده سفارش‌ها و همه‌ی برنامه‌های تحویل‌شده، پرونده‌ی هر مشتری را باز کنید.</p>
    <div className="table-wrap"><table><thead><tr><th>شماره همراه</th><th>نام</th><th>تعداد سفارش</th><th>عضویت</th><th></th></tr></thead>
      <tbody>{clients.map(client => <tr key={client.id}>
        <td dir="ltr">{client.phone}</td><td>{client.name ?? "—"}</td>
        <td>{client._count.requests.toLocaleString("en-US")}</td>
        <td>{new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { dateStyle: "medium", timeZone: "Asia/Tehran" }).format(client.createdAt)}</td>
        <td><Link href={`/admin/clients/${client.id}`}>مشاهده پرونده</Link></td>
      </tr>)}</tbody>
    </table></div>
  </main>;
}
