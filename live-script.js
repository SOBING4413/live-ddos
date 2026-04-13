/**
 * live-script.js - Main entry point for Cyber Attack Map (Live Page)
 * 
 * Initializes the 3D globe, data manager, and UI manager.
 * Coordinates data flow between modules.
 */

import { DataManager } from './data.js';
import { MapManager } from './map.js';
import { UIManager } from './ui.js';

document.addEventListener('DOMContentLoaded', async function () {
  const mapManager = new MapManager('map-container');
  const dataManager = new DataManager();
  const uiManager = new UIManager();

  mapManager.init();
  uiManager.init();

  // Globe control events
  window.addEventListener('globe-zoom', (e) => {
    if (e.detail.direction === 'in') {
      mapManager.targetZoom = Math.max(mapManager.minZoom, mapManager.targetZoom - 30);
    } else {
      mapManager.targetZoom = Math.min(mapManager.maxZoom, mapManager.targetZoom + 30);
    }
  });

  window.addEventListener('globe-reset', () => {
    mapManager.targetRotation = { x: 0.3, y: -0.5 };
    mapManager.targetZoom = 280;
    mapManager.autoRotate = true;
  });

  dataManager.onNewEvent((event) => {
    mapManager.addAttackEvent(event);
    uiManager.addEventToFeed(event);
  });

  setInterval(() => {
    uiManager.updateStats(dataManager);
  }, 800);

  uiManager.showNotification('Initializing 3D Globe — Connecting to threat intelligence feeds...', 'info');

  await dataManager.init();

  uiManager.updateStats(dataManager);

  if (dataManager.isSimulationMode) {
    uiManager.showNotification(
      '⚠ SIMULATION MODE — Displaying patterns based on published threat intelligence reports (Check Point, Kaspersky, ENISA). Live API feeds unavailable due to browser CORS restrictions.',
      'warning'
    );
  } else if (dataManager.isLiveMode) {
    uiManager.showNotification(
      `✓ Connected to verified source: ${dataManager.dataSource}`,
      'success'
    );
  }

  window.addEventListener('beforeunload', () => {
    dataManager.destroy();
    mapManager.destroy();
  });

  console.log('Cyber Attack Map 3D Globe initialized. Data source:', dataManager.dataSource);
});
