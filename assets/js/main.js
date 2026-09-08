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

/* Ricarica automatica della pagina ogni 2 minuti, per tenere
   allineati countdown e contenuti senza intervento manuale. */
var PAGE_RELOAD_INTERVAL_MS = 2 * 60 * 1000;
setTimeout(function () {
  window.location.reload();
}, PAGE_RELOAD_INTERVAL_MS);
