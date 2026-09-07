"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   page-nav.js — due pulsanti fissi per saltare da una sezione
   ("pagina") alla successiva/precedente. La sezione corrente è
   dedotta dallo scroll, non da uno stato interno: funziona anche
   se l'utente scrolla manualmente con la rotella o il touch.
   ============================================================ */

/**
 * Inizializza i pulsanti di navigazione tra le sezioni di <main>.
 * Il pulsante "precedente" resta nascosto sulla prima sezione,
 * quello "successivo" sull'ultima.
 */
function initPageNav() {
  const sections = Array.from(document.querySelectorAll("main > section"));
  const prevBtn = document.getElementById("nav-prev");
  const nextBtn = document.getElementById("nav-next");

  if (sections.length < 2 || !prevBtn || !nextBtn) return;

  /**
   * Indice della sezione "corrente": l'ultima il cui inizio ha
   * già superato un terzo dell'altezza della finestra, così il
   * cambio avviene quando la sezione successiva ha già preso
   * il sopravvento visivamente, non al primo pixel di overlap.
   * Se la pagina è scrollata fino in fondo, conta comunque come
   * ultima sezione: l'ultima sezione può essere più corta di un
   * terzo di finestra e non superare mai quella soglia.
   */
  function getCurrentIndex() {
    const doc = document.documentElement;
    const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 1;
    if (atBottom) return sections.length - 1;

    const threshold = window.scrollY + window.innerHeight * 0.35;
    let index = 0;
    sections.forEach((section, i) => {
      if (section.offsetTop <= threshold) index = i;
    });
    return index;
  }

  function updateButtons() {
    const index = getCurrentIndex();
    prevBtn.classList.toggle("is-hidden", index <= 0);
    nextBtn.classList.toggle("is-hidden", index >= sections.length - 1);
  }

  function goTo(index) {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    sections[clamped].scrollIntoView({ block: "start" });
  }

  prevBtn.addEventListener("click", () => goTo(getCurrentIndex() - 1));
  nextBtn.addEventListener("click", () => goTo(getCurrentIndex() + 1));

  window.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);

  updateButtons();
}
