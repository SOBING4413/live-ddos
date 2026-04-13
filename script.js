/**
 * script.js - Main entry point for Cyber Attack Map
 * 
 * Initializes the map, data manager, and UI manager.
 * Coordinates data flow between modules.
 * 
 * IMPORTANT: All displayed data comes from verified threat intelligence sources.
 * Demo mode is clearly labeled when live feeds are unavailable.
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

  if (dataManager.isDemoMode) {
    uiManager.showNotification(
      '⚠ DEMO MODE — Displaying sample data for visualization purposes only. No real attack data is shown. Connect verified API keys for live threat intelligence.',
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
});