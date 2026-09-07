"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   journey.js — camera cinematografica che segue lo scroll lungo
   una linea del campo (sezione #pitch-journey).

   Tutte le costanti qui sotto sono le "manopole" della sequenza:
   modificale per cambiare durata delle fasi, zoom, rotazione.
   Il progresso (0→1) è LOCALE alla sezione journey, calcolato dal
   suo bounding rect: non tocca lo scroll di hero/proclama.
   ============================================================ */

// Confini di fase sul progresso locale (0 → 1) della sezione.
const JOURNEY_ZOOM_END = 0.18; // campo lontano → aggancio al punto di partenza
const JOURNEY_APPROACH_END = 0.38; // avvicinamento alla linea
const JOURNEY_TRAVEL_END = 0.85; // viaggio lungo il path (dopo: arrivo)

// All'interno della fase di viaggio (0 → 1 locale), soglie di cambio tappa.
const JOURNEY_STAGE_RILANCI_AT = 0.33;
const JOURNEY_STAGE_GLORIA_AT = 0.66;

// Oltre questa soglia (progresso globale della sezione) la camera è
// ormai davanti alla porta: le luci dello stadio vanno al massimo.
const JOURNEY_ARRIVAL_GLOW_AT = 0.92;

// Smoothing della camera: più basso = più "pesante"/cinematografico.
const JOURNEY_SMOOTHING = 0.075;

// Zoom (scala del gruppo camera nello spazio SVG) per fase.
const JOURNEY_SCALE_FAR = 1;
const JOURNEY_SCALE_LOCK = 2.5;
const JOURNEY_SCALE_TRAVEL_MIN = 3.1;
const JOURNEY_SCALE_TRAVEL_MAX = 4.3;
const JOURNEY_SCALE_ARRIVAL = 5.2;

// Inclinazione macro (rotateX del contenitore SVG): da ripresa aerea
// (stesso angolo del campo in hero) a ripresa quasi rasoterra.
const JOURNEY_ROTATEX_FAR = 58;
const JOURNEY_ROTATEX_NEAR = 14;

// Quanto la camera "ruota" seguendo la direzione della linea (smorzato).
const JOURNEY_ROTATE_DAMPING = 0.35;
const JOURNEY_ROTATE_MAX_DEG = 32;

// Micro-oscillazioni organiche (quasi impercettibili).
const JOURNEY_SWAY_POSITION = 4;
const JOURNEY_SWAY_ROTATION = 0.6;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/**
 * Inizializza la sezione journey: su desktop/mobile con movimento
 * consentito aggancia una camera SVG allo scroll; con
 * prefers-reduced-motion mostra le tappe già in vista, impilate,
 * con un reveal semplice (nessun aggancio, nessun rAF).
 */
function initJourney() {
  const section = document.getElementById("pitch-journey");
  const sticky = document.getElementById("journey-sticky");
  const cameraGroup = document.getElementById("journey-camera");
  const pathEl = document.getElementById("journey-path");
  const stages = document.querySelectorAll(".journey-stage");

  if (!section || !sticky || !cameraGroup || !pathEl || !stages.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    initJourneyStatic(stages);
    return;
  }

  initJourneyCamera(section, sticky, cameraGroup, pathEl, stages);
}

/**
 * Fallback statico: nessuna camera, nessuno sticky. Le tappe sono
 * già leggibili e ricevono solo un fade/slide quando entrano in
 * viewport, riusando lo stesso pattern di scroll-reveal.js.
 */
function initJourneyStatic(stages) {
  stages.forEach((el) => el.classList.add("is-active"));

  if (!("IntersectionObserver" in window)) {
    stages.forEach((el) => el.classList.add("is-in-view"));
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

  stages.forEach((el) => observer.observe(el));
}

/**
 * Camera cinematografica: calcola ad ogni frame la posizione lungo
 * il path (getPointAtLength) e la direzione (tangente fra due punti
 * vicini), poi trasforma il gruppo SVG in modo che il punto corrente
 * resti centrato mentre la scena ruota/scala seguendo il percorso.
 * L'inclinazione macro (rotateX) è invece applicata via CSS sull'
 * elemento <svg>, separatamente dalla matematica del path.
 */
function initJourneyCamera(section, sticky, cameraGroup, pathEl, stages) {
  const pathLength = pathEl.getTotalLength();

  let targetProgress = 0;
  let currentProgress = 0;
  let activeStage = null;
  const swayPhase = Math.random() * Math.PI * 2;
  let rotateXReach = window.innerWidth < MOBILE_BREAKPOINT ? 0.4 : 1;

  window.addEventListener(
    "resize",
    () => {
      rotateXReach = window.innerWidth < MOBILE_BREAKPOINT ? 0.4 : 1;
    },
    { passive: true }
  );

  function updateTargetProgress() {
    const rect = section.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    targetProgress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
  }

  function stageForTravelT(t) {
    if (t < JOURNEY_STAGE_RILANCI_AT) return "strategia";
    if (t < JOURNEY_STAGE_GLORIA_AT) return "rilanci";
    return "gloria";
  }

  function updateStages(progress) {
    let key = null;
    if (progress >= JOURNEY_APPROACH_END) {
      const t = clamp01((progress - JOURNEY_APPROACH_END) / (JOURNEY_TRAVEL_END - JOURNEY_APPROACH_END));
      key = stageForTravelT(t);
    }
    if (key === activeStage) return;
    activeStage = key;
    stages.forEach((el) => el.classList.toggle("is-active", el.dataset.stage === key));
  }

  function render(progress, timestamp) {
    let scale;
    let rotateX;
    let distanceT;

    if (progress <= JOURNEY_ZOOM_END) {
      const t = easeInOut(progress / JOURNEY_ZOOM_END);
      scale = lerp(JOURNEY_SCALE_FAR, JOURNEY_SCALE_LOCK, t);
      rotateX = JOURNEY_ROTATEX_FAR;
      distanceT = 0;
    } else if (progress <= JOURNEY_APPROACH_END) {
      const t = easeInOut((progress - JOURNEY_ZOOM_END) / (JOURNEY_APPROACH_END - JOURNEY_ZOOM_END));
      scale = lerp(JOURNEY_SCALE_LOCK, JOURNEY_SCALE_TRAVEL_MIN, t);
      rotateX = lerp(JOURNEY_ROTATEX_FAR, JOURNEY_ROTATEX_NEAR, t);
      distanceT = 0;
    } else if (progress <= JOURNEY_TRAVEL_END) {
      const t = (progress - JOURNEY_APPROACH_END) / (JOURNEY_TRAVEL_END - JOURNEY_APPROACH_END);
      scale = lerp(JOURNEY_SCALE_TRAVEL_MIN, JOURNEY_SCALE_TRAVEL_MAX, t);
      rotateX = JOURNEY_ROTATEX_NEAR;
      distanceT = t;
    } else {
      const t = easeInOut((progress - JOURNEY_TRAVEL_END) / (1 - JOURNEY_TRAVEL_END));
      scale = lerp(JOURNEY_SCALE_TRAVEL_MAX, JOURNEY_SCALE_ARRIVAL, t);
      rotateX = JOURNEY_ROTATEX_NEAR;
      distanceT = 1;
    }

    const dist = distanceT * pathLength;
    const point = pathEl.getPointAtLength(dist);
    const aheadPoint = pathEl.getPointAtLength(Math.min(pathLength, dist + 1));
    const angleRad = Math.atan2(aheadPoint.y - point.y, aheadPoint.x - point.x);

    let rotateDeg = angleRad * (180 / Math.PI) * JOURNEY_ROTATE_DAMPING;
    rotateDeg = Math.max(-JOURNEY_ROTATE_MAX_DEG, Math.min(JOURNEY_ROTATE_MAX_DEG, rotateDeg));

    const t = timestamp / 1000;
    const swayX = Math.sin(t * 0.6 + swayPhase) * JOURNEY_SWAY_POSITION;
    const swayY = Math.cos(t * 0.5 + swayPhase) * JOURNEY_SWAY_POSITION * 0.7;
    const swayRot = Math.sin(t * 0.4 + swayPhase) * JOURNEY_SWAY_ROTATION;

    cameraGroup.setAttribute(
      "transform",
      `scale(${scale.toFixed(3)}) rotate(${(rotateDeg + swayRot).toFixed(2)}) translate(${(-point.x + swayX).toFixed(2)}, ${(-point.y + swayY).toFixed(2)})`
    );

    sticky.style.setProperty("--journey-rotateX", `${(rotateX * rotateXReach).toFixed(2)}deg`);
    sticky.style.setProperty("--journey-glow", (0.5 + clamp01(progress) * 0.6).toFixed(2));
  }

  function frame(timestamp) {
    updateTargetProgress();
    currentProgress += (targetProgress - currentProgress) * JOURNEY_SMOOTHING;
    render(currentProgress, timestamp);
    updateStages(currentProgress);
    sticky.classList.toggle("is-arrival", currentProgress > JOURNEY_ARRIVAL_GLOW_AT);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
