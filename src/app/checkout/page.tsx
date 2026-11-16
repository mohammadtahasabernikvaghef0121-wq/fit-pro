import type { Metadata } from "next";
import { DemoCheckoutFlow } from "@/components/shop-cart";
export const metadata: Metadata = { title: "تسویه‌حساب آزمایشی", robots: { index: false, follow: false } };
export default function CheckoutPage() { return <DemoCheckoutFlow/>; }
