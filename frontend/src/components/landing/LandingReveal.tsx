"use client";

import { useEffect } from "react";

// Observe les éléments [data-reveal] de la landing et les marque
// data-revealed quand ils entrent à l'écran. Ne rend rien.
export function LandingReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    // Ce qui est déjà visible au chargement ne doit pas clignoter.
    const vh = window.innerHeight;
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) el.setAttribute("data-revealed", "");
      else observer.observe(el);
    });
    root.setAttribute("data-reveal-ready", "");

    return () => observer.disconnect();
  }, []);

  return null;
}
