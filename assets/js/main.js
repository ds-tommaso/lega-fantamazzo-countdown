"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   main.js — bootstrap. Caricato per ULTIMO: a questo punto tutte
   le funzioni definite negli altri file (config.js, perf.js,
   countdown.js, intro.js, parallax.js, journey.js, teams.js,
   particles.js, scroll-reveal.js, page-nav.js, countdown-fit.js)
   sono già disponibili nello stesso scope globale.
   ============================================================ */

/**
 * Punto di ingresso: inizializza DOM, animazioni e avvia il
 * countdown. Eseguito quando il DOM è pronto.
 */
function initPage() {
  cacheDom();
  applyDepthAttributes();
  initVisibilitySignals();
  initIntroAnimation();
  initParallax();
  initJourney();
  initFantasquadre();
  initParticles();
  initScrollReveal();
  initPageNav();
  initCountdownFit();
  startCountdown();
}

document.addEventListener("DOMContentLoaded", initPage);
