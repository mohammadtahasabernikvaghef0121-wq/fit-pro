import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { DemoCheckoutFlow } from "@/components/shop-cart";
export const metadata: Metadata = { title: "تسویه‌حساب آزمایشی", robots: { index: false, follow: false } };
export default async function CheckoutPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/checkout");
  const mockMode = process.env.NODE_ENV === "development" && process.env.PAYMENT_MODE === "mock";
  return <DemoCheckoutFlow linkToIntake mockMode={mockMode} />;
}
