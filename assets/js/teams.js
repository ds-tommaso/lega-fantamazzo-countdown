"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   teams.js — sezione "Le Fantasquadre": genera le card da un
   array dati, mescola l'ordine una sola volta al caricamento
   (Fisher-Yates) e le rivela con un IntersectionObserver.
   Per aggiungere/modificare una squadra, basta editare FANTASQUADRE.
   ============================================================ */

const FANTASQUADRE = [
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
];

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

function createTeamCard(entry, position) {
  const card = document.createElement("article");
  card.className = "team-card fx-card";

  const index = String(position).padStart(2, "0");

  card.innerHTML =
    '<span class="team-card-rule" aria-hidden="true"></span>' +
    '<span class="team-card-index" aria-hidden="true">' + index + "</span>" +
    '<div class="team-card-body">' +
      '<p class="team-card-label" aria-hidden="true">Fantasquadra</p>' +
      '<h3 class="team-card-name">' + entry.team + "</h3>" +
      '<span class="team-card-divider" aria-hidden="true"></span>' +
      '<p class="team-card-manager">' + entry.manager + "</p>" +
    "</div>";

  return card;
}

/**
 * Genera le 10 card in ordine casuale nel grid e attiva il reveal
 * allo scroll. Con prefers-reduced-motion (o senza
 * IntersectionObserver) le card sono mostrate subito, senza animare.
 */
function initFantasquadre() {
  const grid = document.getElementById("fantasquadre-grid");
  if (!grid) return;

  const shuffled = shuffleFisherYates(FANTASQUADRE.slice());
  const fragment = document.createDocumentFragment();

  shuffled.forEach((entry, i) => {
    fragment.appendChild(createTeamCard(entry, i + 1));
  });

  grid.appendChild(fragment);

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
