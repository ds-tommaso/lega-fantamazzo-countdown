"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   parallax.js — parallax cinematografico dei layer di sfondo.
   ============================================================ */

/**
 * Muove i layer (via custom property --mx/--my letta in CSS)
 * combinando un lentissimo respiro ambientale con la posizione
 * del mouse, solo su dispositivi con puntatore preciso (desktop).
 * Disabilitato con prefers-reduced-motion.
 */
function initParallax() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  if (supportsHover) {
    window.addEventListener(
      "mousemove",
      (event) => {
        targetX = (event.clientX / window.innerWidth) * 2 - 1;
        targetY = (event.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true }
    );
  }

  function tick(timestamp) {
    const t = timestamp / 1000;
    const ambientX = Math.sin(t * 0.12) * 0.35;
    const ambientY = Math.cos(t * 0.09) * 0.25;

    const mixX = supportsHover ? targetX * 0.7 + ambientX * 0.3 : ambientX;
    const mixY = supportsHover ? targetY * 0.7 + ambientY * 0.3 : ambientY;

    // Smoothing esponenziale: movimento morbido, mai a scatti.
    currentX += (mixX - currentX) * 0.05;
    currentY += (mixY - currentY) * 0.05;

    root.style.setProperty("--mx", currentX.toFixed(4));
    root.style.setProperty("--my", currentY.toFixed(4));

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
