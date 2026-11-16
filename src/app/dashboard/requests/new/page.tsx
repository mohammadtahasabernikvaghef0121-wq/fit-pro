import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptHealthData } from "@/lib/health-data";
import OrderCheckout from "@/components/order-checkout";
import RequestForm from "@/components/request-form";

export const metadata = { title: "ثبت سفارش برنامه", robots: { index: false, follow: false } };

export default async function NewRequest({ searchParams }: { searchParams: Promise<{ package?: string; request?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard/requests/new");
  const query = await searchParams;

  if (query.request) {
    const request = await db.coachingRequest.findFirst({
      where: { id: query.request, userId: user.id },
      include: { package: true, payments: { orderBy: { createdAt: "desc" } } },
    });
    if (!request) redirect("/dashboard");

    const hasPaid = request.payments.some(payment => payment.status === "PAID");
    if (request.status === "PAID" && hasPaid) {
      return <main className="container page"><span className="eyebrow">مرحله دوم · اطلاعات برنامه</span><h1>اطلاعات لازم برای برنامه‌تان</h1><RequestForm requestId={request.id} packageId={request.packageId} title={request.package.title} initial={decryptHealthData(request.intake)} /></main>;
    }
    if (request.status === "NEW" && !hasPaid) {
      return <main className="container page"><h1>ادامه پرداخت سفارش</h1><OrderCheckout packageId={request.packageId} title={request.package.title} priceRials={Number(request.package.priceRials)} customerName={user.name ?? ""} phone={user.phone} requestId={request.id} /></main>;
    }
    redirect("/dashboard");
  }

  const pkg = query.package ? await db.coachingPackage.findFirst({ where: { id: query.package, active: true } }) : null;
  if (!pkg) redirect("/shop");

  return <main className="container page">
    <span className="eyebrow">مرحله اول · پرداخت</span>
    <h1>ثبت سفارش برنامه</h1>
    <OrderCheckout packageId={pkg.id} title={pkg.title} priceRials={Number(pkg.priceRials)} customerName={user.name ?? ""} phone={user.phone} />
  </main>;
}
