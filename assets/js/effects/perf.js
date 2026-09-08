"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   perf.js — infrastruttura condivisa per sospendere il lavoro
   continuo (loop rAF, animazioni CSS infinite) quando non serve:
   sezione fuori viewport o scheda in background.

   Un solo IntersectionObserver per sezione "pesante" (hero,
   pitch-journey), condiviso da più moduli via subscribe, invece
   di un observer duplicato per ciascun modulo sullo stesso
   elemento. Caricato subito dopo config.js: le funzioni esposte
   (onHeroVisibilityChange, onJourneyVisibilityChange,
   onPageVisibilityChange) sono usate da parallax.js, particles.js,
   countdown.js e journey.js.
   ============================================================ */

function isPageVisible() {
  return document.visibilityState !== "hidden";
}

/**
 * Crea un "segnale" di visibilità per un elemento: un solo
 * IntersectionObserver, N iscritti. Ogni subscribe(cb) riceve
 * subito lo stato corrente, poi ad ogni cambio. Senza
 * IntersectionObserver (o senza elemento), resta sempre "visibile":
 * nessuna sospensione, comportamento identico a prima.
 */
function createVisibilitySignal(el, rootMargin) {
  let state = true;
  const listeners = [];

  function notify() {
    listeners.forEach((cb) => cb(state));
  }

  if (el && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          state = entry.isIntersecting;
        });
        notify();
      },
      { rootMargin: rootMargin || "20% 0px 20% 0px", threshold: 0 }
    );
    observer.observe(el);
  }

  return {
    subscribe(cb) {
      listeners.push(cb);
      cb(state);
    },
  };
}

let heroSignal = null;
let journeySignal = null;
const pageVisibilityListeners = [];

/**
 * Da chiamare una sola volta all'avvio (main.js), prima di
 * initParallax/initJourney/initParticles/startCountdown: prepara i
 * segnali di visibilità condivisi e la classe globale che mette in
 * pausa via CSS le animazioni infinite quando la scheda è in
 * background (vedi sezione "PERFORMANCE" in style.css).
 */
function initVisibilitySignals() {
  const heroEl = document.getElementById("hero");
  const journeyEl = document.getElementById("pitch-journey");
  const fantasquadreEl = document.querySelector(".fantasquadre");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  heroSignal = createVisibilitySignal(heroEl);
  journeySignal = createVisibilitySignal(journeyEl, "25% 0px 25% 0px");

  // Con prefers-reduced-motion le animazioni infinite sono già
  // disattivate globalmente via CSS (!important): non serve pagare
  // il costo di altri IntersectionObserver solo per una classe che
  // in quel caso non avrebbe alcun effetto visivo.
  if (!prefersReduced) {
    if (heroEl) heroSignal.subscribe((visible) => heroEl.classList.toggle("anim-paused", !visible));
    if (journeyEl) journeySignal.subscribe((visible) => journeyEl.classList.toggle("anim-paused", !visible));
    if (fantasquadreEl) {
      createVisibilitySignal(fantasquadreEl).subscribe((visible) => {
        fantasquadreEl.classList.toggle("anim-paused", !visible);
      });
    }
  }

  const applyTabHidden = () => document.body.classList.toggle("is-tab-hidden", !isPageVisible());
  applyTabHidden();
  document.addEventListener("visibilitychange", () => {
    applyTabHidden();
    pageVisibilityListeners.forEach((cb) => cb(isPageVisible()));
  });
}

/**
 * Iscrizione allo stato di visibilità dell'hero (#hero): usato da
 * parallax.js, particles.js e countdown.js per fermare i rispettivi
 * loop rAF quando la sezione non è (più) in viewport.
 */
function onHeroVisibilityChange(cb) {
  if (heroSignal) heroSignal.subscribe(cb);
  else cb(true);
}

/**
 * Iscrizione allo stato di visibilità della sezione journey
 * (#pitch-journey): usato da journey.js per fermare il loop della
 * camera cinematografica quando la sezione è lontana dalla viewport.
 */
function onJourneyVisibilityChange(cb) {
  if (journeySignal) journeySignal.subscribe(cb);
  else cb(true);
}

/**
 * Iscrizione al cambio di document.visibilityState (scheda in
 * background/primo piano). Un solo listener condiviso invece di uno
 * per modulo.
 */
function onPageVisibilityChange(cb) {
  pageVisibilityListeners.push(cb);
  cb(isPageVisible());
}
