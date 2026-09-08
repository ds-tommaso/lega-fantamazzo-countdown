"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   intro.js — profondità dei layer + animazione di apertura.
   ============================================================ */

/**
 * Applica la profondità (data-depth) di ogni layer come custom
 * property CSS, così il parallax può leggerla via var(--depth).
 */
function applyDepthAttributes() {
  document.querySelectorAll("[data-depth]").forEach((el) => {
    el.style.setProperty("--depth", el.dataset.depth);
  });
}

/**
 * Mostra la pagina già aperta, senza l'animazione di apertura
 * "da trailer" (rimossa perché la pagina si ricarica da sola ogni
 * 2 minuti e l'animazione risultava ripetitiva).
 */
function initIntroAnimation() {
  document.body.classList.add("curtain-open");
  document.querySelectorAll("[data-step]").forEach((el) => el.classList.add("is-revealed"));
}
