import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/site";
import { siteConfig } from "@/lib/config";
import SiteAnalytics from "@/components/site-analytics";
import MotionEnhancer from "@/components/motion-enhancer";
import ExitIntentModal from "@/components/exit-intent-modal";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: `${siteConfig.brand} | مربی‌گری تندرستی`, template: `%s | ${siteConfig.brand}` },
  description: "همراهی تخصصی برای ساختن عادت‌های پایدار در تمرین و تغذیه.",
  openGraph: { type: "website", locale: "fa_IR", siteName: siteConfig.brand, title: `${siteConfig.brand} | مربی‌گری تندرستی`, description: "برنامه تمرین و تغذیه متناسب با زندگی شما." },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fff",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="fa" dir="rtl"><body><SiteAnalytics /><MotionEnhancer /><SiteHeader />{children}<SiteFooter /><ExitIntentModal /></body></html>;
}
