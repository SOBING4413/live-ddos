/**
 * map.js - Three.js 3D Globe for Cyber Attack Map
 * 
 * Renders an interactive 3D Earth globe with attack arc animations,
 * pulse markers, and smooth rotation/zoom controls.
 * Inspired by Kaspersky Cybermap style.
 */

import { ATTACK_TYPES } from './data.js';

// Convert lat/lng to 3D sphere position
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Create a curved line between two points on the globe
function createArcCurve(start, end, radius, arcHeight) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const dist = start.distanceTo(end);
  mid.normalize().multiplyScalar(radius + dist * arcHeight);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve;
}

/**
 * MapManager handles the 3D globe rendering
 */
export class MapManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globe = null;
    this.globeRadius = 100;
    this.attackArcs = [];
    this.maxArcs = 80;
    this.pulseMarkers = [];
    this.animationFrame = null;
    this.isDragging = false;
    this.previousMouse = { x: 0, y: 0 };
    this.rotation = { x: 0.3, y: -0.5 };
    this.targetRotation = { x: 0.3, y: -0.5 };
    this.autoRotateSpeed = 0.0008;
    this.autoRotate = true;
    this.zoomLevel = 280;
    this.targetZoom = 280;
    this.minZoom = 160;
    this.maxZoom = 500;
    this.globeGroup = null;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.atmosphereMesh = null;
    this.starField = null;
    this.countryLines = null;
  }

  /**
   * Initialize the Three.js scene with 3D globe
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return this;

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060a13);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
    this.camera.position.z = this.zoomLevel;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Globe group for rotation
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    // Create elements
    this.createStarField();
    this.createGlobe();
    this.createAtmosphere();
    this.createGlobeGrid();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x334466, 1.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x88aaff, 0.8);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00ff88, 0.5, 500);
    pointLight.position.set(-100, 50, 100);
    this.scene.add(pointLight);

    // Event listeners
    this.setupEventListeners();

    // Start animation
    this.animate();

    return this;
  }

  /**
   * Create star field background
   */
  createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 1500;
      positions[i3 + 1] = (Math.random() - 0.5) * 1500;
      positions[i3 + 2] = (Math.random() - 0.5) * 1500;
      sizes[i] = Math.random() * 1.5 + 0.3;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.8,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.starField);
  }

  /**
   * Create the main globe sphere
   */
  createGlobe() {
    // Dark globe base
    const globeGeometry = new THREE.SphereGeometry(this.globeRadius, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a1628,
      transparent: true,
      opacity: 0.95,
      shininess: 25,
      specular: 0x112244,
    });
    this.globe = new THREE.Mesh(globeGeometry, globeMaterial);
    this.globeGroup.add(this.globe);

    // Country outlines using a GeoJSON-like wireframe approach
    this.createCountryDots();
  }

  /**
   * Create country dots on the globe surface using known landmass coordinates
   */
  createCountryDots() {
    const dotGeometry = new THREE.BufferGeometry();
    const dots = [];

    // Generate dots for major landmasses using simplified coordinate ranges
    const landmasses = [
      // North America
      { latRange: [25, 70], lngRange: [-170, -50], density: 0.8 },
      // South America
      { latRange: [-55, 12], lngRange: [-82, -34], density: 0.7 },
      // Europe
      { latRange: [35, 72], lngRange: [-10, 40], density: 1.2 },
      // Africa
      { latRange: [-35, 37], lngRange: [-18, 52], density: 0.6 },
      // Asia
      { latRange: [5, 75], lngRange: [40, 180], density: 0.7 },
      // Australia
      { latRange: [-45, -10], lngRange: [110, 155], density: 0.5 },
      // Japan/Korea
      { latRange: [30, 46], lngRange: [126, 146], density: 1.5 },
      // UK/Ireland
      { latRange: [50, 60], lngRange: [-11, 2], density: 1.5 },
      // Indonesia/Philippines
      { latRange: [-8, 20], lngRange: [95, 140], density: 0.6 },
      // Middle East
      { latRange: [12, 42], lngRange: [25, 65], density: 0.5 },
    ];

    landmasses.forEach(land => {
      const latStep = 1.8 / land.density;
      const lngStep = 1.8 / land.density;
      for (let lat = land.latRange[0]; lat <= land.latRange[1]; lat += latStep) {
        for (let lng = land.lngRange[0]; lng <= land.lngRange[1]; lng += lngStep) {
          // Add some randomness to avoid perfect grid
          const jitterLat = lat + (Math.random() - 0.5) * latStep * 0.5;
          const jitterLng = lng + (Math.random() - 0.5) * lngStep * 0.5;
          // Simple land check - skip some ocean areas
          if (this.isLikelyLand(jitterLat, jitterLng)) {
            const pos = latLngToVector3(jitterLat, jitterLng, this.globeRadius + 0.3);
            dots.push(pos.x, pos.y, pos.z);
          }
        }
      }
    });

    const positions = new Float32Array(dots);
    dotGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const dotMaterial = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 0.8,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });

    const dotMesh = new THREE.Points(dotGeometry, dotMaterial);
    this.globeGroup.add(dotMesh);
  }

  /**
   * Simple heuristic to check if a coordinate is likely on land
   */
  isLikelyLand(lat, lng) {
    // Ocean exclusion zones (rough approximations)
    // Pacific Ocean center
    if (lng > -170 && lng < -100 && lat > -50 && lat < 50) {
      if (lng > -160 && lng < -110 && lat > -30 && lat < 30) return false;
    }
    // Atlantic Ocean center
    if (lng > -60 && lng < -10 && lat > -10 && lat < 35) return false;
    // Indian Ocean
    if (lng > 50 && lng < 95 && lat > -40 && lat < 0) return false;
    // Southern Ocean
    if (lat < -60) return false;
    // Arctic Ocean
    if (lat > 75 && (lng < -30 || lng > 50)) return false;
    
    // Add some randomness for natural look
    return Math.random() > 0.15;
  }

  /**
   * Create atmosphere glow effect
   */
  createAtmosphere() {
    // Inner glow
    const atmosphereGeometry = new THREE.SphereGeometry(this.globeRadius + 2, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.0, 1.0, 0.53, 1.0) * intensity * 0.4;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.globeGroup.add(this.atmosphereMesh);

    // Outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(this.globeRadius + 8, 64, 64);
    const outerGlowMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.0, 0.6, 1.0, 1.0) * intensity * 0.15;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    this.globeGroup.add(outerGlow);
  }

  /**
   * Create latitude/longitude grid lines on the globe
   */
  createGlobeGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.06,
    });

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        const pos = latLngToVector3(lat, lng - 180, this.globeRadius + 0.2);
        points.push(pos);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      this.globeGroup.add(line);
    }

    // Longitude lines
    for (let lng = -180; lng < 180; lng += 30) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const pos = latLngToVector3(lat, lng, this.globeRadius + 0.2);
        points.push(pos);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      this.globeGroup.add(line);
    }
  }

  /**
   * Setup mouse/touch event listeners for interaction
   */
  setupEventListeners() {
    const canvas = this.renderer.domElement;

    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMouse.x;
      const deltaY = e.clientY - this.previousMouse.y;
      this.targetRotation.y += deltaX * 0.005;
      this.targetRotation.x += deltaY * 0.005;
      this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
      // Resume auto-rotate after 5 seconds of inactivity
      clearTimeout(this._autoRotateTimeout);
      this._autoRotateTimeout = setTimeout(() => {
        this.autoRotate = true;
      }, 5000);
    });

    canvas.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        canvas.style.cursor = 'grab';
        clearTimeout(this._autoRotateTimeout);
        this._autoRotateTimeout = setTimeout(() => {
          this.autoRotate = true;
        }, 5000);
      }
    });

    canvas.style.cursor = 'grab';

    // Wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetZoom += e.deltaY * 0.3;
      this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
    }, { passive: false });

    // Touch events
    let touchStartDist = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.previousMouse.x = e.touches[0].clientX;
        this.previousMouse.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.isDragging) {
        const deltaX = e.touches[0].clientX - this.previousMouse.x;
        const deltaY = e.touches[0].clientY - this.previousMouse.y;
        this.targetRotation.y += deltaX * 0.005;
        this.targetRotation.x += deltaY * 0.005;
        this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
        this.previousMouse.x = e.touches[0].clientX;
        this.previousMouse.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = touchStartDist - dist;
        this.targetZoom += delta * 0.5;
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
        touchStartDist = dist;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
      clearTimeout(this._autoRotateTimeout);
      this._autoRotateTimeout = setTimeout(() => {
        this.autoRotate = true;
      }, 5000);
    }, { passive: true });

    // Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  /**
   * Add an attack event to the globe
   */
  addAttackEvent(event) {
    const color = ATTACK_TYPES[event.attackType]?.color || '#00ff88';
    const colorObj = new THREE.Color(color);

    const sourcePos = latLngToVector3(event.source.lat, event.source.lng, this.globeRadius + 0.5);
    const targetPos = latLngToVector3(event.target.lat, event.target.lng, this.globeRadius + 0.5);

    const dist = sourcePos.distanceTo(targetPos);
    const arcHeight = 0.3 + Math.min(dist / 200, 0.5);
    const curve = createArcCurve(sourcePos, targetPos, this.globeRadius, arcHeight);

    const totalPoints = 80;
    const curvePoints = curve.getPoints(totalPoints);

    // Create arc line geometry
    const arcGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const arcMaterial = new THREE.LineBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0,
      linewidth: 1,
    });
    const arcLine = new THREE.Line(arcGeometry, arcMaterial);
    this.globeGroup.add(arcLine);

    // Create moving head particle
    const headGeometry = new THREE.SphereGeometry(event.severity === 'critical' ? 1.2 : 0.8, 8, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
    });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.copy(sourcePos);
    this.globeGroup.add(headMesh);

    // Create glow around head
    const glowGeometry = new THREE.SphereGeometry(event.severity === 'critical' ? 3 : 2, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.4,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(sourcePos);
    this.globeGroup.add(glowMesh);

    const arc = {
      line: arcLine,
      head: headMesh,
      glow: glowMesh,
      curve: curve,
      curvePoints: curvePoints,
      totalPoints: totalPoints,
      color: colorObj,
      createdAt: performance.now(),
      travelDuration: 2000 + Math.random() * 1500,
      fadeDuration: 1500,
      severity: event.severity,
      sourcePos: sourcePos.clone(),
      targetPos: targetPos.clone(),
    };

    this.attackArcs.push(arc);

    // Add pulse markers
    this.addPulseMarker(sourcePos, colorObj, 'source', event.severity);
    setTimeout(() => {
      this.addPulseMarker(targetPos, colorObj, 'target', event.severity);
    }, arc.travelDuration * 0.8);

    // Limit arcs
    while (this.attackArcs.length > this.maxArcs) {
      const old = this.attackArcs.shift();
      this.removeArc(old);
    }
  }

  /**
   * Add a pulsing marker at a position on the globe
   */
  addPulseMarker(position, color, type, severity) {
    const size = type === 'source' ? 1.5 : (severity === 'critical' ? 3 : 2);

    // Inner dot
    const dotGeometry = new THREE.SphereGeometry(size * 0.4, 8, 8);
    const dotMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
    });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.copy(position);
    this.globeGroup.add(dot);

    // Expanding ring
    const ringGeometry = new THREE.RingGeometry(size * 0.5, size * 0.7, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    this.globeGroup.add(ring);

    const marker = {
      dot: dot,
      ring: ring,
      createdAt: performance.now(),
      duration: 3000,
      maxScale: 4,
    };

    this.pulseMarkers.push(marker);
  }

  /**
   * Remove an arc's Three.js objects from the scene
   */
  removeArc(arc) {
    if (arc.line) {
      this.globeGroup.remove(arc.line);
      arc.line.geometry.dispose();
      arc.line.material.dispose();
    }
    if (arc.head) {
      this.globeGroup.remove(arc.head);
      arc.head.geometry.dispose();
      arc.head.material.dispose();
    }
    if (arc.glow) {
      this.globeGroup.remove(arc.glow);
      arc.glow.geometry.dispose();
      arc.glow.material.dispose();
    }
  }

  /**
   * Main animation loop
   */
  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());

    const now = performance.now();

    // Auto-rotate
    if (this.autoRotate) {
      this.targetRotation.y += this.autoRotateSpeed;
    }

    // Smooth rotation interpolation
    this.rotation.x += (this.targetRotation.x - this.rotation.x) * 0.08;
    this.rotation.y += (this.targetRotation.y - this.rotation.y) * 0.08;

    // Apply rotation to globe group
    this.globeGroup.rotation.x = this.rotation.x;
    this.globeGroup.rotation.y = this.rotation.y;

    // Smooth zoom
    this.zoomLevel += (this.targetZoom - this.zoomLevel) * 0.08;
    this.camera.position.z = this.zoomLevel;

    // Update attack arcs
    this.attackArcs = this.attackArcs.filter(arc => {
      const age = now - arc.createdAt;
      const totalDuration = arc.travelDuration + arc.fadeDuration;

      if (age > totalDuration) {
        this.removeArc(arc);
        return false;
      }

      const travelProgress = Math.min(age / arc.travelDuration, 1);
      // easeOutExpo
      const easedProgress = travelProgress === 1 ? 1 : 1 - Math.pow(2, -10 * travelProgress);

      // Update arc line visibility (trail effect)
      if (arc.line) {
        const positions = arc.line.geometry.attributes.position;
        const visibleCount = Math.floor(easedProgress * arc.totalPoints);

        // Show trail behind the head
        const trailLength = Math.min(visibleCount, 20);
        const startIdx = Math.max(0, visibleCount - trailLength);

        let opacity = 0.8;
        if (age > arc.travelDuration) {
          const fadeAge = age - arc.travelDuration;
          opacity = 0.8 * (1 - fadeAge / arc.fadeDuration);
        }
        arc.line.material.opacity = Math.max(0, opacity);
      }

      // Update head position
      if (arc.head && arc.glow) {
        if (travelProgress < 1) {
          const point = arc.curve.getPoint(easedProgress);
          arc.head.position.copy(point);
          arc.glow.position.copy(point);
          arc.head.material.opacity = 1;
          arc.glow.material.opacity = 0.4;
        } else {
          // Fade out head after arrival
          const fadeAge = age - arc.travelDuration;
          const fadeProgress = fadeAge / arc.fadeDuration;
          arc.head.material.opacity = Math.max(0, 1 - fadeProgress);
          arc.glow.material.opacity = Math.max(0, 0.4 * (1 - fadeProgress));
          // Impact burst effect
          const burstScale = 1 + fadeProgress * 3;
          arc.glow.scale.setScalar(burstScale);
        }
      }

      return true;
    });

    // Update pulse markers
    this.pulseMarkers = this.pulseMarkers.filter(marker => {
      const age = now - marker.createdAt;
      if (age > marker.duration) {
        this.globeGroup.remove(marker.dot);
        this.globeGroup.remove(marker.ring);
        marker.dot.geometry.dispose();
        marker.dot.material.dispose();
        marker.ring.geometry.dispose();
        marker.ring.material.dispose();
        return false;
      }

      const progress = age / marker.duration;
      // Fade out dot
      marker.dot.material.opacity = Math.max(0, 1 - progress);
      // Expand and fade ring
      const ringScale = 1 + progress * marker.maxScale;
      marker.ring.scale.setScalar(ringScale);
      marker.ring.material.opacity = Math.max(0, 0.7 * (1 - progress));

      return true;
    });

    // Subtle star rotation
    if (this.starField) {
      this.starField.rotation.y += 0.00005;
      this.starField.rotation.x += 0.00002;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    clearTimeout(this._autoRotateTimeout);
  }
}
