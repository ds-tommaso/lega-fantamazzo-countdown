"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   countdown.js — calcolo, formattazione e rendering del countdown.
   Dipende dalle costanti/variabili definite in config.js.

   Tre stati, decisi solo confrontando Date.now() con targetTime:
   - "before"  → l'asta non è ancora iniziata: timer negativo (segno rosso)
   - "live"    → l'asta è iniziata da meno di AUCTION_VISIBLE_AFTER_START_MS:
                 timer positivo (segno verde) che conta il tempo trascorso
   - "expired" → oltre quella soglia: il blocco countdown sparisce del tutto
   ============================================================ */

/**
 * Determina lo stato dell'asta rispetto a targetTime.
 * La fonte di verità è sempre Date.now(): nessun contatore
 * viene decrementato manualmente, quindi non c'è drift.
 */
function calculateAuctionState() {
  const diff = targetTime - Date.now();

  if (diff > 0) {
    return { phase: "before", ms: diff };
  }

  const elapsedMs = -diff;
  if (elapsedMs >= AUCTION_VISIBLE_AFTER_START_MS) {
    return { phase: "expired", ms: elapsedMs };
  }

  return { phase: "live", ms: elapsedMs };
}

/**
 * Formatta un numero con zeri iniziali (es. 7 -> "07").
 */
function formatUnit(value, length = 2) {
  return String(value).padStart(length, "0");
}

/**
 * Scompone una durata in ore/minuti/secondi/millisecondi.
 * Le ore NON vengono ridotte modulo 24, possono superare 23.
 */
function msToUnits(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);
  return { hours, minutes, seconds, milliseconds };
}

/**
 * Aggiorna il testo di un elemento e, solo se il valore è
 * cambiato, riavvia la micro-animazione di cambio cifra.
 */
function setUnitText(el, key, text) {
  if (lastValues[key] === text) return;
  lastValues[key] = text;
  el.textContent = text;
  el.classList.remove("is-changed");
  requestAnimationFrame(() => el.classList.add("is-changed"));
}

/**
 * Aggiorna la regione aria-live una sola volta al minuto,
 * per non "spammare" gli screen reader ad ogni secondo.
 */
function announceForScreenReaders(phase, hours, minutes) {
  const minuteKey = `${phase}-${hours * 60 + minutes}`;
  if (minuteKey === lastAnnouncedMinute) return;
  lastAnnouncedMinute = minuteKey;
  dom.liveRegion.textContent =
    phase === "before"
      ? `Mancano ${hours} ore e ${minutes} minuti all'inizio dell'asta.`
      : `L'asta è iniziata da ${hours} ore e ${minutes} minuti.`;
}

// Le ore non hanno lo zero iniziale (5, non 05): il numero di cifre
// non è più fisso come per minuti/secondi. initCountdownFit() misura
// la riga usando il placeholder statico dell'HTML, che potrebbe non
// avere lo stesso numero di cifre del valore reale: al primo tick
// con i valori veri si ricalcola una volta per correggere eventuali
// scarti (evita overflow se il placeholder aveva meno cifre).
let hasFittedRealValues = false;

/**
 * Callback eseguita ad ogni frame tramite requestAnimationFrame.
 * Non usa mai setInterval: il rendering segue il refresh rate
 * del browser restando comunque sincronizzato con l'orario reale.
 */
function updateCountdown() {
  if (eventExpired) return;

  const { phase, ms } = calculateAuctionState();

  if (phase !== "before" && !eventStarted) {
    handleEventStarted();
  }

  if (phase === "expired") {
    handleEventExpired();
    return;
  }

  const { hours, minutes, seconds, milliseconds } = msToUnits(ms);

  setUnitText(dom.hours, "hours", String(hours));
  setUnitText(dom.minutes, "minutes", formatUnit(minutes));
  setUnitText(dom.seconds, "seconds", formatUnit(seconds));

  // I millisecondi cambiano ad ogni frame: niente micro-animazione
  // di cambio cifra, si aggiorna solo il testo. Il timer li mostra
  // soltanto prima dell'inizio (CSS li nasconde quando è live).
  if (phase === "before") {
    dom.milliseconds.textContent = formatUnit(milliseconds, 3);
  }

  if (!hasFittedRealValues) {
    hasFittedRealValues = true;
    fitCountdownRow();
  }

  announceForScreenReaders(phase, hours, minutes);

  requestAnimationFrame(updateCountdown);
}

/**
 * Avvia il loop del countdown.
 */
function startCountdown() {
  requestAnimationFrame(updateCountdown);
}

/**
 * Gestisce il passaggio allo stato "asta iniziata": testo, segno
 * e colore passano da "prima" (rosso, negativo) a "live" (verde,
 * positivo) e innesca una breve transizione cinematografica
 * (flash + boost luci/particelle).
 */
function handleEventStarted() {
  if (eventStarted) return;
  eventStarted = true;

  document.body.classList.add("is-live");
  document.body.classList.add("is-flash");
  window.setTimeout(() => document.body.classList.remove("is-flash"), 700);

  dom.phase.textContent = "L'ASTA È INIZIATA";
  dom.countdownBlock.classList.remove("is-before");
  dom.countdownBlock.classList.add("is-live");
  dom.sign.textContent = "+";

  // Senza i millisecondi la riga è più corta: ricalcola la taglia
  // su mobile perché torni a riempire il 100% della larghezza.
  fitCountdownRow();

  boostParticlesFn();
}

/**
 * Oltre AUCTION_VISIBLE_AFTER_START_MS dall'inizio, il blocco
 * countdown (etichetta + timer) sparisce del tutto: ferma anche
 * il loop, non c'è più nulla da aggiornare.
 */
function handleEventExpired() {
  if (eventExpired) return;
  eventExpired = true;

  dom.statusWrap.classList.add("is-expired");
  dom.liveRegion.textContent = "";
}
