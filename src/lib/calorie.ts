export type CalorieGender = "female" | "male";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "high" | "very-high";

export const activityLevels: Record<ActivityLevel, { label: string; factor: number; detail: string }> = {
  sedentary: { label: "کم‌تحرک", factor: 1.2, detail: "بیشتر روز نشسته و ورزش کم یا بدون ورزش" },
  light: { label: "فعالیت سبک", factor: 1.375, detail: "ورزش سبک یا فعالیت 1 تا 3 روز در هفته" },
  moderate: { label: "فعالیت متوسط", factor: 1.55, detail: "ورزش متوسط یا فعالیت 3 تا 5 روز در هفته" },
  high: { label: "فعالیت زیاد", factor: 1.725, detail: "ورزش سنگین یا فعالیت 6 تا 7 روز در هفته" },
  "very-high": { label: "بسیار فعال", factor: 1.9, detail: "تمرین سنگین روزانه یا کار بدنی پرفشار" },
};

export type CalorieInput = {
  age: number;
  heightCm: number;
  weightKg: number;
  gender: CalorieGender;
  activityLevel: ActivityLevel;
};

export type CalorieEstimate = { restingCalories: number; dailyCalories: number };

export function estimateDailyCalories(input: CalorieInput): CalorieEstimate | null {
  const { age, heightCm, weightKg, gender, activityLevel } = input;
  if (!Number.isInteger(age) || age < 15 || age > 120) return null;
  if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) return null;
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300) return null;
  const activity = activityLevels[activityLevel];
  if (!activity) return null;

  const restingCalories = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === "male" ? 5 : -161);
  return {
    restingCalories: Math.round(restingCalories),
    dailyCalories: Math.round(restingCalories * activity.factor),
  };
}
