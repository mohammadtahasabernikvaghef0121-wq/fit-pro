import type { Metadata } from "next";
import BmiCalculator from "@/components/bmi-calculator";

export const metadata: Metadata = {
  title: "محاسبه شاخص توده بدنی | Fit Pro",
  description: "شاخص توده بدنی خود را با قد و وزن محاسبه کنید.",
  alternates: { canonical: "/bmi-calculator" },
};

export default function BmiCalculatorPage() {
  return <BmiCalculator />;
}
