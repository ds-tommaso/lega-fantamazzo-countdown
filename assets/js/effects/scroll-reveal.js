"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   scroll-reveal.js — reveal a fade/slide dei paragrafi del
   "proclama" quando entrano nel viewport.
   ============================================================ */

/**
 * Osserva i figli diretti di .manifesto-inner e aggiunge
 * "is-in-view" al primo ingresso in viewport (una sola volta).
 * Con prefers-reduced-motion, o senza IntersectionObserver,
 * mostra tutto subito senza animare.
 */
function initScrollReveal() {
  const targets = document.querySelectorAll(".manifesto-inner > *");
  if (!targets.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}
