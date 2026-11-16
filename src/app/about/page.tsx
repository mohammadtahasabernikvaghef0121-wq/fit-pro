import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/lib/config";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "درباره مربی",
  description: "آشنایی با رویکرد مربی‌گری و مدارک مربی فیت پرو.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `درباره ${siteConfig.brand}`,
    description: "آشنایی با رویکرد مربی‌گری و مدارک مربی فیت پرو.",
    url: "/about",
  },
};

const certificates = [
  {
    src: "/certificates/corrective-exercise-training.png",
    alt: "تصویر مدرک تمرین اصلاحی از Fitness Academy Europe",
    label: "تمرین اصلاحی",
    description: "گواهی گذراندن دوره Essentials of Corrective Exercise Training از Fitness Academy Europe.",
  },
  {
    src: "/certificates/exercise-science.png",
    alt: "تصویر مدرک Exercise Science از IUSCA",
    label: "Exercise Science",
    description: "گواهی Exercise Science از IUSCA پس از تکمیل دورهٔ 25 ساعته.",
  },
  {
    src: "/certificates/sports-injury-prevention.png",
    alt: "تصویر مدرک پیشگیری از آسیب‌های ورزشی و سلامت عملکردی",
    label: "پیشگیری از آسیب‌های ورزشی",
    description: "گواهی دورهٔ 12 ساعتهٔ پیشگیری از آسیب‌های ورزشی و سلامت عملکردی.",
  },
] as const;

export default function About() {
  return (
    <main className="container page">
      <span className="eyebrow">درباره {siteConfig.brand}</span>
      <h1>مربی‌گری با توجه به زندگی واقعی</h1>

      <div className={`card ${styles.aboutCard}`}>
        <h2 className={styles.coachName}>محمد مهدی صابر نیک واقف</h2>
        <p className="muted">
          {siteConfig.coachBio ||
            "در این مجموعه، برنامه خوب برنامه‌ای است که بتوانید در زندگی روزمره‌تان ادامه‌اش دهید. رویکرد ما بر شناخت هدف‌ها، عادت‌های فعلی و محدودیت‌های هر فرد استوار است."}
        </p>
        {siteConfig.coachQualifications && <p className="muted">{siteConfig.coachQualifications}</p>}

        <section className={styles.certificates} aria-labelledby="certificate-heading">
          <div className={styles.sectionHeading}>
            <span className="eyebrow">مدارک و گواهی‌ها</span>
            <h2 id="certificate-heading">تصویر مدارک</h2>
            <p className="muted">گواهی‌های مرتبط با تمرین اصلاحی، علوم تمرین و پیشگیری از آسیب‌های ورزشی.</p>
          </div>

          <div className={styles.certificateGrid}>
            {certificates.map((certificate, index) => (
              <a
                className={styles.certificateCard}
                href={certificate.src}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`باز کردن تصویر کامل مدرک ${certificate.label}`}
                key={certificate.src}
              >
                <span className={styles.imageFrame}>
                  <Image
                    src={certificate.src}
                    alt={certificate.alt}
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 800px) 50vw, 33vw"
                    className={styles.certificateImage}
                  />
                </span>
                <span className={styles.certificateLabel}>
                  <span>تصویر مدرک {index + 1}</span>
                  <strong>{certificate.label}</strong>
                  <span className={styles.certificateDescription}>{certificate.description}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <section className={`card ${styles.aboutCard}`} aria-labelledby="approach-heading">
        <h2 id="approach-heading">رویکرد ما</h2>
        <p className="muted">
          پیش از پیشنهاد تمرین یا تغییر تغذیه، اطلاعات شما را بررسی می‌کنیم، هدف‌ها را با هم روشن می‌کنیم و برنامه را در بازه‌های منظم بازبینی می‌کنیم. برای شرایط پزشکی، دریافت نظر پزشک یا متخصص مربوط ضروری است و مربی‌گری جایگزین تشخیص یا درمان پزشکی نیست.
        </p>
      </section>
    </main>
  );
}
