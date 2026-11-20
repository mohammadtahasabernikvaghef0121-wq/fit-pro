"use client";

import type { PointerEvent } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function HeroTilt() {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    const card = event.currentTarget;
    const bounds = card.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    const rotateY = (x - 0.5) * 16;
    const rotateX = (0.5 - y) * 16;

    card.style.setProperty("--tilt-x", `${rotateX}deg`);
    card.style.setProperty("--tilt-y", `${rotateY}deg`);
    card.style.setProperty("--glow-x", `${x * 100}%`);
    card.style.setProperty("--glow-y", `${y * 100}%`);
    card.style.setProperty("--tilt-scale", "1.015");
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    const card = event.currentTarget;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "50%");
    card.style.setProperty("--tilt-scale", "1");
  }

  return (
    <div className="hero-tilt-scene">
      <div
        className="visual hero-tilt-card"
        aria-label="تصویر انتزاعی تندرستی"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="figure" />
        <div className="float-card float-one">✦ برنامه متناسب با شما</div>
        <div className="float-card float-two">پیشرفت آرام، نتیجه ماندگار</div>
      </div>
    </div>
  );
}
