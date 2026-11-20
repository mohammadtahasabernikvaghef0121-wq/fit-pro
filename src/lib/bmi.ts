export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export type BmiResult = {
  value: number;
  category: BmiCategory;
};

export type BmiInputError = "height" | "weight";

/** BMI uses weight in kilograms divided by height in meters squared. */
export function calculateBmi(heightCm: number, weightKg: number): BmiResult | null {
  if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) return null;
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300) return null;

  const value = weightKg / (heightCm / 100) ** 2;
  const category: BmiCategory =
    value < 18.5 ? "underweight" : value < 25 ? "normal" : value < 30 ? "overweight" : "obese";

  return { value, category };
}

export function validateBmiInput(heightCm: number, weightKg: number): BmiInputError | null {
  if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) return "height";
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300) return "weight";
  return null;
}
