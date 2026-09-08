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
   allineati countdown e contenuti senza intervento manuale (utile
   in caso di ritardi nell'inizio/fine asta). Una volta che l'asta
   risulta "ended" o "expired" non c'è più nulla che possa cambiare,
   quindi il reload viene saltato. */
var PAGE_RELOAD_INTERVAL_MS = 2 * 60 * 1000;
setTimeout(function () {
  var phase = calculateAuctionState().phase;
  if (phase === "ended" || phase === "expired") return;
  window.location.reload();
}, PAGE_RELOAD_INTERVAL_MS);
