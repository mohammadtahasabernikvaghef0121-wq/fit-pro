"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./exit-intent-modal.module.css";

export default function ExitIntentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const returnNoticeShown = useRef(false);
  const tabWasHidden = useRef(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef("");

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        tabWasHidden.current = true;
        return;
      }
      if (!tabWasHidden.current || returnNoticeShown.current) return;

      tabWasHidden.current = false;
      returnNoticeShown.current = true;
      previousFocus.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      setIsOpen(true);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButton.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow.current;
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <section
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fitpro-exit-message"
        dir="rtl"
      >
        <button
          ref={closeButton}
          className={styles.close}
          type="button"
          aria-label="بستن پیام"
          onClick={() => setIsOpen(false)}
        >
          <span aria-hidden="true">×</span>
        </button>
        <p id="fitpro-exit-message">از بازدید شما از وب سایت فیت پرو سپاسگزاریم.</p>
      </section>
    </div>
  );
}
