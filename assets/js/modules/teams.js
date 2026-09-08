"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   teams.js — sezione "Le Fantasquadre": genera le card da un
   array dati, mescola l'ordine una sola volta al caricamento
   (Fisher-Yates) e le rivela con un IntersectionObserver.
   Per aggiungere/modificare una squadra, basta editare LEAGUE_CONFIG.teams
   in assets/js/config.js.
   ============================================================ */

const FANTASQUADRE = LEAGUE_CONFIG.teams;

const COPY_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="9" y="9" width="13" height="13" rx="2"></rect>' +
  '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
  "</svg>";

const CHECK_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
  '<polyline points="20 6 9 17 4 12"></polyline>' +
  "</svg>";

const NUMERI_ITALIANI = [
  "zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove",
  "dieci", "undici", "dodici", "tredici", "quattordici", "quindici", "sedici",
  "diciassette", "diciotto", "diciannove", "venti",
];

/**
 * Converte un numero in parola italiana (0-20); oltre, usa la cifra.
 */
function numeroInParole(n) {
  return NUMERI_ITALIANI[n] || String(n);
}

/**
 * Aggiorna il testo "N squadre. N strategie..." con il conteggio
 * effettivo di FANTASQUADRE, così il claim resta sempre corretto.
 */
function updateFantasquadreLede() {
  const lede = document.getElementById("fantasquadre-lede");
  if (!lede) return;

  const parola = numeroInParole(FANTASQUADRE.length);
  const capitalizzata = parola.charAt(0).toUpperCase() + parola.slice(1);
  lede.textContent = capitalizzata + " squadre. " + capitalizzata + " strategie. Un solo trono.";
}

/**
 * Fisher-Yates in place. Eseguito una sola volta al caricamento:
 * l'ordine risultante resta fisso per tutta la sessione di lettura.
 */
function shuffleFisherYates(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Sfugge il testo per un uso sicuro dentro attributi/markup HTML.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Markup del pulsante "copia": due icone sovrapposte (copia/spunta)
 * che si alternano via CSS in base alla classe .is-copied, aggiunta
 * e rimossa da initCopyButtons() dopo il click.
 */
function copyButtonHTML(value, label) {
  const safeValue = escapeHtml(value);
  const safeLabel = escapeHtml(label);
  return (
    '<button type="button" class="copy-btn" data-copy-value="' + safeValue + '" data-copy-label="' + safeLabel + '" aria-label="' + safeLabel + '">' +
    '<span class="copy-icon icon-copy" aria-hidden="true">' + COPY_ICON_SVG + "</span>" +
    '<span class="copy-icon icon-check" aria-hidden="true">' + CHECK_ICON_SVG + "</span>" +
    "</button>"
  );
}

function createTeamCard(entry, position) {
  const card = document.createElement("article");
  card.className = "team-card fx-card";

  const index = String(position).padStart(2, "0");

  card.innerHTML =
    '<span class="team-card-rule" aria-hidden="true"></span>' +
    '<span class="team-card-index" aria-hidden="true">' + index + "</span>" +
    '<div class="team-card-body">' +
    '<div class="team-card-row team-card-label-row">' +
    '<p class="team-card-label" aria-hidden="true">Fantasquadra</p>' +
    copyButtonHTML(entry.team + " - " + entry.manager, "Copia squadra e allenatore") +
    "</div>" +
    '<h3 class="team-card-name">' + entry.team + "</h3>" +
    '<span class="team-card-divider" aria-hidden="true"></span>' +
    '<p class="team-card-manager">' + entry.manager + "</p>" +
    "</div>";

  return card;
}

/**
 * Copia il testo negli appunti (Clipboard API con fallback
 * execCommand per contesti non sicuri/browser meno recenti).
 */
function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

/**
 * Un solo listener delegato sul grid: al click su un pulsante
 * "copia", copia il valore associato e mostra brevemente la spunta
 * verde al posto dell'icona, per poi tornare alla copia.
 */
function initCopyButtons(grid) {
  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".copy-btn");
    if (!button || !grid.contains(button)) return;

    copyTextToClipboard(button.dataset.copyValue)
      .then(() => flashCopied(button))
      .catch(() => { });
  });
}

function flashCopied(button) {
  button.classList.add("is-copied");
  button.setAttribute("aria-label", "Copiato!");

  window.clearTimeout(button._copyResetTimer);
  button._copyResetTimer = window.setTimeout(() => {
    button.classList.remove("is-copied");
    button.setAttribute("aria-label", button.dataset.copyLabel);
  }, 1600);
}

/**
 * Genera le 10 card in ordine casuale nel grid e attiva il reveal
 * allo scroll. Con prefers-reduced-motion (o senza
 * IntersectionObserver) le card sono mostrate subito, senza animare.
 */
function initFantasquadre() {
  const grid = document.getElementById("fantasquadre-grid");
  if (!grid) return;

  updateFantasquadreLede();

  const shuffled = shuffleFisherYates(FANTASQUADRE.slice());
  const fragment = document.createDocumentFragment();

  shuffled.forEach((entry, i) => {
    fragment.appendChild(createTeamCard(entry, i + 1));
  });

  grid.appendChild(fragment);
  initCopyButtons(grid);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = document.querySelectorAll(".fantasquadre .fx-reveal, .fantasquadre .fx-card");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach((el) => observer.observe(el));
}
