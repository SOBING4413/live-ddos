/**
 * ui.js - UI management for Cyber Attack Map
 * 
 * Handles event feed updates, statistics counters,
 * sidebar management, and responsive layout.
 * All information displayed is verified and attributed to sources.
 */

import { ATTACK_TYPES } from './data.js';

/**
 * UIManager handles all DOM updates and interactions
 */
export class UIManager {
  constructor() {
    this.eventFeedEl = document.getElementById('event-feed');
    this.totalAttacksEl = document.getElementById('total-attacks');
    this.activeThreatsEl = document.getElementById('active-threats');
    this.attacksPerMinEl = document.getElementById('attacks-per-min');
    this.countriesCountEl = document.getElementById('countries-count');
    this.topSourcesEl = document.getElementById('top-sources');
    this.topTargetsEl = document.getElementById('top-targets');
    this.attackTypesEl = document.getElementById('attack-types-stats');
    this.activeRoutesEl = document.getElementById('active-routes');
    this.highSeverityEl = document.getElementById('high-severity-alerts');
    this.dataSourceEl = document.getElementById('data-source');
    this.dataSourceShortEl = document.getElementById('data-source-short');
    this.dataStatusEl = document.getElementById('data-status');
    this.accuracyNoticeEl = document.getElementById('accuracy-notice');
    this.feedCountEl = document.getElementById('feed-count');
    this.lastUpdateEl = document.getElementById('last-update-time');
    this.dataPointsEl = document.getElementById('data-points-count');
    this.eventsPerSecEl = document.getElementById('events-per-sec');
    this.threatLevelFillEl = document.getElementById('threat-level-fill');
    this.threatLevelDescEl = document.getElementById('threat-level-desc');
    this.dataDisclaimerEl = document.getElementById('data-disclaimer');
    this.maxFeedItems = 60;
    this.sidebarOpen = true;
    this.previousTotal = 0;
    this.feedItemCount = 0;
  }

  /**
   * Initialize UI event handlers
   */
  init() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleSidebar());
    }

    if (window.innerWidth < 768) {
      this.sidebarOpen = false;
      document.getElementById('sidebar')?.classList.add('collapsed');
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth < 768 && this.sidebarOpen) {
        this.sidebarOpen = false;
        document.getElementById('sidebar')?.classList.add('collapsed');
      }
    });

    this.renderAttackTypeLegend();
    return this;
  }

  /**
   * Render the attack type legend with descriptions
   */
  renderAttackTypeLegend() {
    const legendEl = document.getElementById('attack-legend');
    if (!legendEl) return;

    legendEl.innerHTML = Object.entries(ATTACK_TYPES).map(([key, type]) => `
      <div class="legend-item" title="${type.description}">
        <span class="legend-dot" style="background: ${type.color}; box-shadow: 0 0 8px ${type.color};"></span>
        <span class="legend-label">${type.icon} ${type.label}</span>
        <span class="legend-count" id="legend-count-${key}" style="color: ${type.color};">0</span>
      </div>
    `).join('');
  }

  /**
   * Add a new event to the live feed with detailed information
   */
  addEventToFeed(event) {
    if (!this.eventFeedEl) return;

    const type = ATTACK_TYPES[event.attackType] || ATTACK_TYPES.intrusion;
    const timeStr = event.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = event.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const severity = event.severity || 'medium';
    const severityLabel = severity.toUpperCase();

    // Show verified badge for live data
    const verifiedBadge = event.verified
      ? '<span class="event-verified" title="Data from verified threat intelligence source">✓ VERIFIED</span>'
      : '<span class="event-simulated" title="Simulated based on published threat reports">SIM</span>';

    this.feedItemCount++;

    const eventEl = document.createElement('div');
    eventEl.className = 'event-item event-item-new';
    eventEl.innerHTML = `
      <div class="event-header">
        <span class="event-type" style="color: ${type.color};">
          ${type.icon} ${type.label}
          <span class="event-severity ${severity}">${severityLabel}</span>
          ${verifiedBadge}
        </span>
        <span class="event-time">${dateStr} ${timeStr}</span>
      </div>
      <div class="event-route">
        <span class="event-source" title="${event.source.city}, ${event.source.countryName}">
          ${event.source.countryFlag || '🌐'} ${event.source.city}, ${event.source.countryName}
        </span>
        <span class="event-arrow" style="color: ${type.color};">→</span>
        <span class="event-target" title="${event.target.city}, ${event.target.countryName}">
          ${event.target.countryFlag || '🌐'} ${event.target.city}, ${event.target.countryName}
        </span>
      </div>
      <div class="event-meta">
        ${event.source.ip && event.source.ip !== 'N/A' ? `
          <div class="event-ip">
            <span class="event-ip-label">SRC:</span> ${this.escapeHtml(event.source.ip)}
          </div>
        ` : ''}
        ${event.target.port ? `<span class="event-port">Port ${event.target.port}</span>` : ''}
        ${event.indicatorType && event.indicatorType !== 'simulation' ? `<span class="event-port" style="color: var(--accent-cyan); background: rgba(0, 229, 255, 0.1);">${event.indicatorType}</span>` : ''}
      </div>
      <div class="event-details">${this.escapeHtml(event.details)}</div>
      <div class="event-source-label">Source: ${event.dataSource}</div>
    `;

    this.eventFeedEl.insertBefore(eventEl, this.eventFeedEl.firstChild);

    requestAnimationFrame(() => {
      setTimeout(() => eventEl.classList.remove('event-item-new'), 500);
    });

    while (this.eventFeedEl.children.length > this.maxFeedItems) {
      const last = this.eventFeedEl.lastChild;
      if (last && last.parentNode === this.eventFeedEl) {
        this.eventFeedEl.removeChild(last);
      }
    }
  }

  /**
   * Update the statistics display with smooth counter animation
   */
  updateStats(dataManager) {
    // Total attacks counter
    if (this.totalAttacksEl) {
      const newTotal = dataManager.stats.totalAttacks;
      if (newTotal !== this.previousTotal) {
        this.animateCounter(this.totalAttacksEl, this.previousTotal, newTotal, 400);
        this.previousTotal = newTotal;
      }
    }

    // Active threats (last 60 seconds)
    if (this.activeThreatsEl) {
      const recentCount = dataManager.events.filter(e => {
        const age = Date.now() - e.timestamp.getTime();
        return age < 60000;
      }).length;
      this.activeThreatsEl.textContent = recentCount.toLocaleString();
    }

    // Attacks per minute
    if (this.attacksPerMinEl) {
      this.attacksPerMinEl.textContent = dataManager.getAttacksPerMinute().toLocaleString();
    }

    // Countries count
    if (this.countriesCountEl) {
      this.countriesCountEl.textContent = dataManager.stats.countriesInvolved.size.toLocaleString();
    }

    // Events per second
    if (this.eventsPerSecEl) {
      this.eventsPerSecEl.textContent = `${dataManager.getEventsPerSecond()} events/s`;
    }

    // Feed count
    if (this.feedCountEl) {
      this.feedCountEl.textContent = this.feedItemCount.toLocaleString();
    }

    // Data points
    if (this.dataPointsEl) {
      this.dataPointsEl.textContent = dataManager.stats.totalAttacks.toLocaleString();
    }

    // Last update time
    if (this.lastUpdateEl && dataManager.lastFetchTime) {
      this.lastUpdateEl.textContent = dataManager.lastFetchTime.toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } else if (this.lastUpdateEl && dataManager.isSimulationMode) {
      this.lastUpdateEl.textContent = 'Real-time (Simulation)';
    }

    // Threat level
    if (this.threatLevelFillEl) {
      const level = dataManager.getThreatLevel();
      this.threatLevelFillEl.style.width = `${level}%`;

      let desc = '';
      let color = '';
      if (level < 25) {
        desc = 'Low threat activity. Routine monitoring in effect.';
        color = '#00ff88';
      } else if (level < 50) {
        desc = 'Moderate threat activity. Elevated monitoring recommended.';
        color = '#ffd700';
      } else if (level < 75) {
        desc = 'High threat activity detected. Active defense measures advised.';
        color = '#ff8c00';
      } else {
        desc = 'CRITICAL threat level. Multiple high-severity attacks in progress.';
        color = '#ff3366';
      }

      if (this.threatLevelDescEl) {
        this.threatLevelDescEl.textContent = desc;
        this.threatLevelDescEl.style.color = color;
      }
    }

    // Update legend counts
    Object.entries(ATTACK_TYPES).forEach(([key]) => {
      const countEl = document.getElementById(`legend-count-${key}`);
      if (countEl) {
        countEl.textContent = (dataManager.stats.attacksByType[key] || 0).toLocaleString();
      }
    });

    // Top Sources with flags and percentages
    if (this.topSourcesEl) {
      const topSources = dataManager.getTopN(dataManager.stats.topSources, 6);
      const maxCount = topSources.length > 0 ? topSources[0].count : 1;
      const total = dataManager.stats.totalAttacks || 1;
      this.topSourcesEl.innerHTML = topSources.map((item, i) => `
        <div class="stat-row">
          <span class="stat-rank">${i + 1}.</span>
          <div class="stat-bar-wrapper">
            <span class="stat-name">${item.name}</span>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill red" style="width: ${(item.count / maxCount * 100).toFixed(1)}%;"></div>
            </div>
          </div>
          <span class="stat-count">${item.count}</span>
          <span class="stat-pct">${((item.count / total) * 100).toFixed(1)}%</span>
        </div>
      `).join('') || '<div class="stat-empty">Collecting data...</div>';
    }

    // Top Targets with flags and percentages
    if (this.topTargetsEl) {
      const topTargets = dataManager.getTopN(dataManager.stats.topTargets, 6);
      const maxCount = topTargets.length > 0 ? topTargets[0].count : 1;
      const total = dataManager.stats.totalAttacks || 1;
      this.topTargetsEl.innerHTML = topTargets.map((item, i) => `
        <div class="stat-row">
          <span class="stat-rank">${i + 1}.</span>
          <div class="stat-bar-wrapper">
            <span class="stat-name">${item.name}</span>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" style="width: ${(item.count / maxCount * 100).toFixed(1)}%;"></div>
            </div>
          </div>
          <span class="stat-count">${item.count}</span>
          <span class="stat-pct">${((item.count / total) * 100).toFixed(1)}%</span>
        </div>
      `).join('') || '<div class="stat-empty">Collecting data...</div>';
    }

    // Attack Type Breakdown with enhanced stats
    if (this.attackTypesEl) {
      const total = dataManager.stats.totalAttacks || 1;
      this.attackTypesEl.innerHTML = Object.entries(ATTACK_TYPES).map(([key, type]) => {
        const count = dataManager.stats.attacksByType[key] || 0;
        const pct = ((count / total) * 100).toFixed(1);
        return `
          <div class="type-stat-row">
            <div class="type-stat-header">
              <span style="color: ${type.color};">${type.icon} ${type.label}</span>
              <span class="type-stat-count">${count.toLocaleString()} (${pct}%)</span>
            </div>
            <div class="type-stat-bar-bg">
              <div class="type-stat-bar" style="width: ${pct}%; background: ${type.color}; box-shadow: 0 0 6px ${type.color}40;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Active Routes
    if (this.activeRoutesEl) {
      const routes = dataManager.getTopRoutes(5);
      this.activeRoutesEl.innerHTML = routes.map(r => `
        <div class="route-item">
          <span>${r.sourceFlag} ${r.source}</span>
          <span class="route-arrow">→</span>
          <span>${r.targetFlag} ${r.target}</span>
          <span class="route-count">${r.count}</span>
        </div>
      `).join('') || '<div class="stat-empty">Collecting route data...</div>';
    }

    // High Severity Alerts
    if (this.highSeverityEl) {
      const alerts = dataManager.getHighSeverityEvents(4);
      this.highSeverityEl.innerHTML = alerts.map(e => {
        const type = ATTACK_TYPES[e.attackType] || ATTACK_TYPES.intrusion;
        const timeStr = e.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `
          <div class="alert-item">
            <div class="alert-header">
              <span class="alert-type">${type.icon} ${type.label} — ${e.severity.toUpperCase()}</span>
              <span class="alert-time">${timeStr}</span>
            </div>
            <div class="alert-route">
              ${e.source.countryFlag || '🌐'} ${e.source.city} → ${e.target.countryFlag || '🌐'} ${e.target.city}
            </div>
            <div class="alert-details">${this.escapeHtml(e.details)}</div>
          </div>
        `;
      }).join('') || '<div class="stat-empty">No high severity alerts yet</div>';
    }

    // Data source & status
    if (this.dataSourceEl) {
      this.dataSourceEl.textContent = dataManager.dataSource;
    }

    if (this.dataSourceShortEl) {
      if (dataManager.isSimulationMode) {
        this.dataSourceShortEl.textContent = '⚠ Simulation — Based on published reports';
        this.dataSourceShortEl.style.color = '#ffd700';
      } else if (dataManager.isLiveMode) {
        this.dataSourceShortEl.textContent = '● Live: ' + dataManager.dataSource;
        this.dataSourceShortEl.style.color = '#00ff88';
      } else {
        this.dataSourceShortEl.textContent = 'Connecting...';
        this.dataSourceShortEl.style.color = '';
      }
    }

    if (this.dataStatusEl) {
      if (dataManager.isSimulationMode) {
        this.dataStatusEl.className = 'data-status demo';
        this.dataStatusEl.innerHTML = '<span class="status-dot"></span><span class="status-text">SIMULATION</span>';
      } else if (dataManager.isLiveMode) {
        this.dataStatusEl.className = 'data-status live';
        this.dataStatusEl.innerHTML = '<span class="status-dot"></span><span class="status-text">LIVE DATA</span>';
      } else {
        this.dataStatusEl.className = 'data-status connecting';
        this.dataStatusEl.innerHTML = '<span class="status-dot"></span><span class="status-text">CONNECTING...</span>';
      }
    }

    if (this.accuracyNoticeEl) {
      this.accuracyNoticeEl.style.display = dataManager.isSimulationMode ? 'flex' : 'none';
    }

    // Update disclaimer text based on mode
    if (this.dataDisclaimerEl) {
      if (dataManager.isLiveMode) {
        this.dataDisclaimerEl.textContent = 'Data sourced from verified threat intelligence providers (abuse.ch). C2 server locations are real; target distributions are based on published threat reports.';
      } else if (dataManager.isSimulationMode) {
        this.dataDisclaimerEl.textContent = 'SIMULATION MODE: All data patterns are based on published threat intelligence reports from Check Point, Kaspersky, ENISA, and Fortinet. No real attack data is displayed. IPs shown are from RFC 5737 documentation ranges (192.0.2.x, 198.51.100.x, 203.0.113.x).';
      }
    }
  }

  /**
   * Animate a counter from one value to another
   */
  animateCounter(element, from, to, duration) {
    const startTime = performance.now();
    const diff = to - from;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      const currentValue = Math.round(from + diff * easedProgress);
      element.textContent = currentValue.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    this.sidebarOpen = !this.sidebarOpen;
    sidebar.classList.toggle('collapsed', !this.sidebarOpen);

    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.innerHTML = this.sidebarOpen ? '◀' : '▶';
    }
  }

  /**
   * Show a notification banner
   */
  showNotification(message, type = 'info') {
    const banner = document.getElementById('notification-banner');
    if (!banner) return;

    banner.textContent = message;
    banner.className = `notification-banner ${type}`;

    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });

    setTimeout(() => {
      banner.classList.remove('visible');
    }, 8000);
  }

  /**
   * Escape HTML helper
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
