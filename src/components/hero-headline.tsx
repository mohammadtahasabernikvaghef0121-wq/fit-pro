"use client";

import type { PointerEvent } from "react";

export default function HeroHeadline() {
  function moveHeadline(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const heading = event.currentTarget.querySelector(".hero-title");
    if (!(heading instanceof HTMLElement)) return;

    heading.style.setProperty("--headline-rotate-x", `${(0.5 - y) * 7}deg`);
    heading.style.setProperty("--headline-rotate-y", `${(x - 0.5) * 7}deg`);
    heading.style.setProperty("--headline-lift", "-2px");
  }

  function resetHeadline(event: PointerEvent<HTMLDivElement>) {
    const heading = event.currentTarget.querySelector(".hero-title");
    if (!(heading instanceof HTMLElement)) return;

    heading.style.setProperty("--headline-rotate-x", "0deg");
    heading.style.setProperty("--headline-rotate-y", "0deg");
    heading.style.setProperty("--headline-lift", "0px");
  }

  return (
    <div className="hero-title-scene" onPointerMove={moveHeadline} onPointerLeave={resetHeadline}>
      <h1 className="hero-title">
        <span className="hero-title-highlight">قوی‌تر شو،</span>
        <br />
        با برنامه‌ای که <span className="hero-title-accent">برای توست.</span>
      </h1>
    </div>
  );
}
