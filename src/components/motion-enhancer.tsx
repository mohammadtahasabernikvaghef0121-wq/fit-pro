"use client";

import { useEffect } from "react";

const revealSelector = [
  "main > .section",
  ".user-section",
  ".user-account-card",
  ".user-metrics > .user-metric",
  ".admin-metrics > .admin-metric",
  ".admin-section-heading",
  ".admin-table-wrap",
  ".admin-package-list",
  ".shop-grid > .shop-card",
  ".payment-details-grid > .payment-detail-card",
  ".checkout-form > section",
  ".support-callout",
  ".support-login-prompt",
  ".support-card",
].join(",");

export default function MotionEnhancer() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    let scrollFrame = 0;

    const updateHeader = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        header?.toggleAttribute("data-scrolled", window.scrollY > 8);
        scrollFrame = 0;
      });
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      return () => {
        window.removeEventListener("scroll", updateHeader);
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      };
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.motionReveal = "visible";
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -32px 0px" });

    const observeWithin = (root: ParentNode) => {
      if (root instanceof Element && root.matches(revealSelector)) observe(root);
      root.querySelectorAll(revealSelector).forEach(observe);
    };

    const observe = (element: Element) => {
      if (element.hasAttribute("data-motion-reveal")) return;
      (element as HTMLElement).dataset.motionReveal = "pending";
      observer.observe(element);
    };

    document.documentElement.dataset.motionReady = "true";
    observeWithin(document);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) observeWithin(node);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", updateHeader);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      mutations.disconnect();
      observer.disconnect();
      delete document.documentElement.dataset.motionReady;
    };
  }, []);

  return null;
}
