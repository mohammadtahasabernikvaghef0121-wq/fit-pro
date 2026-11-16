import type { Metadata } from "next";
import { DemoCheckoutFlow } from "@/components/shop-cart";
export const metadata: Metadata = { title: "DEMO / TEST PAYMENT", robots: { index: false, follow: false } };
export default function DemoCheckoutPage() { return <DemoCheckoutFlow/>; }
