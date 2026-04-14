/**
 * live-script.js - Main runtime for live threat map page.
 * Wires together globe rendering, data ingestion, and UI updates.
 */

import { MapManager } from './map.js';
import { DataManager } from './data.js';
import { UIManager } from './ui.js';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', async () => {
  const map = new MapManager('map-container').init();
  const ui = new UIManager().init();
  const data = new DataManager();

  // Forward incoming events to globe + feed.
  data.onNewEvent((event) => {
    map.addAttackEvent(event);
    ui.addEventToFeed(event);

    if (event.severity === 'critical') {
      ui.showNotification(
        `CRITICAL ${event.attackType.toUpperCase()}: ${event.source.countryName} → ${event.target.countryName}`,
        'warning'
      );
    }
  });

  // Keep dashboard counters and status fresh.
  const uiTick = setInterval(() => {
    ui.updateStats(data);
  }, 1000);

  // If initialization takes too long, immediately switch to simulation UX.
  const initTimeoutMs = 15000;
  const initResult = await Promise.race([
    data.init().then(() => 'ok'),
    wait(initTimeoutMs).then(() => 'timeout'),
  ]);

  if (initResult === 'timeout' && !data.isLiveMode && !data.isSimulationMode) {
    data.isSimulationMode = true;
    data.dataSource = 'SIMULATION — Fallback mode (connection timeout)';
    data.startSimulationMode();
    ui.showNotification('Live feed timeout. Switched to simulation mode.', 'warning');
  }

  // Initial paint right after mode is set.
  ui.updateStats(data);

  // Hook globe overlay controls.
  window.addEventListener('globe-zoom', (e) => {
    const direction = e?.detail?.direction;
    if (direction === 'in') {
      map.targetZoom = Math.max(map.minZoom, map.targetZoom - 25);
    } else if (direction === 'out') {
      map.targetZoom = Math.min(map.maxZoom, map.targetZoom + 25);
    }
  });

  window.addEventListener('globe-reset', () => {
    map.targetZoom = 280;
    map.targetRotation = { x: 0.3, y: -0.5 };
    map.autoRotate = true;
  });

  window.addEventListener('beforeunload', () => {
    clearInterval(uiTick);
    data.destroy();
    map.destroy();
  });
});
