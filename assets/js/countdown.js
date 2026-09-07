"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   countdown.js — calcolo, formattazione e rendering del countdown.
   Dipende dalle costanti/variabili definite in config.js.
   ============================================================ */

/**
 * Calcola il tempo restante rispetto al timestamp target.
 * La fonte di verità è sempre Date.now(): nessun contatore
 * viene decrementato manualmente, quindi non c'è drift.
 * Le ore NON vengono ridotte modulo 24: possono superare 23.
 */
function calculateRemainingTime() {
  const remainingMs = Math.max(0, targetTime - Date.now());

  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const milliseconds = Math.floor(remainingMs % 1000);

  return { remainingMs, hours, minutes, seconds, milliseconds };
}

/**
 * Formatta un numero con zeri iniziali (es. 7 -> "07").
 */
function formatUnit(value, length = 2) {
  return String(value).padStart(length, "0");
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
function announceForScreenReaders(hours, minutes, seconds) {
  const minuteKey = hours * 60 + minutes;
  if (minuteKey === lastAnnouncedMinute) return;
  lastAnnouncedMinute = minuteKey;
  dom.liveRegion.textContent =
    `Mancano ${hours} ore, ${minutes} minuti e ${seconds} secondi all'inizio dell'asta.`;
}

/**
 * Callback eseguita ad ogni frame tramite requestAnimationFrame.
 * Non usa mai setInterval: il rendering segue il refresh rate
 * del browser restando comunque sincronizzato con l'orario reale.
 */
function updateCountdown() {
  if (eventStarted) return;

  const { remainingMs, hours, minutes, seconds, milliseconds } = calculateRemainingTime();

  setUnitText(dom.hours, "hours", formatUnit(hours));
  setUnitText(dom.minutes, "minutes", formatUnit(minutes));
  setUnitText(dom.seconds, "seconds", formatUnit(seconds));
  dom.milliseconds.textContent = formatUnit(milliseconds, 3);

  announceForScreenReaders(hours, minutes, seconds);

  if (remainingMs <= 0) {
    handleEventStarted();
    return;
  }

  requestAnimationFrame(updateCountdown);
}

/**
 * Avvia il loop del countdown.
 */
function startCountdown() {
  requestAnimationFrame(updateCountdown);
}

/**
 * Gestisce il passaggio allo stato "asta iniziata": ferma il
 * countdown su 00:00:00:000, mostra il messaggio e innesca una
 * breve transizione cinematografica (flash + boost luci/particelle).
 */
function handleEventStarted() {
  if (eventStarted) return;
  eventStarted = true;

  dom.hours.textContent = "00";
  dom.minutes.textContent = "00";
  dom.seconds.textContent = "00";
  dom.milliseconds.textContent = "000";

  document.body.classList.add("is-live");
  document.body.classList.add("is-flash");
  window.setTimeout(() => document.body.classList.remove("is-flash"), 700);

  dom.status.textContent = "L'asta è iniziata";
  dom.status.classList.add("is-visible");
  dom.liveRegion.textContent = "L'asta è iniziata.";

  boostParticlesFn();
}
