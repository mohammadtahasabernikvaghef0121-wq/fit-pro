"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./bmi-calculator.module.css";
import { calculateBmi, validateBmiInput, type BmiCategory } from "@/lib/bmi";

const categoryCopy: Record<BmiCategory, { label: string; hint: string }> = {
  underweight: { label: "کمبود وزن", hint: "شاخص شما پایین‌تر از محدوده مرجع بزرگسالان است." },
  normal: { label: "محدوده معمول", hint: "شاخص شما در محدوده مرجع بزرگسالان قرار دارد." },
  overweight: { label: "اضافه‌وزن", hint: "شاخص شما بالاتر از محدوده مرجع معمول است." },
  obese: { label: "چاقی", hint: "شاخص شما در بازه چاقی بزرگسالان قرار دارد." },
};

const markers = [
  { value: 18.5 },
  { value: 25 },
  { value: 30 },
  { value: 40 },
];

export default function BmiCalculator() {
  const [heightValue, setHeightValue] = useState("175");
  const [weightValue, setWeightValue] = useState("72");
  const [ageValue, setAgeValue] = useState("25");
  const [gender, setGender] = useState("");
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const metric = units === "metric";
  const heightMin = metric ? 100 : 39.4;
  const heightMax = metric ? 250 : 98.4;
  const weightMin = metric ? 20 : 44.1;
  const weightMax = metric ? 300 : 661.3;
  const displayHeight = Number(heightValue);
  const displayWeight = Number(weightValue);
  const displayAge = Number(ageValue);
  const validAge = ageValue.trim() !== "" && Number.isInteger(displayAge) && displayAge >= 15 && displayAge <= 120;
  const hasHeight = heightValue.trim() !== "" && Number.isFinite(displayHeight);
  const hasWeight = weightValue.trim() !== "" && Number.isFinite(displayWeight);
  const heightCm = metric ? displayHeight : displayHeight * 2.54;
  const weightKg = metric ? displayWeight : displayWeight / 2.2046226218;
  const validationError = validateBmiInput(heightCm, weightKg);
  const result = useMemo(() => validAge ? calculateBmi(heightCm, weightKg) : null, [heightCm, weightKg, validAge]);
  const category = result ? categoryCopy[result.category] : null;
  const progress = result ? Math.min(Math.max((result.value / 40) * 100, 0), 100) : 0;

  function changeUnits(next: "metric" | "imperial") {
    if (next === units) return;
    if (next === "imperial") {
      if (hasHeight) setHeightValue((displayHeight / 2.54).toFixed(1));
      if (hasWeight) setWeightValue((displayWeight * 2.2046226218).toFixed(1));
    } else {
      if (hasHeight) setHeightValue(String(Math.round(displayHeight * 2.54)));
      if (hasWeight) setWeightValue(String(Math.round((displayWeight / 2.2046226218) * 10) / 10));
    }
    setUnits(next);
  }

  return (
    <main className={`${styles.page} ${entered ? styles.entered : ""}`}>
      <div className={styles.glow} aria-hidden="true" />
      <section className={styles.shell} aria-labelledby="bmi-title">
        <div className={styles.intro}>
          <div className={styles.wordmark} aria-label="Fit Pro">
            <span className={styles.wordmarkIcon}>FP</span>
            <span>Fit <b>Pro</b></span>
          </div>
          <span className={styles.kicker}><span /> BMI CALCULATOR</span>
          <h1 id="bmi-title">شاخص توده بدنی <em>BMI</em></h1>
          <p>سن، قد و وزن خود را وارد کنید تا شاخص توده بدنی‌تان را ببینید.</p>
        </div>

        <div className={styles.grid}>
          <section className={styles.inputCard} aria-label="اطلاعات بدنی">
            <div className={styles.cardHeading}>
              <span className={styles.headingIcon} aria-hidden="true">↕</span>
              <div><h2>اندازه‌های شما</h2><p>مقادیر را وارد کنید یا لغزنده‌ها را تنظیم کنید.</p></div>
            </div>

            <div className={styles.unitRow}>
              <span>واحد اندازه‌گیری</span>
              <div className={styles.unitToggle} role="group" aria-label="واحد اندازه‌گیری">
                <button type="button" aria-pressed={metric} className={metric ? styles.unitActive : ""} onClick={() => changeUnits("metric")}>متریک <small>cm / kg</small></button>
                <button type="button" aria-pressed={!metric} className={!metric ? styles.unitActive : ""} onClick={() => changeUnits("imperial")}>امپریال <small>in / lb</small></button>
              </div>
            </div>

            <div className={styles.demographicFields}>
              <div className={styles.demographicField}>
                <label htmlFor="bmi-age">سن</label>
                <div className={styles.numberBox}>
                  <input id="bmi-age" type="number" min="15" max="120" step="1" value={ageValue}
                    onFocus={() => { if (ageValue === "25") setAgeValue(""); }}
                    onChange={(event) => setAgeValue(event.currentTarget.value)} aria-describedby="age-help" />
                  <span>سال</span>
                </div>
                <small id="age-help">محدوده مجاز: 15 تا 120 سال</small>
              </div>
              <div className={styles.demographicField}>
                <label htmlFor="bmi-gender">جنسیت</label>
                <select id="bmi-gender" value={gender} onChange={(event) => setGender(event.currentTarget.value)}>
                  <option value="">انتخاب کنید</option>
                  <option value="female">زن</option>
                  <option value="male">مرد</option>
                  <option value="unspecified">ترجیح می‌دهم نگویم</option>
                </select>
                <small>در محاسبه BMI بزرگسالان اثر ندارد</small>
              </div>
            </div>

            <div className={styles.field} key={`height-${units}`}>
              <div className={styles.fieldTop}>
                <label htmlFor="bmi-height">قد</label>
                <div className={styles.numberBox}>
                  <input id="bmi-height" type="number" min={heightMin} max={heightMax} step={metric ? "1" : "0.1"} value={heightValue}
                    onChange={(event) => setHeightValue(event.currentTarget.value)}
                    aria-describedby="height-help height-error" />
                  <span>{metric ? "cm" : "in"}</span>
                </div>
              </div>
              <input className={styles.range} type="range" min={heightMin} max={heightMax} step={metric ? "1" : "0.1"} value={Number.isFinite(displayHeight) ? Math.min(Math.max(displayHeight, heightMin), heightMax) : heightMin}
                onChange={(event) => setHeightValue(event.currentTarget.value)} aria-label={`تنظیم قد به ${metric ? "سانتی‌متر" : "اینچ"}`} />
              <div className={styles.rangeEnds} id="height-help"><span>{heightMin} {metric ? "cm" : "in"}</span><span>{heightMax} {metric ? "cm" : "in"}</span></div>
              {validationError === "height" && <p className={styles.error} id="height-error">قد باید بین 100 تا 250 سانتی‌متر باشد.</p>}
            </div>

            <div className={styles.field} key={`weight-${units}`}>
              <div className={styles.fieldTop}>
                <label htmlFor="bmi-weight">وزن</label>
                <div className={styles.numberBox}>
                  <input id="bmi-weight" type="number" min={weightMin} max={weightMax} step="0.1" value={weightValue}
                    onChange={(event) => setWeightValue(event.currentTarget.value)}
                    aria-describedby="weight-help weight-error" />
                  <span>{metric ? "kg" : "lb"}</span>
                </div>
              </div>
              <input className={styles.range} type="range" min={weightMin} max={weightMax} step="0.5" value={Number.isFinite(displayWeight) ? Math.min(Math.max(displayWeight, weightMin), weightMax) : weightMin}
                onChange={(event) => setWeightValue(event.currentTarget.value)} aria-label={`تنظیم وزن به ${metric ? "کیلوگرم" : "پوند"}`} />
              <div className={styles.rangeEnds} id="weight-help"><span>{weightMin} {metric ? "kg" : "lb"}</span><span>{weightMax} {metric ? "kg" : "lb"}</span></div>
              {validationError === "weight" && <p className={styles.error} id="weight-error">وزن باید بین 20 تا 300 کیلوگرم باشد.</p>}
            </div>

            <div className={styles.formula}><span className={styles.formulaMark}>ƒx</span><span>فرمول محاسبه</span><strong>وزن (kg) ÷ قد² (m²)</strong></div>
          </section>

          <section className={styles.resultCard} aria-live="polite" aria-label="نتیجه محاسبه">
            <div className={styles.resultTop}><div><span className={styles.resultEyebrow}>نتیجه شما</span><h2>شاخص توده بدنی</h2></div><span className={styles.bmiSymbol}>BMI</span></div>
            <div className={styles.scoreLine}>
              <strong key={result?.value ?? "invalid"} className={styles.score}>{result ? result.value.toFixed(2) : "—"}</strong>
              <span className={styles.scoreUnit}>kg/m<sup>2</sup></span>
            </div>
            {result && category ? <>
              {displayAge < 20 ? <p className={styles.error}>برای افراد زیر 20 سال، تفسیر BMI به سن و جنسیت وابسته است؛ از نمودار رشد متناسب با سن استفاده کنید.</p> : <>
              <div className={`${styles.status} ${styles[result.category]}`}><span className={styles.statusDot} />{category.label}</div>
              <p className={styles.resultHint}>{category.hint}</p>
              <div className={styles.scale} role="img" aria-label={`مقدار BMI برابر ${result.value.toFixed(2)} از 40`}>
                <div className={styles.scaleTrack}>
                  <span className={styles.scaleProgress} style={{ width: `${progress}%` }} />
                  {markers.map((marker) => <span className={styles.scaleMarker} key={marker.value} style={{ left: `${(marker.value / 40) * 100}%` }} />)}
                  <span className={styles.scalePin} style={{ left: `${progress}%` }} />
                </div>
                <div className={styles.scaleLabels}>{markers.map((marker) => <span key={marker.value} style={{ left: `${(marker.value / 40) * 100}%` }}>{marker.value}</span>)}</div>
              </div>
              </>}
            </> : !validAge ? <p className={styles.error}>سن باید عددی صحیح بین 15 تا 120 سال باشد.</p> : <p className={styles.error}>برای نمایش نتیجه، قد و وزن را در بازه معتبر وارد کنید.</p>}
            <div className={styles.note}><span aria-hidden="true">ⓘ</span><p>این شاخص یک ابزار غربالگری عمومی برای بزرگسالان است و تشخیص پزشکی محسوب نمی‌شود.</p></div>
          </section>
        </div>

        <footer className={styles.pageFoot}><span>FITPRO <b>•</b> ابزارهای تناسب اندام</span><span>نتیجه فقط روی همین دستگاه محاسبه می‌شود.</span></footer>
      </section>
    </main>
  );
}
