"use client";

import { useMemo, useState } from "react";
import styles from "./calorie-calculator.module.css";
import { activityLevels, estimateDailyCalories, type ActivityLevel, type CalorieGender } from "@/lib/calorie";

const numberFormat = new Intl.NumberFormat("en-US");

export default function CalorieCalculator() {
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("72");
  const [gender, setGender] = useState<CalorieGender | "">("");
  const [activity, setActivity] = useState<ActivityLevel | "">("");

  const estimate = useMemo(() => {
    if (!gender || !activity || !age || !height || !weight) return null;
    return estimateDailyCalories({
      age: Number(age),
      heightCm: Number(height),
      weightKg: Number(weight),
      gender,
      activityLevel: activity,
    });
  }, [age, height, weight, gender, activity]);

  const invalidAge = age !== "" && (!Number.isInteger(Number(age)) || Number(age) < 15 || Number(age) > 120);
  const invalidHeight = height !== "" && (!Number.isFinite(Number(height)) || Number(height) < 100 || Number(height) > 250);
  const invalidWeight = weight !== "" && (!Number.isFinite(Number(weight)) || Number(weight) < 20 || Number(weight) > 300);
  const selectedActivity = activity ? activityLevels[activity] : null;

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <section className={styles.shell} aria-labelledby="calorie-title">
        <header className={styles.intro}>
          <span className={styles.brand}><span>FP</span> Fit <b>Pro</b></span>
          <span className={styles.kicker}>CALORIE ESTIMATOR</span>
          <h1 id="calorie-title">محاسبه کالری روزانه</h1>
          <p>با وارد کردن مشخصات بدن و میزان فعالیت، برآورد کالری نگهدارنده وزن را ببینید.</p>
        </header>

        <div className={styles.layout}>
          <section className={styles.formCard} aria-label="اطلاعات مورد نیاز برای محاسبه">
            <div className={styles.sectionTitle}><span aria-hidden="true">↗</span><div><h2>اطلاعات شما</h2><p>مقادیر را برای محاسبه تخمینی وارد کنید.</p></div></div>

            <div className={styles.fields}>
              <label className={styles.field} htmlFor="calorie-age"><span>سن</span><span className={styles.inputWrap}><input id="calorie-age" type="number" inputMode="numeric" min="15" max="120" step="1" value={age} onFocus={() => { if (age === "25") setAge(""); }} onChange={(event) => setAge(event.currentTarget.value)} aria-invalid={invalidAge} /><small>سال</small></span>{invalidAge && <small className={styles.error}>سن باید بین 15 تا 120 سال باشد.</small>}</label>
              <label className={styles.field} htmlFor="calorie-height"><span>قد</span><span className={styles.inputWrap}><input id="calorie-height" type="number" inputMode="decimal" min="100" max="250" step="1" value={height} onFocus={() => { if (height === "175") setHeight(""); }} onChange={(event) => setHeight(event.currentTarget.value)} aria-invalid={invalidHeight} /><small>cm</small></span>{invalidHeight && <small className={styles.error}>قد باید بین 100 تا 250 سانتی‌متر باشد.</small>}</label>
              <label className={styles.field} htmlFor="calorie-weight"><span>وزن</span><span className={styles.inputWrap}><input id="calorie-weight" type="number" inputMode="decimal" min="20" max="300" step="0.1" value={weight} onFocus={() => { if (weight === "72") setWeight(""); }} onChange={(event) => setWeight(event.currentTarget.value)} aria-invalid={invalidWeight} /><small>kg</small></span>{invalidWeight && <small className={styles.error}>وزن باید بین 20 تا 300 کیلوگرم باشد.</small>}</label>
              <label className={styles.field} htmlFor="calorie-gender"><span>جنسیت مورد استفاده در فرمول</span><select id="calorie-gender" value={gender} onChange={(event) => setGender(event.currentTarget.value as CalorieGender | "")}><option value="">انتخاب کنید</option><option value="female">زن</option><option value="male">مرد</option></select><small className={styles.helper}>این انتخاب فقط برای ضریب تخمینی فرمول استفاده می‌شود.</small></label>
            </div>

            <fieldset className={styles.activityFieldset}>
              <legend>سطح فعالیت روزانه</legend>
              <div className={styles.activityOptions}>
                {(Object.entries(activityLevels) as [ActivityLevel, (typeof activityLevels)[ActivityLevel]][]).map(([key, option]) => (
                  <label className={`${styles.activityOption} ${activity === key ? styles.activitySelected : ""}`} key={key}>
                    <input type="radio" name="activity-level" value={key} checked={activity === key} onChange={() => setActivity(key)} />
                    <span className={styles.radioMark} aria-hidden="true" />
                    <span><b>{option.label}</b><small>{option.detail}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className={styles.resultCard} aria-live="polite" aria-label="برآورد کالری روزانه">
            <div className={styles.resultHead}><div><span>برآورد شما</span><h2>کالری مورد نیاز روزانه</h2></div><span className={styles.resultIcon} aria-hidden="true">◉</span></div>
            {estimate ? <>
              <div className={styles.calorieNumber}>{numberFormat.format(estimate.dailyCalories)} <span>کیلوکالری</span></div>
              <p className={styles.maintenance}>در روز برای حفظ وزن فعلی</p>
              <div className={styles.resultDetails}>
                <div><span>مصرف در حالت استراحت</span><b>{numberFormat.format(estimate.restingCalories)} <small>kcal</small></b></div>
                <div><span>سطح فعالیت</span><b>{selectedActivity?.label}</b></div>
              </div>
              <p className={styles.resultNote}>این مقدار تخمینی است و نیاز واقعی هر فرد می‌تواند متفاوت باشد.</p>
            </> : <div className={styles.empty}>
              <span aria-hidden="true">✳</span>
              <p>{invalidAge || invalidHeight || invalidWeight ? "مقادیر را در بازه مشخص‌شده وارد کنید." : "جنسیت و سطح فعالیت را انتخاب کنید تا تخمین نمایش داده شود."}</p>
            </div>}
            <div className={styles.formula}><b>روش محاسبه</b><span>تخمین انرژی استراحت × ضریب فعالیت</span></div>
          </section>
        </div>

        <p className={styles.disclaimer}>{Number(age) < 19 && age !== "" ? "برای افراد زیر 19 سال، نیاز انرژی با رشد و ویژگی‌های سنی تغییر می‌کند؛ این نتیجه فقط یک تخمین است." : "این ابزار نتیجه‌ای تخمینی ارائه می‌دهد و جایگزین ارزیابی متخصص تغذیه یا پزشک نیست."}</p>
      </section>
    </main>
  );
}
