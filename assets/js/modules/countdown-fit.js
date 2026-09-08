"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   countdown-fit.js — su mobile, calcola la taglia esatta delle
   cifre del countdown perché la riga riempia il 100% della
   larghezza disponibile (bordo sx/dx dato dal padding di
   .hero-content), sempre su un'unica riga, senza mai andare in
   overflow. Il clamp() in CSS resta come fallback (no-JS, o prima
   del primo calcolo).
   ============================================================ */

const COUNTDOWN_FIT_QUERY = "(max-width: 480px)";
const COUNTDOWN_FIT_REF_PX = 100;
const COUNTDOWN_FIT_SAFETY = 0.98;

/**
 * Misura la larghezza naturale della riga del countdown a una
 * taglia di riferimento nota (--cd-fs: 100px), poi calcola e
 * applica la taglia che la fa combaciare con lo spazio disponibile.
 */
function fitCountdownRow() {
  const block = document.getElementById("countdown-block");
  const container = document.getElementById("auction-status");
  if (!block || !container) return;

  if (!window.matchMedia(COUNTDOWN_FIT_QUERY).matches) {
    block.style.removeProperty("--cd-fs");
    return;
  }

  const availableWidth = container.getBoundingClientRect().width;
  if (!availableWidth) return;

  block.style.setProperty("--cd-fs", COUNTDOWN_FIT_REF_PX + "px");
  block.classList.add("is-measuring");
  const naturalWidth = block.getBoundingClientRect().width;
  block.classList.remove("is-measuring");
  if (!naturalWidth) return;

  const scale = (availableWidth / naturalWidth) * COUNTDOWN_FIT_SAFETY;
  block.style.setProperty("--cd-fs", COUNTDOWN_FIT_REF_PX * scale + "px");
}

/**
 * Ricalcola al resize/cambio orientamento (debounce leggero: non
 * serve rifarlo ad ogni pixel, solo quando lo scroll/resize si ferma).
 */
function initCountdownFit() {
  fitCountdownRow();

  let resizeTimer = null;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(fitCountdownRow, 120);
    },
    { passive: true }
  );

  window.addEventListener("orientationchange", () => window.setTimeout(fitCountdownRow, 200));
}
