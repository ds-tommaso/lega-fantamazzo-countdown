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
 * Orchestra l'apertura "da trailer": un pallone viene verso la
 * camera nel buio, un flash segna l'impatto, poi il sipario si apre
 * su luci/tribune/foschia/campo, poi titolo, sottotitolo e countdown,
 * a fasi successive. Durata totale ~3s.
 * Con prefers-reduced-motion, mostra tutto immediatamente (niente
 * pallone, niente flash: il sipario si apre subito come prima).
 */
function initIntroAnimation() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const steppedEls = document.querySelectorAll("[data-step]");
  const introBall = document.getElementById("intro-ball");

  if (prefersReduced) {
    document.body.classList.add("curtain-open");
    steppedEls.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  let curtainOpenAt = 80;

  if (introBall) {
    curtainOpenAt = INTRO_CURTAIN_OPEN_AT;
    window.requestAnimationFrame(() => introBall.classList.add("is-approaching"));
    window.setTimeout(() => document.body.classList.add("is-flash"), INTRO_BALL_FLASH_AT);
    window.setTimeout(() => document.body.classList.remove("is-flash"), INTRO_BALL_FLASH_AT + 700);
    window.setTimeout(() => introBall.classList.add("is-gone"), INTRO_BALL_FLASH_AT + 30);
  }

  window.setTimeout(() => document.body.classList.add("curtain-open"), curtainOpenAt);

  steppedEls.forEach((el) => {
    const step = Number(el.dataset.step) || 1;
    const delay = curtainOpenAt + INTRO_BASE_DELAY + step * INTRO_STEP_DELAY;
    window.setTimeout(() => el.classList.add("is-revealed"), delay);
  });
}
