"use strict";

/* ============================================================
   LEGA FANTAMAZZO — L'ASTA
   audio.js — rumore di stadio opzionale, attivabile solo dall'utente.
   ============================================================ */

/**
 * Genera un rumore di fondo "da stadio" (rumore filtrato con
 * modulazione lenta) tramite Web Audio API, senza alcun file
 * audio esterno. Parte SOLO al click esplicito dell'utente,
 * mai in autoplay.
 */
function initSoundToggle() {
  const button = document.getElementById("sound-toggle");
  if (!button) return;

  const label = button.querySelector(".sound-toggle-text");
  let audioCtx = null;
  let noiseSource = null;
  let filterNode = null;
  let gainNode = null;
  let lfo = null;
  let isPlaying = false;

  function buildNoiseBuffer(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function startAmbience() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = audioCtx || new AudioContextClass();
    if (audioCtx.state === "suspended") audioCtx.resume();

    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buildNoiseBuffer(audioCtx);
    noiseSource.loop = true;

    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "bandpass";
    filterNode.frequency.value = 420;
    filterNode.Q.value = 0.6;

    lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filterNode.frequency);

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;

    noiseSource.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start();
    lfo.start();
    gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 1.2);

    isPlaying = true;
  }

  function stopAmbience() {
    if (!audioCtx || !gainNode) return;
    const now = audioCtx.currentTime;
    gainNode.gain.linearRampToValueAtTime(0, now + 0.8);

    const sourceToStop = noiseSource;
    const lfoToStop = lfo;
    window.setTimeout(() => {
      if (sourceToStop) sourceToStop.stop();
      if (lfoToStop) lfoToStop.stop();
    }, 900);

    isPlaying = false;
  }

  button.addEventListener("click", () => {
    if (!isPlaying) {
      startAmbience();
      button.setAttribute("aria-pressed", "true");
      if (label) label.textContent = "Disattiva audio stadio";
    } else {
      stopAmbience();
      button.setAttribute("aria-pressed", "false");
      if (label) label.textContent = "Attiva audio stadio";
    }
  });
}
