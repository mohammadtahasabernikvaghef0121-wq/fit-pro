import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <section className={styles.card} aria-labelledby="not-found-title">
        <div className={styles.copy}>
          <span className={styles.eyebrow}><i aria-hidden="true" /> خطای 404 · مسیر پیدا نشد</span>
          <p className={styles.number} aria-hidden="true">404</p>
          <h1 id="not-found-title">این مسیر توی برنامه نیست!</h1>
          <p className={styles.description}>
            صفحه‌ای که دنبالش هستی پیدا نشد؛ اما مسیر تمرینت هنوز روبه‌روته. بیا از یک نقطه‌ی درست ادامه بدیم.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/">بازگشت به خانه <span aria-hidden="true">←</span></Link>
            <Link className={styles.secondary} href="/pricing">دیدن برنامه‌ها</Link>
          </div>
          <p className={styles.hint}><span aria-hidden="true">✦</span> حرکت بعدی با توئه؛ مسیرت رو دوباره پیدا کن.</p>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <div className={styles.visualTop}><span>FIT PRO</span><span>KEEP MOVING</span></div>
          <div className={`${styles.orbit} ${styles.orbitOne}`} />
          <div className={`${styles.orbit} ${styles.orbitTwo}`} />
          <div className={`${styles.disc} ${styles.discLeft}`} />
          <div className={`${styles.disc} ${styles.discRight}`} />
          <svg className={styles.dumbbell} viewBox="0 0 360 180" fill="none">
            <path d="M66 90h228" stroke="currentColor" strokeWidth="17" strokeLinecap="round" />
            <path d="M82 52v76M104 36v108M278 52v76M256 36v108" stroke="currentColor" strokeWidth="15" strokeLinecap="round" />
            <path d="M61 65v50M299 65v50" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
          </svg>
          <div className={styles.visualCaption}><strong>برگرد به مسیر</strong><span>یک قدم، یک حرکت، یک شروع تازه</span></div>
          <span className={`${styles.sparkle} ${styles.sparkleOne}`}>✦</span>
          <span className={`${styles.sparkle} ${styles.sparkleTwo}`}>+</span>
        </div>
      </section>
    </main>
  );
}
