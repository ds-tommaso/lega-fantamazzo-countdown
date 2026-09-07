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
// Modifica SOLO queste date/ore.
// Formato: "AAAA-MM-GGTHH:MM:SS" (senza "Z": viene interpretata
// come ora locale del browser di chi visita la pagina).
// ========================================
const EVENT_DATE = "2026-09-07T21:10:00";

// Data/ora di fine asta. Finché non è nota si lascia "": il countdown
// si comporta come prima (sparisce dopo AUCTION_VISIBLE_AFTER_START_HOURS).
// Una volta valorizzata, appena raggiunta mostra lo stato "asta terminata"
// (durata finale ore/minuti + augurio) al posto della sparizione.
const AUCTION_END_DATE = "2026-09-08T02:00:00";

// Per quante ore dopo l'inizio restare visibile il countdown
// (stato "L'asta è iniziata" col segno verde). Dopo, il blocco sparisce.
// Ignorato quando AUCTION_END_DATE è valorizzata (vedi sopra).
const AUCTION_VISIBLE_AFTER_START_HOURS = 6;

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
const endTime = AUCTION_END_DATE ? new Date(AUCTION_END_DATE).getTime() : null;
const AUCTION_VISIBLE_AFTER_START_MS = AUCTION_VISIBLE_AFTER_START_HOURS * 3600000;

let eventStarted = false;
let eventExpired = false;
let eventEnded = false;
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
  dom.sign = document.getElementById("countdown-sign");
  dom.phase = document.getElementById("auction-phase");
  dom.statusWrap = document.getElementById("auction-status");
  dom.countdownBlock = document.getElementById("countdown-block");
  dom.liveRegion = document.getElementById("countdown-live");
  dom.endedMessage = document.getElementById("auction-ended-message");
}
