"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   particles.js — polvere illuminata dai riflettori (canvas 2D).
   ============================================================ */

/**
 * Disegna poche particelle leggere su canvas 2D, con drift
 * verticale lentissimo e flicker di opacità. Il numero di
 * particelle si riduce su mobile e con prefers-reduced-motion
 * l'animazione non riparte dopo il primo frame statico.
 */
function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let width = 0;
  let height = 0;
  let particles = [];
  let boosted = false;

  function particleCountForViewport() {
    return window.innerWidth < MOBILE_BREAKPOINT ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 1.6,
      speedY: -(0.04 + Math.random() * 0.1),
      driftX: (Math.random() - 0.5) * 0.05,
      alpha: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    particles = Array.from({ length: particleCountForViewport() }, createParticle);
  }

  function render(timestamp) {
    ctx.clearRect(0, 0, width, height);
    const speedMul = boosted ? 2.2 : 1;

    particles.forEach((p) => {
      if (!prefersReduced) {
        p.y += p.speedY * speedMul;
        p.x += p.driftX * speedMul;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
      }

      const flicker = prefersReduced ? 1 : 0.6 + 0.4 * Math.sin(timestamp / 900 + p.phase);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 247, 244, ${(p.alpha * flicker).toFixed(3)})`;
      ctx.fill();
    });

    if (!prefersReduced) requestAnimationFrame(render);
  }

  window.addEventListener(
    "resize",
    () => {
      resize();
      seed();
    },
    { passive: true }
  );

  resize();
  seed();
  requestAnimationFrame(render);

  boostParticlesFn = () => {
    boosted = true;
    window.setTimeout(() => {
      boosted = false;
    }, 4000);
  };
}
