"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   countdown.js — calcolo, formattazione e rendering del countdown.
   Dipende dalle costanti/variabili definite in config.js.

   Quattro stati, decisi solo confrontando Date.now() con targetTime
   ed endTime:
   - "before"  → l'asta non è ancora iniziata: timer negativo (segno rosso)
   - "live"    → l'asta è iniziata da meno di AUCTION_VISIBLE_AFTER_START_MS
                 (e non è ancora stata raggiunta endTime, se nota):
                 timer positivo (segno verde) che conta il tempo trascorso
   - "ended"   → è nota AUCTION_END_DATE ed è stata raggiunta: mostra la
                 durata finale (ore/minuti/secondi), le date di inizio/
                 fine e l'augurio di buon campionato
   - "expired" → fallback quando AUCTION_END_DATE non è nota: oltre la
                 soglia AUCTION_VISIBLE_AFTER_START_MS il blocco sparisce
   ============================================================ */

/**
 * Determina lo stato dell'asta rispetto a targetTime/endTime.
 * La fonte di verità è sempre Date.now(): nessun contatore
 * viene decrementato manualmente, quindi non c'è drift.
 */
function calculateAuctionState() {
  const diff = targetTime - Date.now();

  if (diff > 0) {
    return { phase: "before", ms: diff };
  }

  if (endTime !== null && Date.now() >= endTime) {
    return { phase: "ended", ms: endTime - targetTime };
  }

  const elapsedMs = -diff;
  if (endTime === null && elapsedMs >= AUCTION_VISIBLE_AFTER_START_MS) {
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
 * Formatta un timestamp come data/ora locale "GG/MM HH:MM"
 * (stessa ora locale con cui è interpretato EVENT_DATE in config.js).
 */
function formatDateTime(ms) {
  const d = new Date(ms);
  const day = formatUnit(d.getDate());
  const month = formatUnit(d.getMonth() + 1);
  const hours = formatUnit(d.getHours());
  const minutes = formatUnit(d.getMinutes());
  return `${day}/${month} ${hours}:${minutes}`;
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

// Il countdown resta sempre corretto (calculateAuctionState legge
// targetTime - Date.now() ad ogni chiamata, nessun decremento
// manuale). Ma il *rendering* a 60fps ha senso solo mentre il
// blocco countdown è davvero in viewport e la scheda è in primo
// piano: altrove basta un aggiornamento al secondo, i millisecondi
// non sono comunque percepibili se non si guarda il timer.
let countdownVisible = true;
let countdownPageVisible = true;

function scheduleCountdown() {
  if (countdownVisible && countdownPageVisible) {
    requestAnimationFrame(updateCountdown);
  } else {
    window.setTimeout(updateCountdown, 1000);
  }
}

/**
 * Callback eseguita ad ogni frame tramite requestAnimationFrame
 * (o, quando il timer non è visibile, una volta al secondo). Non
 * usa mai setInterval per il calcolo: il valore resta sempre
 * sincronizzato con l'orario reale.
 */
function updateCountdown() {
  if (eventExpired || eventEnded) return;

  const { phase, ms } = calculateAuctionState();

  if (phase !== "before" && !eventStarted) {
    handleEventStarted();
  }

  if (phase === "ended") {
    handleEventEnded(ms);
    return;
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

  scheduleCountdown();
}

/**
 * Avvia il loop del countdown, agganciato alla visibilità
 * dell'hero e della scheda (vedi perf.js).
 */
function startCountdown() {
  onHeroVisibilityChange((visible) => {
    countdownVisible = visible;
  });

  onPageVisibilityChange((visible) => {
    countdownPageVisible = visible;
  });

  scheduleCountdown();
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

/**
 * Quando è nota AUCTION_END_DATE e viene raggiunta, l'asta risulta
 * "terminata": invece di sparire (come nello stato "expired"), il
 * blocco mostra la durata finale (ore/minuti/secondi, fissa: non
 * conta più), le date di inizio/fine e un augurio di buon campionato.
 */
function handleEventEnded(durationMs) {
  if (eventEnded) return;
  eventEnded = true;

  document.body.classList.add("is-ended");
  dom.statusWrap.classList.add("is-ended");
  dom.countdownBlock.classList.remove("is-before", "is-live");

  const { hours, minutes, seconds } = msToUnits(durationMs);

  dom.phase.textContent = "L'ASTA È TERMINATA";
  setUnitText(dom.hours, "hours", String(hours));
  setUnitText(dom.minutes, "minutes", formatUnit(minutes));
  setUnitText(dom.seconds, "seconds", formatUnit(seconds));

  const startLabel = formatDateTime(targetTime);
  const endLabel = formatDateTime(endTime);
  dom.datesMessage.textContent = `Dal ${startLabel} al ${endLabel}`;

  const message = "Buon campionato a tutti! 🏆";
  dom.endedMessage.textContent = message;
  dom.seasonMessage.textContent = AUCTION_SEASON;
  dom.liveRegion.textContent =
    `L'asta è terminata dopo ${hours} ore, ${minutes} minuti e ${seconds} secondi, ` +
    `dal ${startLabel} al ${endLabel}. ${message} ${AUCTION_SEASON}`;

  // Senza segno/ms la riga è ancora più corta: ricalcola la taglia
  // su mobile (vedi handleEventStarted()).
  fitCountdownRow();
}
