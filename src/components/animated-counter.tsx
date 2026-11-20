"use client";

import { useEffect, useRef, useState } from "react";

const numberPattern = /-?[\d,]+(?:\.\d+)?/;

function splitNumber(value: string) {
  const match = numberPattern.exec(value);
  if (!match) return null;
  const raw = match[0];
  const target = Number(raw.replaceAll(",", ""));
  if (!Number.isFinite(target)) return null;

  return {
    target,
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + raw.length),
    decimals: raw.includes(".") ? raw.length - raw.indexOf(".") - 1 : 0,
  };
}

function formatPart(value: number, decimals: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);
}

export default function AnimatedCounter({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const lastValue = useRef<number | null>(null);

  useEffect(() => {
    const parts = splitNumber(value);
    if (!parts) {
      lastValue.current = null;
      setDisplay(value);
      return;
    }

    const from = lastValue.current ?? 0;
    const { target, prefix, suffix, decimals } = parts;
    lastValue.current = target;

    if (target === from || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const duration = 760;
    let frame = 0;
    let start = 0;
    let lastPaint = 0;
    setDisplay(`${prefix}${formatPart(from, decimals)}${suffix}`);

    const tick = (time: number) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = from + (target - from) * eased;

      if (time - lastPaint >= 32 || progress === 1) {
        setDisplay(progress === 1 ? value : `${prefix}${formatPart(current, decimals)}${suffix}`);
        lastPaint = time;
      }

      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <span>{display}</span>;
}
