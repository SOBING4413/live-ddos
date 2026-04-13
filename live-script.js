/**
 * script.js - Main entry point for Cyber Attack Map
 * Initializes the globe and starts simulated attack events
 */

import { MapManager } from './map.js';
import { generateRandomAttack } from './data.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize the globe (async - loads textures)
  const map = new MapManager('globe-container');
  await map.init();

  // Stats counters
  let attackCount = 0;
  let activeThreats = 0;

  const attackCountEl = document.getElementById('attack-count');
  const activeThreatsEl = document.getElementById('active-threats');

  function updateStats() {
    attackCount++;
    activeThreats = Math.min(map.attackArcs.length + map.pulseMarkers.length, 999);
    if (attackCountEl) attackCountEl.textContent = attackCount.toLocaleString();
    if (activeThreatsEl) activeThreatsEl.textContent = activeThreats;
  }

  // Launch attacks at random intervals
  function scheduleAttack() {
    const delay = 400 + Math.random() * 1200;
    setTimeout(() => {
      const event = generateRandomAttack();
      map.addAttackEvent(event);
      updateStats();
      scheduleAttack();
    }, delay);
  }

  // Start with a burst of initial attacks
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const event = generateRandomAttack();
      map.addAttackEvent(event);
      updateStats();
    }, i * 300);
  }

  // Continue with random attacks
  setTimeout(scheduleAttack, 3000);

  // Periodic active threats update
  setInterval(() => {
    activeThreats = map.attackArcs.length + map.pulseMarkers.length;
    if (activeThreatsEl) activeThreatsEl.textContent = activeThreats;
  }, 1000);
});
