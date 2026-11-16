import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "نتیجه پرداخت", robots: { index: false, follow: false } };

export default async function PaymentResult({ searchParams }: { searchParams: Promise<{ status?: string; request?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const request = query.request ? await db.coachingRequest.findFirst({
    where: { id: query.request, userId: user.id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  }) : null;
  const paymentStatus = request?.payments[0]?.status;
  const paid = paymentStatus === "PAID";
  const pending = paymentStatus === "PENDING" || query.status === "pending";

  return <main className="container page">
    <section className="card" style={{ maxWidth: 650 }}>
      <span className="eyebrow">وضعیت سفارش</span>
      <h1>{paid ? "پرداخت تأیید شد" : pending ? "پرداخت در حال بررسی است" : "پرداخت نهایی نشد"}</h1>
      <p className="muted">{paid
        ? "حالا اطلاعات لازم برای تنظیم برنامه را وارد کنید. وضعیت فقط پس از تأیید درگاه پرداخت تغییر می‌کند."
        : pending
          ? "تأیید قطعی هنوز دریافت نشده است. کمی بعد وضعیت سفارش را در پنل بررسی کنید."
          : "این سفارش تا زمان تأیید پرداخت فعال نمی‌شود. می‌توانید از پنل وضعیت را دوباره بررسی کنید."}</p>
      {paid && request?.status === "PAID"
        ? <Link className="btn" href={`/dashboard/requests/new?request=${request.id}`}>تکمیل اطلاعات برنامه</Link>
        : <Link className="btn" href="/dashboard">رفتن به پنل کاربری</Link>}
    </section>
  </main>;
}
