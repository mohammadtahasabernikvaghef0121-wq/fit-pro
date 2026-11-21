import type { Metadata } from "next";
import CalorieCalculator from "@/components/calorie-calculator";

export const metadata: Metadata = {
  title: "محاسبه کالری روزانه | Fit Pro",
  description: "برآورد کالری مورد نیاز روزانه بر پایه سن، قد، وزن، جنسیت و میزان فعالیت.",
  alternates: { canonical: "/calorie-calculator" },
};

export default function CalorieCalculatorPage() {
  return <CalorieCalculator />;
}
