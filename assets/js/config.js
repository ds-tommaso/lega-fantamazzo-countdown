"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   config.js — configurazione e stato condiviso.

   Caricato per PRIMO: LEAGUE_CONFIG, le costanti e le variabili
   definite qui (targetTime, dom, ecc.) sono usate da tutti gli
   altri file in assets/js/. Niente moduli/bundler: gli script
   classici caricati in sequenza in index.html condividono lo
   stesso scope globale.
   ============================================================ */

// ========================================
// CONFIGURAZIONE DI LEGA
// Unica fonte di verità per i dati dinamici della lega: nome/
// stagione, date dell'asta, elenco squadre e tappe del percorso.
// Per una nuova stagione/lega basta modificare questo oggetto.
// ========================================
const LEAGUE_CONFIG = {
  league: {
    name: "Lega Fantamazzo",
    // Stagione del campionato che l'asta apre, mostrata sotto
    // l'augurio di buon campionato nello stato "asta terminata".
    // L'anno prossimo basta aggiornare questa riga.
    season: "2026/27",
  },

  countdown: {
    // Formato: "AAAA-MM-GGTHH:MM:SS" (senza "Z": viene interpretata
    // come ora locale del browser di chi visita la pagina).
    eventDate: "2026-09-07T21:10:00",

    // Data/ora di fine asta. Finché non è nota si lascia "": il
    // countdown si comporta come prima (sparisce dopo
    // visibleAfterStartHours). Una volta valorizzata, appena
    // raggiunta mostra lo stato "asta terminata" (durata finale
    // ore/minuti + augurio) al posto della sparizione.
    auctionEndDate: "2026-09-08T01:56:30",

    // Per quante ore dopo l'inizio restare visibile il countdown
    // (stato "L'asta è iniziata" col segno verde). Dopo, il blocco
    // sparisce. Ignorato quando auctionEndDate è valorizzata.
    visibleAfterStartHours: 6,
  },

  // Elenco squadre e presidenti mostrati in "Le Fantasquadre".
  // Per aggiungere/modificare una squadra, basta editare questo array.
  teams: [
    { team: "Torellinho 2025", manager: "Giuseppe Chiarolla" },
    { team: "Co Molli Cosenza", manager: "Giuseppe Giannini" },
    { team: "Hunting Club FC 1996", manager: "Vito Ricciardi" },
    { team: "Bene ma non Benito FC", manager: "Pietro Gallo" },
    { team: "Cleveland Monsters", manager: "Massimiliano Depalma" },
    { team: "Spera Ebbasta", manager: "Flavio Lattarulo, Gigi" },
    { team: "Pdor Saint-Germain", manager: "Antonio Morgante" },
    { team: "FC Internazionale Ingiocabili", manager: "Francesco Campanella" },
    { team: "El Loco Picci", manager: "Fabrizio Giannini" },
    { team: "APresto UniFG", manager: "Depalma C." },
  ],

  // Tappe della timeline/percorso cinematografico (sezione
  // #pitch-journey): chiave (usata anche come data-stage), titolo
  // e testo di ciascuna tappa, nell'ordine in cui vengono attraversate.
  journey: {
    stages: [
      { key: "strategia", title: "Strategia", text: "Ogni credito conta." },
      { key: "rilanci", title: "Rilanci", text: "Un solo errore può cambiare la stagione." },
      { key: "gloria", title: "Gloria", text: "Uno solo salirà sul trono." },
    ],
  },
};

// ========================================
// Altre impostazioni regolabili (tuning tecnico, non dati di lega)
// ========================================
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
const targetTime = new Date(LEAGUE_CONFIG.countdown.eventDate).getTime();
const endTime = LEAGUE_CONFIG.countdown.auctionEndDate ? new Date(LEAGUE_CONFIG.countdown.auctionEndDate).getTime() : null;
const AUCTION_VISIBLE_AFTER_START_MS = LEAGUE_CONFIG.countdown.visibleAfterStartHours * 3600000;

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
  dom.datesMessage = document.getElementById("auction-dates-message");
  dom.endedMessage = document.getElementById("auction-ended-message");
  dom.seasonMessage = document.getElementById("auction-season-message");
}
