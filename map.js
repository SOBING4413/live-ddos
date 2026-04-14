/**
 * map.js - Three.js 3D Realistic Earth Globe for Cyber Attack Map
 * 
 * Renders a photorealistic 3D Earth globe using NASA Blue Marble textures
 * loaded from CDN, with bump mapping for terrain, specular highlights on oceans,
 * cloud layer, country labels, attack arc animations, pulse markers, and smooth controls.
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
 * Country label data - major countries with their lat/lng positions
 */
const COUNTRY_LABELS = [
  { name: 'United States', lat: 39.8, lng: -98.5, size: 1 },
  { name: 'Canada', lat: 56.1, lng: -106.3, size: 0.8 },
  { name: 'Brazil', lat: -14.2, lng: -51.9, size: 1 },
  { name: 'Argentina', lat: -38.4, lng: -63.6, size: 0.7 },
  { name: 'Mexico', lat: 23.6, lng: -102.5, size: 0.7 },
  { name: 'Russia', lat: 61.5, lng: 105.3, size: 1 },
  { name: 'China', lat: 35.8, lng: 104.1, size: 1 },
  { name: 'India', lat: 20.6, lng: 78.9, size: 0.9 },
  { name: 'Japan', lat: 36.2, lng: 138.2, size: 0.7 },
  { name: 'Australia', lat: -25.3, lng: 133.8, size: 0.9 },
  { name: 'Germany', lat: 51.2, lng: 10.4, size: 0.6 },
  { name: 'France', lat: 46.2, lng: 2.2, size: 0.6 },
  { name: 'UK', lat: 55.4, lng: -3.4, size: 0.6 },
  { name: 'Italy', lat: 41.9, lng: 12.6, size: 0.5 },
  { name: 'Spain', lat: 40.5, lng: -3.7, size: 0.6 },
  { name: 'South Korea', lat: 35.9, lng: 127.8, size: 0.5 },
  { name: 'Indonesia', lat: -0.8, lng: 113.9, size: 0.8 },
  { name: 'Turkey', lat: 39.0, lng: 35.2, size: 0.6 },
  { name: 'Saudi Arabia', lat: 23.9, lng: 45.1, size: 0.7 },
  { name: 'South Africa', lat: -30.6, lng: 22.9, size: 0.7 },
  { name: 'Nigeria', lat: 9.1, lng: 8.7, size: 0.6 },
  { name: 'Egypt', lat: 26.8, lng: 30.8, size: 0.6 },
  { name: 'Iran', lat: 32.4, lng: 53.7, size: 0.6 },
  { name: 'Pakistan', lat: 30.4, lng: 69.3, size: 0.6 },
  { name: 'Thailand', lat: 15.9, lng: 100.9, size: 0.5 },
  { name: 'Vietnam', lat: 14.1, lng: 108.3, size: 0.5 },
  { name: 'Philippines', lat: 12.9, lng: 121.8, size: 0.5 },
  { name: 'Colombia', lat: 4.6, lng: -74.3, size: 0.6 },
  { name: 'Peru', lat: -9.2, lng: -75.0, size: 0.6 },
  { name: 'Chile', lat: -35.7, lng: -71.5, size: 0.5 },
  { name: 'Ukraine', lat: 48.4, lng: 31.2, size: 0.5 },
  { name: 'Poland', lat: 51.9, lng: 19.1, size: 0.5 },
  { name: 'Sweden', lat: 60.1, lng: 18.6, size: 0.5 },
  { name: 'Norway', lat: 60.5, lng: 8.5, size: 0.5 },
  { name: 'Finland', lat: 61.9, lng: 25.7, size: 0.5 },
  { name: 'Netherlands', lat: 52.1, lng: 5.3, size: 0.4 },
  { name: 'Singapore', lat: 1.4, lng: 103.8, size: 0.4 },
  { name: 'New Zealand', lat: -40.9, lng: 174.9, size: 0.5 },
  { name: 'Kenya', lat: -0.02, lng: 37.9, size: 0.5 },
  { name: 'Morocco', lat: 31.8, lng: -7.1, size: 0.5 },
  { name: 'Algeria', lat: 28.0, lng: 1.7, size: 0.6 },
  { name: 'Libya', lat: 26.3, lng: 17.2, size: 0.5 },
  { name: 'DR Congo', lat: -4.0, lng: 21.8, size: 0.6 },
  { name: 'Mongolia', lat: 46.9, lng: 103.8, size: 0.6 },
  { name: 'Kazakhstan', lat: 48.0, lng: 68.0, size: 0.7 },
  { name: 'Greenland', lat: 71.7, lng: -42.6, size: 0.6 },
  { name: 'Iceland', lat: 64.9, lng: -19.0, size: 0.4 },
  { name: 'Madagascar', lat: -18.8, lng: 46.9, size: 0.5 },
  { name: 'Cuba', lat: 21.5, lng: -77.8, size: 0.4 },
  { name: 'Bangladesh', lat: 23.7, lng: 90.4, size: 0.5 },
  { name: 'Myanmar', lat: 21.9, lng: 96.0, size: 0.5 },
  { name: 'Malaysia', lat: 4.2, lng: 101.9, size: 0.5 },
  { name: 'Taiwan', lat: 23.7, lng: 121.0, size: 0.4 },
  { name: 'Israel', lat: 31.0, lng: 34.9, size: 0.4 },
  { name: 'Romania', lat: 45.9, lng: 24.9, size: 0.5 },
  { name: 'Greece', lat: 39.1, lng: 21.8, size: 0.4 },
  { name: 'Portugal', lat: 39.4, lng: -8.2, size: 0.4 },
  { name: 'Ireland', lat: 53.1, lng: -7.7, size: 0.4 },
  { name: 'Switzerland', lat: 46.8, lng: 8.2, size: 0.4 },
  { name: 'Austria', lat: 47.5, lng: 14.6, size: 0.4 },
  { name: 'Czech Republic', lat: 49.8, lng: 15.5, size: 0.4 },
];

/**
 * Create a text sprite for country labels
 */
function createTextSprite(text, fontSize, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const scale = 2; // retina
  const fSize = fontSize * scale;
  
  ctx.font = `bold ${fSize}px 'Inter', 'Segoe UI', Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width + 8 * scale;
  const textHeight = fSize * 1.4;
  
  canvas.width = textWidth;
  canvas.height = textHeight;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  const r = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(textWidth - r, 0);
  ctx.quadraticCurveTo(textWidth, 0, textWidth, r);
  ctx.lineTo(textWidth, textHeight - r);
  ctx.quadraticCurveTo(textWidth, textHeight, textWidth - r, textHeight);
  ctx.lineTo(r, textHeight);
  ctx.quadraticCurveTo(0, textHeight, 0, textHeight - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  
  // Text
  ctx.font = `bold ${fSize}px 'Inter', 'Segoe UI', Arial, sans-serif`;
  ctx.fillStyle = color || 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, textWidth / 2, textHeight / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  
  const sprite = new THREE.Sprite(material);
  const aspect = textWidth / textHeight;
  const spriteScale = fontSize * 0.15;
  sprite.scale.set(spriteScale * aspect, spriteScale, 1);
  
  return sprite;
}

/**
 * NASA Blue Marble texture URLs from reliable CDN sources
 */
const TEXTURE_URLS = {
  // Earth day map - NASA Blue Marble (high quality)
  earth: 'https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg',
  // Bump/topology map
  bump: 'https://unpkg.com/three-globe@2.41.12/example/img/earth-topology.png',
  // Water/specular map (shows where oceans are for specular reflection)
  water: 'https://unpkg.com/three-globe@2.41.12/example/img/earth-water.png',
  // Cloud layer
  clouds: 'https://unpkg.com/three-globe@2.41.12/example/img/earth-clouds.png',
  // Night lights (optional, for dark side)
  night: 'https://unpkg.com/three-globe@2.41.12/example/img/earth-night.jpg',
};

/**
 * Load a texture from URL with fallback
 * Returns a promise that resolves to the texture
 */
function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      url,
      (texture) => {
        texture.anisotropy = 4;
        resolve(texture);
      },
      undefined,
      (err) => {
        console.warn('Failed to load texture:', url, err);
        reject(err);
      }
    );
  });
}

/**
 * Generate a simple fallback cloud texture using canvas (used if CDN fails)
 */
function generateFallbackCloudTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);
  
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const lat = 90 - (y / height) * 180;
    
    let cloudChance = 0.3;
    if (Math.abs(lat) < 15) cloudChance = 0.5;
    if (Math.abs(lat) > 40 && Math.abs(lat) < 60) cloudChance = 0.6;
    if (Math.abs(lat) > 70) cloudChance = 0.4;
    
    if (Math.random() < cloudChance) {
      const size = 10 + Math.random() * 60;
      const opacity = 0.05 + Math.random() * 0.15;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
  }
  
  return new THREE.CanvasTexture(canvas);
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
    this.cloudMesh = null;
    this.labelSprites = [];
  }

  /**
   * Initialize the Three.js scene with realistic 3D globe
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return this;

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020510);

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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // Globe group for rotation
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    // Create elements
    this.createStarField();
    this.createRealisticGlobe();
    this.createAtmosphere();
    this.createCountryLabels();

    // Lighting - simulate sunlight
    const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
    this.scene.add(ambientLight);

    // Main sunlight
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);

    // Fill light (opposite side - dimmer, blueish)
    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.3);
    fillLight.position.set(-5, -1, -5);
    this.scene.add(fillLight);

    // Rim light for atmosphere edge
    const rimLight = new THREE.DirectionalLight(0x88ccff, 0.2);
    rimLight.position.set(0, 5, -3);
    this.scene.add(rimLight);

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
    const starCount = 4000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 1800;
      positions[i3 + 1] = (Math.random() - 0.5) * 1800;
      positions[i3 + 2] = (Math.random() - 0.5) * 1800;
      
      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 1.0;
      } else if (colorChoice < 0.8) {
        colors[i3] = 0.7 + Math.random() * 0.2;
        colors[i3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i3 + 2] = 1.0;
      } else {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 0.7 + Math.random() * 0.2;
      }
      
      sizes[i] = Math.random() * 1.8 + 0.2;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.8,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      vertexColors: true,
    });

    this.starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.starField);
  }

  /**
   * Create the realistic Earth globe using NASA Blue Marble textures from CDN
   */
  createRealisticGlobe() {
    const globeGeometry = new THREE.SphereGeometry(this.globeRadius, 128, 128);

    // Start with a basic dark blue material as placeholder while textures load
    const placeholderMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a2a5e,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });

    this.globe = new THREE.Mesh(globeGeometry, placeholderMaterial);
    this.globeGroup.add(this.globe);

    // Load NASA Blue Marble textures asynchronously
    this.loadNASATextures();

    // Add subtle grid overlay for the cyber aesthetic
    this.createGlobeGrid();
  }

  /**
   * Load NASA Blue Marble textures from CDN and apply them to the globe
   */
  async loadNASATextures() {
    try {
      // Load all textures in parallel
      const [earthTexture, bumpTexture, waterTexture] = await Promise.all([
        loadTexture(TEXTURE_URLS.earth),
        loadTexture(TEXTURE_URLS.bump).catch(() => null),
        loadTexture(TEXTURE_URLS.water).catch(() => null),
      ]);

      // Create the high-quality material with NASA textures
      const globeMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture || undefined,
        bumpScale: 1.5,
        specularMap: waterTexture || undefined,
        specular: new THREE.Color(0x333333),
        shininess: 15,
      });

      // Replace the placeholder material
      if (this.globe) {
        this.globe.material.dispose();
        this.globe.material = globeMaterial;
      }

      console.log('NASA Blue Marble textures loaded successfully');

      // Now load cloud layer
      this.loadCloudLayer();
    } catch (err) {
      console.warn('Failed to load NASA textures, globe will use placeholder color:', err);
    }
  }

  /**
   * Load and create cloud layer from CDN texture
   */
  async loadCloudLayer() {
    let cloudTexture;
    try {
      cloudTexture = await loadTexture(TEXTURE_URLS.clouds);
    } catch {
      // Fallback to procedural clouds
      cloudTexture = generateFallbackCloudTexture(1024, 512);
    }

    const cloudGeometry = new THREE.SphereGeometry(this.globeRadius + 1.2, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.globeGroup.add(this.cloudMesh);
  }

  /**
   * Create atmosphere glow effect
   */
  createAtmosphere() {
    // Inner atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(this.globeRadius + 3, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(0.7 - dot(vNormal, viewDir), 2.5);
          // Blue atmosphere with slight green tint
          vec3 atmosphereColor = mix(
            vec3(0.3, 0.6, 1.0),
            vec3(0.1, 0.8, 0.6),
            intensity * 0.3
          );
          gl_FragColor = vec4(atmosphereColor, intensity * 0.5);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.globeGroup.add(this.atmosphereMesh);

    // Outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(this.globeRadius + 10, 64, 64);
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
          float intensity = pow(0.45 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.2, 0.5, 1.0, 1.0) * intensity * 0.12;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    this.globeGroup.add(outerGlow);
  }

  /**
   * Create subtle latitude/longitude grid lines
   */
  createGlobeGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.04,
    });

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        const pos = latLngToVector3(lat, lng - 180, this.globeRadius + 0.3);
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
        const pos = latLngToVector3(lat, lng, this.globeRadius + 0.3);
        points.push(pos);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      this.globeGroup.add(line);
    }
  }

  /**
   * Create country name labels on the globe
   */
  createCountryLabels() {
    COUNTRY_LABELS.forEach(country => {
      const fontSize = 6 + country.size * 4;
      const sprite = createTextSprite(country.name, fontSize, 'rgba(255, 255, 255, 0.75)');
      const pos = latLngToVector3(country.lat, country.lng, this.globeRadius + 2.5);
      sprite.position.copy(pos);
      sprite.userData = { lat: country.lat, lng: country.lng, baseRadius: this.globeRadius + 2.5 };
      this.globeGroup.add(sprite);
      this.labelSprites.push(sprite);
    });
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

    // Slowly rotate clouds independently
    if (this.cloudMesh) {
      this.cloudMesh.rotation.y += 0.0001;
    }

    // Smooth zoom
    this.zoomLevel += (this.targetZoom - this.zoomLevel) * 0.08;
    this.camera.position.z = this.zoomLevel;

    // Update label visibility based on zoom and facing direction
    this.updateLabelVisibility();

    // Update attack arcs
    this.attackArcs = this.attackArcs.filter(arc => {
      const age = now - arc.createdAt;
      const totalDuration = arc.travelDuration + arc.fadeDuration;

      if (age > totalDuration) {
        this.removeArc(arc);
        return false;
      }

      const travelProgress = Math.min(age / arc.travelDuration, 1);
      const easedProgress = travelProgress === 1 ? 1 : 1 - Math.pow(2, -10 * travelProgress);

      // Update arc line visibility (trail effect)
      if (arc.line) {
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
          const fadeAge = age - arc.travelDuration;
          const fadeProgress = fadeAge / arc.fadeDuration;
          arc.head.material.opacity = Math.max(0, 1 - fadeProgress);
          arc.glow.material.opacity = Math.max(0, 0.4 * (1 - fadeProgress));
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
      marker.dot.material.opacity = Math.max(0, 1 - progress);
      const ringScale = 1 + progress * marker.maxScale;
      marker.ring.scale.setScalar(ringScale);
      marker.ring.material.opacity = Math.max(0, 0.7 * (1 - progress));

      return true;
    });

    // Subtle star rotation
    if (this.starField) {
      this.starField.rotation.y += 0.00003;
      this.starField.rotation.x += 0.00001;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update label visibility - hide labels on the far side of the globe
   */
  updateLabelVisibility() {
    if (!this.labelSprites.length) return;
    
    const cameraPos = this.camera.position.clone();
    
    this.labelSprites.forEach(sprite => {
      // Get world position of the sprite
      const worldPos = new THREE.Vector3();
      sprite.getWorldPosition(worldPos);
      
      // Check if the label is facing the camera
      const toCamera = cameraPos.clone().sub(worldPos).normalize();
      const surfaceNormal = worldPos.clone().normalize();
      const dot = toCamera.dot(surfaceNormal);
      
      // Fade based on angle to camera
      if (dot > 0.1) {
        sprite.material.opacity = Math.min(1, (dot - 0.1) * 2);
        sprite.visible = true;
      } else {
        sprite.visible = false;
      }
      
      // Scale labels based on zoom
      const zoomFactor = 280 / this.zoomLevel;
      const baseScale = sprite.scale.clone();
      // Don't actually modify scale each frame, just visibility
    });
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
