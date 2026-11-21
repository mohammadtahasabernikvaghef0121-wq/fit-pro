import { describe, expect, it } from "vitest";
import { estimateDailyCalories } from "@/lib/calorie";

describe("daily calorie estimates", () => {
  it("estimates resting and maintenance calories for a man", () => {
    expect(estimateDailyCalories({ age: 30, heightCm: 180, weightKg: 80, gender: "male", activityLevel: "sedentary" }))
      .toEqual({ restingCalories: 1780, dailyCalories: 2136 });
  });

  it("estimates maintenance calories for a woman using the selected activity level", () => {
    expect(estimateDailyCalories({ age: 30, heightCm: 170, weightKg: 65, gender: "female", activityLevel: "moderate" }))
      .toEqual({ restingCalories: 1402, dailyCalories: 2172 });
  });

  it("accepts ages from 15 and rejects values outside supported ranges", () => {
    expect(estimateDailyCalories({ age: 17, heightCm: 170, weightKg: 65, gender: "female", activityLevel: "moderate" })).not.toBeNull();
    expect(estimateDailyCalories({ age: 14, heightCm: 170, weightKg: 65, gender: "female", activityLevel: "moderate" })).toBeNull();
    expect(estimateDailyCalories({ age: 30, heightCm: 260, weightKg: 65, gender: "female", activityLevel: "moderate" })).toBeNull();
  });
});
