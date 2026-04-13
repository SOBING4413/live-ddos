/**
 * script.js - Main entry point for Cyber Attack Map
 * 
 * Initializes the map, data manager, and UI manager.
 * Coordinates data flow between modules.
 * 
 * DATA INTEGRITY:
 * - Live mode: Real data from abuse.ch (Feodo Tracker, URLhaus, ThreatFox)
 * - Simulation mode: Based on published threat reports, clearly labeled
 * - No fabricated data presented as real
 */

import { DataManager } from './data.js';
import { MapManager } from './map.js';
import { UIManager } from './ui.js';

document.addEventListener('DOMContentLoaded', async function () {
  // Initialize managers
  const mapManager = new MapManager('map-container');
  const dataManager = new DataManager();
  const uiManager = new UIManager();

  // Initialize map
  mapManager.init();

  // Initialize UI
  uiManager.init();

  // Wire up data events to map and UI
  dataManager.onNewEvent((event) => {
    mapManager.addAttackEvent(event);
    uiManager.addEventToFeed(event);
  });

  // Smooth periodic stats update (every 800ms for responsiveness)
  setInterval(() => {
    uiManager.updateStats(dataManager);
  }, 800);

  // Start fetching data
  uiManager.showNotification('Connecting to verified threat intelligence feeds...', 'info');

  await dataManager.init();

  // Update UI with data source info
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

  // Handle cleanup
  window.addEventListener('beforeunload', () => {
    dataManager.destroy();
    mapManager.destroy();
  });

  console.log('Cyber Attack Map initialized. Data source:', dataManager.dataSource);
  if (dataManager.isLiveMode) {
    console.log(`Live data points loaded: ${dataManager.liveDataCount}`);
  }
  if (dataManager.isSimulationMode) {
    console.log('Simulation based on: Check Point 2024, Kaspersky 2024, ENISA 2024, Fortinet 2024 reports');
  }
});
