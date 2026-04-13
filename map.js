/**
 * map.js - Leaflet map setup and attack arc rendering
 * 
 * Handles the interactive world map, attack flow animations,
 * and marker management with smooth animations.
 */

import { ATTACK_TYPES } from './data.js';

/**
 * MapManager handles all map-related operations
 */
export class MapManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.attackArcs = [];
    this.maxArcs = 120;
    this.markers = [];
    this.canvasOverlay = null;
    this.animationFrame = null;
    this.lastFrameTime = 0;
  }

  /**
   * Initialize the Leaflet map with dark theme
   */
  init() {
    this.map = L.map(this.containerId, {
      center: [20, 0],
      zoom: 2.5,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
      maxBounds: [[-85, -Infinity], [85, Infinity]],
      maxBoundsViscosity: 0.8,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    // Dark CartoDB tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Add attribution
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('© <a href="https://carto.com/">CARTO</a> | © <a href="https://www.openstreetmap.org/">OSM</a>')
      .addTo(this.map);

    // Initialize canvas overlay for attack arcs
    this.initCanvasOverlay();

    return this;
  }

  /**
   * Initialize a canvas overlay for drawing attack arcs
   */
  initCanvasOverlay() {
    const CanvasOverlay = L.Layer.extend({
      onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'attack-canvas-overlay');
        const size = map.getSize();
        this._canvas.width = size.x * (window.devicePixelRatio || 1);
        this._canvas.height = size.y * (window.devicePixelRatio || 1);
        this._canvas.style.width = size.x + 'px';
        this._canvas.style.height = size.y + 'px';
        this._canvas.style.position = 'absolute';
        this._canvas.style.top = '0';
        this._canvas.style.left = '0';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.zIndex = '400';

        map.getPanes().overlayPane.appendChild(this._canvas);

        map.on('move zoom viewreset resize', this._reset, this);
        this._reset();
      },

      onRemove: function (map) {
        L.DomUtil.remove(this._canvas);
        map.off('move zoom viewreset resize', this._reset, this);
      },

      _reset: function () {
        const topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        const size = this._map.getSize();
        const dpr = window.devicePixelRatio || 1;
        this._canvas.width = size.x * dpr;
        this._canvas.height = size.y * dpr;
        this._canvas.style.width = size.x + 'px';
        this._canvas.style.height = size.y + 'px';
        const ctx = this._canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      },

      getCanvas: function () {
        return this._canvas;
      },
    });

    this.canvasOverlay = new CanvasOverlay();
    this.canvasOverlay.addTo(this.map);

    // Start animation loop
    this.startAnimationLoop();
  }

  /**
   * Add an attack event to the map
   */
  addAttackEvent(event) {
    const color = ATTACK_TYPES[event.attackType]?.color || '#00ff88';

    const arc = {
      id: event.id,
      source: { lat: event.source.lat, lng: event.source.lng },
      target: { lat: event.target.lat, lng: event.target.lng },
      color: color,
      createdAt: performance.now(),
      travelDuration: 2200 + Math.random() * 1800,
      fadeDuration: 2000,
      attackType: event.attackType,
      severity: event.severity,
    };

    this.attackArcs.push(arc);

    while (this.attackArcs.length > this.maxArcs) {
      this.attackArcs.shift();
    }

    // Add pulse markers at source and target
    this.addPulseMarker(event.source.lat, event.source.lng, color, 'source', event.severity);

    setTimeout(() => {
      this.addPulseMarker(event.target.lat, event.target.lng, color, 'target', event.severity);
    }, arc.travelDuration * 0.8);
  }

  /**
   * Add a pulsing marker at a location
   */
  addPulseMarker(lat, lng, color, type, severity) {
    const size = type === 'source' ? 6 : (severity === 'critical' ? 12 : 8);
    const pulseSize = type === 'source' ? 24 : (severity === 'critical' ? 40 : 32);

    const icon = L.divIcon({
      className: 'pulse-marker',
      html: `
        <div style="
          width: ${size}px; height: ${size}px;
          background: ${color};
          border-radius: 50%;
          box-shadow: 0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}50;
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          transition: opacity 1s ease-out;
        "></div>
        <div style="
          width: ${pulseSize}px; height: ${pulseSize}px;
          border: 1.5px solid ${color};
          border-radius: 50%;
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-expand 2.5s ease-out forwards;
          opacity: 0.7;
        "></div>
        <div style="
          width: ${pulseSize * 1.5}px; height: ${pulseSize * 1.5}px;
          border: 1px solid ${color};
          border-radius: 50%;
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-expand 2.5s ease-out 0.3s forwards;
          opacity: 0.4;
        "></div>
      `,
      iconSize: [pulseSize * 1.5, pulseSize * 1.5],
      iconAnchor: [pulseSize * 0.75, pulseSize * 0.75],
    });

    const marker = L.marker([lat, lng], { icon, interactive: false }).addTo(this.map);

    setTimeout(() => {
      if (this.map.hasLayer(marker)) {
        this.map.removeLayer(marker);
      }
    }, 4000);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  startAnimationLoop() {
    const animate = (timestamp) => {
      this.drawArcs(timestamp);
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  drawArcs(timestamp) {
    if (!this.canvasOverlay) return;

    const canvas = this.canvasOverlay.getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const size = this.map.getSize();
    ctx.clearRect(0, 0, size.x, size.y);

    const now = performance.now();

    this.attackArcs = this.attackArcs.filter(arc => {
      const age = now - arc.createdAt;
      return age < arc.travelDuration + arc.fadeDuration;
    });

    this.attackArcs.forEach(arc => {
      const age = now - arc.createdAt;
      const travelProgress = Math.min(age / arc.travelDuration, 1);
      const easedProgress = this.easeOutExpo(travelProgress);

      let opacity = 1;
      if (age > arc.travelDuration) {
        const fadeAge = age - arc.travelDuration;
        opacity = 1 - this.easeInOutCubic(fadeAge / arc.fadeDuration);
      }

      if (opacity <= 0) return;

      const srcPoint = this.map.latLngToContainerPoint([arc.source.lat, arc.source.lng]);
      const tgtPoint = this.map.latLngToContainerPoint([arc.target.lat, arc.target.lng]);

      this.drawSmoothArc(ctx, srcPoint, tgtPoint, arc.color, easedProgress, opacity, arc.severity);
    });
  }

  drawSmoothArc(ctx, src, tgt, color, progress, opacity, severity) {
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) return;

    const midX = (src.x + tgt.x) / 2;
    const midY = (src.y + tgt.y) / 2;
    const curvature = Math.min(dist * 0.35, 180);
    const angle = Math.atan2(dy, dx);
    const cpX = midX - Math.sin(angle) * curvature;
    const cpY = midY + Math.cos(angle) * curvature;

    ctx.save();

    const lineWidth = severity === 'critical' ? 2.5 : (severity === 'high' ? 2 : 1.5);

    const totalSteps = 60;
    const currentStep = Math.floor(progress * totalSteps);

    if (currentStep > 1) {
      const trailLength = Math.min(currentStep, 25);
      const startStep = Math.max(0, currentStep - trailLength);

      for (let i = startStep; i < currentStep; i++) {
        const t1 = i / totalSteps;
        const t2 = (i + 1) / totalSteps;

        const x1 = (1 - t1) * (1 - t1) * src.x + 2 * (1 - t1) * t1 * cpX + t1 * t1 * tgt.x;
        const y1 = (1 - t1) * (1 - t1) * src.y + 2 * (1 - t1) * t1 * cpY + t1 * t1 * tgt.y;
        const x2 = (1 - t2) * (1 - t2) * src.x + 2 * (1 - t2) * t2 * cpX + t2 * t2 * tgt.x;
        const y2 = (1 - t2) * (1 - t2) * src.y + 2 * (1 - t2) * t2 * cpY + t2 * t2 * tgt.y;

        const segmentOpacity = ((i - startStep) / trailLength) * opacity * 0.7;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = segmentOpacity;
        ctx.lineWidth = lineWidth + ((i - startStep) / trailLength) * 0.8;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.stroke();
      }
    }

    // Moving head
    if (progress < 1) {
      const t = progress;
      const headX = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * cpX + t * t * tgt.x;
      const headY = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * cpY + t * t * tgt.y;

      // Outer glow
      ctx.globalAlpha = opacity * 0.3;
      ctx.beginPath();
      ctx.arc(headX, headY, severity === 'critical' ? 12 : 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.fill();

      // Inner bright dot
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(headX, headY, severity === 'critical' ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fill();
    }

    // Impact burst
    if (progress >= 1 && opacity > 0.3) {
      const burstT = 1 - opacity;
      const burstRadius = 4 + burstT * 24;
      ctx.globalAlpha = opacity * 0.4 * (1 - burstT);
      ctx.beginPath();
      ctx.arc(tgt.x, tgt.y, burstRadius, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * (1 - burstT);
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.stroke();
    }

    ctx.restore();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.map) {
      this.map.remove();
    }
  }
}
