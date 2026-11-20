import type { Metadata } from "next";
import CheckoutReceipt from "@/components/checkout-receipt";

export const metadata: Metadata = {
  title: "رسید پرداخت آزمایشی",
  robots: { index: false, follow: false },
};

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return <CheckoutReceipt orderId={order ?? ""} />;
}
