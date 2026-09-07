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
 *
 * Il loop rAF gira solo mentre l'hero è visibile e la scheda è in
 * primo piano (vedi perf.js): per tutto il resto dello scroll
 * (giourney, fantasquadre, proclama...) non c'è nessun lavoro da
 * fare, quindi non gira nulla.
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
  let running = false;
  let heroVisible = true;
  let pageVisible = true;

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

    if (running) requestAnimationFrame(tick);
  }

  // will-change resta attivo sui layer solo mentre il loop gira
  // davvero: evita di tenere le GPU layer promosse per tutta la
  // vita della pagina quando il parallax non sta facendo nulla.
  function syncState() {
    const shouldRun = heroVisible && pageVisible;
    root.classList.toggle("parallax-active", shouldRun);
    if (shouldRun && !running) {
      running = true;
      requestAnimationFrame(tick);
    } else if (!shouldRun) {
      running = false;
    }
  }

  onHeroVisibilityChange((visible) => {
    heroVisible = visible;
    syncState();
  });

  onPageVisibilityChange((visible) => {
    pageVisible = visible;
    syncState();
  });
}
