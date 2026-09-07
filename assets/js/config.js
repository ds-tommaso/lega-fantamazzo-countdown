"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   config.js — configurazione e stato condiviso.

   Caricato per PRIMO: le costanti e le variabili definite qui
   (EVENT_DATE, dom, ecc.) sono usate da tutti gli altri file in
   assets/js/. Niente moduli/bundler: gli script classici caricati
   in sequenza in index.html condividono lo stesso scope globale.
   ============================================================ */

// ========================================
// CONFIGURAZIONE ASTA
// Modifica SOLO questa data e ora.
// Formato: "AAAA-MM-GGTHH:MM:SS" (senza "Z": viene interpretata
// come ora locale del browser di chi visita la pagina).
// ========================================
const EVENT_DATE = "2026-09-07T20:00:00";

// Altre impostazioni regolabili
const PARTICLE_COUNT_DESKTOP = 46;
const PARTICLE_COUNT_MOBILE = 18;
const MOBILE_BREAKPOINT = 768;
const INTRO_BASE_DELAY = 150; // ms prima che inizi la sequenza d'apertura
const INTRO_STEP_DELAY = 230; // ms tra una fase e la successiva
const INTRO_BALL_FLASH_AT = 820; // ms: momento dell'impatto/flash del pallone
const INTRO_CURTAIN_OPEN_AT = 950; // ms: apertura sipario dopo il pallone (sostituisce il fisso 80ms)

// ------------------------------------------------------------
// Stato condiviso e riferimenti DOM
// ------------------------------------------------------------
const targetTime = new Date(EVENT_DATE).getTime();

let eventStarted = false;
let boostParticlesFn = () => { };

const dom = {};
const lastValues = { hours: null, minutes: null, seconds: null };
let lastAnnouncedMinute = null;

/**
 * Recupera e salva i riferimenti agli elementi DOM usati dal countdown.
 */
function cacheDom() {
  dom.hours = document.getElementById("hours");
  dom.minutes = document.getElementById("minutes");
  dom.seconds = document.getElementById("seconds");
  dom.milliseconds = document.getElementById("milliseconds");
  dom.status = document.getElementById("countdown-status");
  dom.liveRegion = document.getElementById("countdown-live");
}
