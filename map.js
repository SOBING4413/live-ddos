/**
 * map.js - Three.js 3D Realistic Earth Globe for Cyber Attack Map
 * 
 * Uses NASA Earth texture for accurate continent rendering,
 * with country labels, attack arc animations, and polished visuals.
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

// Create a curved arc between two points on the globe
function createArcCurve(start, end, radius, arcHeight) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const dist = start.distanceTo(end);
  mid.normalize().multiplyScalar(radius + dist * arcHeight);
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

/**
 * Country labels - curated ~40 major countries, well-positioned
 */
const COUNTRY_LABELS = [
  { name: 'United States', lat: 39.0, lng: -98.0, size: 1.0 },
  { name: 'Canada', lat: 58.0, lng: -100.0, size: 0.9 },
  { name: 'Mexico', lat: 24.0, lng: -102.0, size: 0.7 },
  { name: 'Brazil', lat: -10.0, lng: -52.0, size: 1.0 },
  { name: 'Argentina', lat: -35.0, lng: -64.0, size: 0.7 },
  { name: 'Colombia', lat: 4.0, lng: -72.0, size: 0.5 },
  { name: 'Peru', lat: -10.0, lng: -76.0, size: 0.5 },
  { name: 'Chile', lat: -33.0, lng: -71.0, size: 0.45 },
  { name: 'Greenland', lat: 72.0, lng: -40.0, size: 0.55 },
  { name: 'Russia', lat: 62.0, lng: 95.0, size: 1.0 },
  { name: 'Germany', lat: 51.0, lng: 10.0, size: 0.5 },
  { name: 'France', lat: 46.5, lng: 2.5, size: 0.5 },
  { name: 'UK', lat: 54.0, lng: -2.0, size: 0.45 },
  { name: 'Spain', lat: 40.0, lng: -3.5, size: 0.45 },
  { name: 'Italy', lat: 42.5, lng: 12.5, size: 0.4 },
  { name: 'Poland', lat: 52.0, lng: 19.5, size: 0.4 },
  { name: 'Ukraine', lat: 49.0, lng: 32.0, size: 0.45 },
  { name: 'Sweden', lat: 62.0, lng: 16.0, size: 0.4 },
  { name: 'Norway', lat: 64.0, lng: 10.0, size: 0.35 },
  { name: 'Iceland', lat: 65.0, lng: -19.0, size: 0.3 },
  { name: 'Egypt', lat: 27.0, lng: 30.0, size: 0.55 },
  { name: 'Nigeria', lat: 9.5, lng: 8.0, size: 0.5 },
  { name: 'South Africa', lat: -29.0, lng: 25.0, size: 0.55 },
  { name: 'Algeria', lat: 28.0, lng: 2.0, size: 0.55 },
  { name: 'DR Congo', lat: -3.0, lng: 23.0, size: 0.5 },
  { name: 'Kenya', lat: 0.5, lng: 38.0, size: 0.4 },
  { name: 'China', lat: 35.0, lng: 103.0, size: 1.0 },
  { name: 'India', lat: 22.0, lng: 79.0, size: 0.9 },
  { name: 'Japan', lat: 36.5, lng: 138.5, size: 0.55 },
  { name: 'South Korea', lat: 36.0, lng: 128.0, size: 0.35 },
  { name: 'Indonesia', lat: -2.0, lng: 118.0, size: 0.65 },
  { name: 'Turkey', lat: 39.5, lng: 35.0, size: 0.5 },
  { name: 'Saudi Arabia', lat: 24.0, lng: 44.0, size: 0.6 },
  { name: 'Iran', lat: 33.0, lng: 53.0, size: 0.55 },
  { name: 'Pakistan', lat: 30.0, lng: 69.0, size: 0.5 },
  { name: 'Thailand', lat: 15.0, lng: 101.0, size: 0.4 },
  { name: 'Vietnam', lat: 16.0, lng: 108.0, size: 0.35 },
  { name: 'Philippines', lat: 12.0, lng: 122.0, size: 0.35 },
  { name: 'Kazakhstan', lat: 48.0, lng: 67.0, size: 0.6 },
  { name: 'Mongolia', lat: 47.0, lng: 104.0, size: 0.5 },
  { name: 'Australia', lat: -25.0, lng: 134.0, size: 0.9 },
  { name: 'New Zealand', lat: -42.0, lng: 173.0, size: 0.35 },
];

/**
 * Create a text sprite for country labels
 */
function createTextSprite(text, fontSize, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const scale = 2;
  const fSize = fontSize * scale;

  ctx.font = `600 ${fSize}px 'Inter', 'Segoe UI', Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width + 12 * scale;
  const textHeight = fSize * 1.5;

  canvas.width = textWidth;
  canvas.height = textHeight;

  // Background pill
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  const r = 4 * scale;
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

  // Subtle border
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.font = `600 ${fSize}px 'Inter', 'Segoe UI', Arial, sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = color || 'rgba(255, 255, 255, 0.9)';
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
  const spriteScale = fontSize * 0.13;
  sprite.scale.set(spriteScale * aspect, spriteScale, 1);

  return sprite;
}

/**
 * Load texture with fallback - tries NASA texture URL, falls back to procedural
 */
function loadEarthTexture() {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    // Use a reliable NASA Blue Marble texture
    const urls = [
      'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
      'https://unpkg.com/three-globe@2.24.1/example/img/earth-blue-marble.jpg',
      'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
    ];

    let attempted = 0;

    function tryLoad() {
      if (attempted >= urls.length) {
        // Fallback: generate procedural texture
        resolve(generateFallbackTexture());
        return;
      }
      loader.load(
        urls[attempted],
        (texture) => {
          texture.anisotropy = 4;
          resolve(texture);
        },
        undefined,
        () => {
          attempted++;
          tryLoad();
        }
      );
    }

    tryLoad();
  });
}

function loadBumpTexture() {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    const urls = [
      'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
      'https://unpkg.com/three-globe@2.24.1/example/img/earth-topology.png',
    ];
    let attempted = 0;
    function tryLoad() {
      if (attempted >= urls.length) {
        resolve(null);
        return;
      }
      loader.load(urls[attempted], (tex) => resolve(tex), undefined, () => { attempted++; tryLoad(); });
    }
    tryLoad();
  });
}

function loadWaterTexture() {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    const urls = [
      'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png',
      'https://unpkg.com/three-globe@2.24.1/example/img/earth-water.png',
    ];
    let attempted = 0;
    function tryLoad() {
      if (attempted >= urls.length) {
        resolve(null);
        return;
      }
      loader.load(urls[attempted], (tex) => resolve(tex), undefined, () => { attempted++; tryLoad(); });
    }
    tryLoad();
  });
}

function loadCloudTexture() {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    const urls = [
      'https://unpkg.com/three-globe@2.31.1/example/img/earth-clouds.png',
      'https://unpkg.com/three-globe@2.24.1/example/img/earth-clouds.png',
    ];
    let attempted = 0;
    function tryLoad() {
      if (attempted >= urls.length) {
        resolve(generateProceduralClouds());
        return;
      }
      loader.load(urls[attempted], (tex) => resolve(tex), undefined, () => { attempted++; tryLoad(); });
    }
    tryLoad();
  });
}

/**
 * Fallback procedural Earth texture if CDN textures fail
 */
function generateFallbackTexture() {
  const w = 2048, h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Ocean gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0b1a3a');
  grad.addColorStop(0.2, '#0a2555');
  grad.addColorStop(0.5, '#0e3570');
  grad.addColorStop(0.8, '#0a2555');
  grad.addColorStop(1, '#0b1a3a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  function lngToX(lng) { return ((lng + 180) / 360) * w; }
  function latToY(lat) { return ((90 - lat) / 180) * h; }

  function drawShape(coords, color) {
    ctx.beginPath();
    ctx.moveTo(lngToX(coords[0][1]), latToY(coords[0][0]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(lngToX(coords[i][1]), latToY(coords[i][0]));
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Simplified but cleaner continent shapes using [lat, lng] pairs
  // North America
  drawShape([
    [70,-140],[68,-130],[62,-110],[55,-80],[48,-65],[45,-67],[42,-70],[40,-74],
    [38,-76],[35,-78],[33,-85],[30,-88],[28,-82],[25,-80],[25,-97],[26,-100],
    [28,-108],[30,-112],[33,-118],[35,-120],[38,-122],[42,-124],[45,-124],
    [48,-124],[49,-125],[50,-128],[55,-132],[60,-140],[65,-145],[68,-155],[70,-160]
  ], '#1e6b35');

  // South America
  drawShape([
    [12,-72],[10,-68],[8,-63],[5,-58],[2,-51],[0,-50],[-5,-45],[-10,-38],
    [-15,-39],[-20,-41],[-25,-43],[-30,-50],[-35,-57],[-40,-62],[-45,-66],
    [-50,-72],[-55,-70],[-55,-68],[-50,-65],[-45,-62],[-40,-58],[-35,-52],
    [-30,-48],[-25,-45],[-20,-42],[-15,-40],[-10,-38],[-5,-35],[0,-50],
    [5,-55],[8,-60],[10,-65]
  ], '#1a6b35');

  // Africa
  drawShape([
    [37,-10],[35,-5],[32,0],[28,5],[22,10],[15,15],[10,12],[5,10],[0,10],
    [-5,12],[-10,15],[-15,20],[-20,28],[-25,32],[-30,30],[-35,26],[-35,18],
    [-30,16],[-25,15],[-20,20],[-15,30],[-10,38],[-5,42],[0,45],[5,48],
    [10,50],[15,50],[20,45],[25,40],[28,35],[30,33],[32,28],[35,20]
  ], '#c4a35a');

  // Europe
  drawShape([
    [72,20],[70,28],[68,30],[65,28],[62,25],[60,18],[58,14],[56,10],
    [54,10],[52,5],[50,-5],[48,-5],[46,-2],[44,0],[42,-2],[40,-5],
    [37,-8],[36,-6],[37,0],[40,3],[42,5],[44,7],[46,8],[48,8],
    [50,6],[52,8],[54,14],[56,16],[58,20],[60,24],[62,26],[65,28],
    [68,26],[70,24]
  ], '#2d7a3e');

  // Asia (Russia + Central/East Asia)
  drawShape([
    [72,30],[70,40],[68,50],[65,60],[62,70],[58,80],[55,90],[52,100],
    [50,110],[48,120],[45,130],[42,132],[40,130],[38,128],[36,127],
    [34,110],[32,105],[30,100],[28,95],[26,90],[24,82],[22,78],
    [20,75],[18,74],[15,73],[12,72],[10,78],[8,77],[8,73],[12,70],
    [18,68],[22,62],[26,55],[30,48],[34,36],[38,28],[42,28],
    [46,30],[50,32],[55,35],[60,38],[65,40],[70,35]
  ], '#6b8c6b');

  // India
  drawShape([
    [35,72],[32,74],[28,76],[24,78],[20,80],[16,80],[12,80],[8,78],
    [8,73],[12,72],[16,73],[20,74],[24,72],[28,70],[32,70]
  ], '#8a9a3a');

  // Australia
  drawShape([
    [-11,131],[-13,136],[-15,140],[-18,145],[-22,148],[-25,152],
    [-28,153],[-32,152],[-35,150],[-38,146],[-38,142],[-35,138],
    [-32,130],[-28,122],[-25,118],[-22,115],[-18,116],[-15,120],
    [-13,126]
  ], '#b09060');

  // Japan
  drawShape([[45,142],[42,143],[40,140],[38,138],[36,137],[34,134],[33,132],[34,133],[36,135],[38,137],[40,139],[42,141]], '#2d7a3e');

  // Indonesia islands (simplified)
  drawShape([[6,95],[2,100],[-2,104],[-6,108],[-8,110],[-6,112],[-2,110],[2,106],[6,100]], '#1a6b35');
  drawShape([[7,109],[4,112],[0,116],[-3,118],[-4,116],[-2,112],[2,108],[5,108]], '#1a6b35');

  // Greenland
  drawShape([[84,-38],[82,-28],[78,-18],[74,-20],[70,-25],[66,-40],[62,-48],[60,-52],[62,-54],[66,-54],[70,-52],[74,-48],[78,-44],[82,-40]], '#d0e4f0');

  // Antarctica
  drawShape([[-65,-180],[-70,-140],[-78,-100],[-85,-60],[-90,0],[-85,60],[-78,100],[-70,140],[-65,180]], '#d8e8f0');

  // New Zealand
  drawShape([[-35,173],[-38,176],[-41,175],[-41,173],[-38,174]], '#2d7a3e');
  drawShape([[-41,173],[-44,170],[-47,168],[-47,170],[-44,172]], '#2d7a3e');

  // Madagascar
  drawShape([[-12,49],[-16,50],[-20,48],[-25,46],[-25,44],[-20,44],[-16,46],[-12,48]], '#1a6b35');

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function generateProceduralClouds() {
  const w = 1024, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < 250; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const lat = 90 - (y / h) * 180;
    let chance = 0.25;
    if (Math.abs(lat) < 15) chance = 0.45;
    if (Math.abs(lat) > 40 && Math.abs(lat) < 60) chance = 0.55;
    if (Math.random() < chance) {
      const size = 8 + Math.random() * 45;
      const opacity = 0.03 + Math.random() * 0.08;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
      gradient.addColorStop(0.6, `rgba(255,255,255,${opacity * 0.3})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * MapManager - handles 3D globe rendering
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
    this.autoRotateSpeed = 0.0006;
    this.autoRotate = true;
    this.zoomLevel = 280;
    this.targetZoom = 280;
    this.minZoom = 160;
    this.maxZoom = 500;
    this.globeGroup = null;
    this.atmosphereMesh = null;
    this.starField = null;
    this.cloudMesh = null;
    this.labelSprites = [];
    this.texturesLoaded = false;
  }

  async init() {
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
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Globe group
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    // Create star field first (no async)
    this.createStarField();

    // Load textures and build globe
    await this.createGlobe();

    // Atmosphere (no texture needed)
    this.createAtmosphere();

    // Labels
    this.createCountryLabels();

    // Grid
    this.createGlobeGrid();

    // Lighting
    const ambient = new THREE.AmbientLight(0x334466, 0.5);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.3);
    sun.position.set(5, 3, 5);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4466aa, 0.25);
    fill.position.set(-5, -1, -5);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0x88ccff, 0.15);
    rim.position.set(0, 5, -3);
    this.scene.add(rim);

    this.setupEventListeners();
    this.animate();

    return this;
  }

  createStarField() {
    const geo = new THREE.BufferGeometry();
    const count = 3500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 1800;
      positions[i3 + 1] = (Math.random() - 0.5) * 1800;
      positions[i3 + 2] = (Math.random() - 0.5) * 1800;

      const c = Math.random();
      if (c < 0.6) {
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 1.0;
      } else if (c < 0.8) {
        colors[i3] = 0.7 + Math.random() * 0.2;
        colors[i3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i3 + 2] = 1.0;
      } else {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 0.7 + Math.random() * 0.2;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.7,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      vertexColors: true,
    });

    this.starField = new THREE.Points(geo, mat);
    this.scene.add(this.starField);
  }

  async createGlobe() {
    // Load all textures in parallel
    const [earthTex, bumpTex, waterTex, cloudTex] = await Promise.all([
      loadEarthTexture(),
      loadBumpTexture(),
      loadWaterTexture(),
      loadCloudTexture(),
    ]);

    // Earth sphere
    const globeGeo = new THREE.SphereGeometry(this.globeRadius, 128, 128);
    const matConfig = {
      map: earthTex,
      shininess: 15,
      specular: new THREE.Color(0x333333),
    };

    if (bumpTex) {
      matConfig.bumpMap = bumpTex;
      matConfig.bumpScale = 1.5;
    }
    if (waterTex) {
      matConfig.specularMap = waterTex;
    }

    const globeMat = new THREE.MeshPhongMaterial(matConfig);
    this.globe = new THREE.Mesh(globeGeo, globeMat);
    this.globeGroup.add(this.globe);

    // Cloud layer
    if (cloudTex) {
      const cloudGeo = new THREE.SphereGeometry(this.globeRadius + 1.0, 64, 64);
      const cloudMat = new THREE.MeshPhongMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      this.globeGroup.add(this.cloudMesh);
    }

    this.texturesLoaded = true;
  }

  createAtmosphere() {
    // Inner glow
    const innerGeo = new THREE.SphereGeometry(this.globeRadius + 2.5, 64, 64);
    const innerMat = new THREE.ShaderMaterial({
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
          float intensity = pow(0.65 - dot(vNormal, viewDir), 2.5);
          vec3 color = mix(vec3(0.3, 0.6, 1.0), vec3(0.1, 0.8, 0.6), intensity * 0.3);
          gl_FragColor = vec4(color, intensity * 0.4);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    this.atmosphereMesh = new THREE.Mesh(innerGeo, innerMat);
    this.globeGroup.add(this.atmosphereMesh);

    // Outer glow
    const outerGeo = new THREE.SphereGeometry(this.globeRadius + 8, 64, 64);
    const outerMat = new THREE.ShaderMaterial({
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
          float intensity = pow(0.4 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.2, 0.5, 1.0, 1.0) * intensity * 0.1;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    this.globeGroup.add(new THREE.Mesh(outerGeo, outerMat));
  }

  createGlobeGrid() {
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.03,
    });

    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        pts.push(latLngToVector3(lat, lng - 180, this.globeRadius + 0.2));
      }
      this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    for (let lng = -180; lng < 180; lng += 30) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        pts.push(latLngToVector3(lat, lng, this.globeRadius + 0.2));
      }
      this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
  }

  createCountryLabels() {
    COUNTRY_LABELS.forEach(country => {
      const fontSize = 5 + country.size * 5;
      const sprite = createTextSprite(country.name, fontSize, 'rgba(255, 255, 255, 0.88)');
      const pos = latLngToVector3(country.lat, country.lng, this.globeRadius + 2.0);
      sprite.position.copy(pos);
      sprite.userData = { lat: country.lat, lng: country.lng, baseRadius: this.globeRadius + 2.0 };
      this.globeGroup.add(sprite);
      this.labelSprites.push(sprite);
    });
  }

  setupEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.previousMouse.x;
      const dy = e.clientY - this.previousMouse.y;
      this.targetRotation.y += dx * 0.005;
      this.targetRotation.x += dy * 0.005;
      this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
    });

    const stopDrag = () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
      clearTimeout(this._autoRotateTimeout);
      this._autoRotateTimeout = setTimeout(() => { this.autoRotate = true; }, 5000);
    };

    canvas.addEventListener('mouseup', stopDrag);
    canvas.addEventListener('mouseleave', () => { if (this.isDragging) stopDrag(); });
    canvas.style.cursor = 'grab';

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetZoom += e.deltaY * 0.3;
      this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
    }, { passive: false });

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
        const dx = e.touches[0].clientX - this.previousMouse.x;
        const dy = e.touches[0].clientY - this.previousMouse.y;
        this.targetRotation.y += dx * 0.005;
        this.targetRotation.x += dy * 0.005;
        this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
        this.previousMouse.x = e.touches[0].clientX;
        this.previousMouse.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        this.targetZoom += (touchStartDist - dist) * 0.5;
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
        touchStartDist = dist;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
      clearTimeout(this._autoRotateTimeout);
      this._autoRotateTimeout = setTimeout(() => { this.autoRotate = true; }, 5000);
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

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

    const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const arcMat = new THREE.LineBasicMaterial({ color: colorObj, transparent: true, opacity: 0 });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    this.globeGroup.add(arcLine);

    const headSize = event.severity === 'critical' ? 1.2 : 0.8;
    const headGeo = new THREE.SphereGeometry(headSize, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.copy(sourcePos);
    this.globeGroup.add(headMesh);

    const glowSize = event.severity === 'critical' ? 3 : 2;
    const glowGeo = new THREE.SphereGeometry(glowSize, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: colorObj, transparent: true, opacity: 0.4 });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.copy(sourcePos);
    this.globeGroup.add(glowMesh);

    const arc = {
      line: arcLine, head: headMesh, glow: glowMesh,
      curve, curvePoints, totalPoints, color: colorObj,
      createdAt: performance.now(),
      travelDuration: 2000 + Math.random() * 1500,
      fadeDuration: 1500,
      severity: event.severity,
      sourcePos: sourcePos.clone(),
      targetPos: targetPos.clone(),
    };

    this.attackArcs.push(arc);

    this.addPulseMarker(sourcePos, colorObj, 'source', event.severity);
    setTimeout(() => {
      this.addPulseMarker(targetPos, colorObj, 'target', event.severity);
    }, arc.travelDuration * 0.8);

    while (this.attackArcs.length > this.maxArcs) {
      this.removeArc(this.attackArcs.shift());
    }
  }

  addPulseMarker(position, color, type, severity) {
    const size = type === 'source' ? 1.5 : (severity === 'critical' ? 3 : 2);

    const dotGeo = new THREE.SphereGeometry(size * 0.4, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(position);
    this.globeGroup.add(dot);

    const ringGeo = new THREE.RingGeometry(size * 0.5, size * 0.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    this.globeGroup.add(ring);

    this.pulseMarkers.push({
      dot, ring,
      createdAt: performance.now(),
      duration: 3000,
      maxScale: 4,
    });
  }

  removeArc(arc) {
    ['line', 'head', 'glow'].forEach(key => {
      if (arc[key]) {
        this.globeGroup.remove(arc[key]);
        arc[key].geometry.dispose();
        arc[key].material.dispose();
      }
    });
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    const now = performance.now();

    if (this.autoRotate) {
      this.targetRotation.y += this.autoRotateSpeed;
    }

    this.rotation.x += (this.targetRotation.x - this.rotation.x) * 0.08;
    this.rotation.y += (this.targetRotation.y - this.rotation.y) * 0.08;

    this.globeGroup.rotation.x = this.rotation.x;
    this.globeGroup.rotation.y = this.rotation.y;

    if (this.cloudMesh) {
      this.cloudMesh.rotation.y += 0.00008;
    }

    this.zoomLevel += (this.targetZoom - this.zoomLevel) * 0.08;
    this.camera.position.z = this.zoomLevel;

    this.updateLabelVisibility();

    // Update arcs
    this.attackArcs = this.attackArcs.filter(arc => {
      const age = now - arc.createdAt;
      const total = arc.travelDuration + arc.fadeDuration;
      if (age > total) { this.removeArc(arc); return false; }

      const travelProgress = Math.min(age / arc.travelDuration, 1);
      const eased = travelProgress === 1 ? 1 : 1 - Math.pow(2, -10 * travelProgress);

      if (arc.line) {
        let opacity = 0.8;
        if (age > arc.travelDuration) {
          opacity = 0.8 * (1 - (age - arc.travelDuration) / arc.fadeDuration);
        }
        arc.line.material.opacity = Math.max(0, opacity);
      }

      if (arc.head && arc.glow) {
        if (travelProgress < 1) {
          const pt = arc.curve.getPoint(eased);
          arc.head.position.copy(pt);
          arc.glow.position.copy(pt);
          arc.head.material.opacity = 1;
          arc.glow.material.opacity = 0.4;
        } else {
          const fadeP = (age - arc.travelDuration) / arc.fadeDuration;
          arc.head.material.opacity = Math.max(0, 1 - fadeP);
          arc.glow.material.opacity = Math.max(0, 0.4 * (1 - fadeP));
          arc.glow.scale.setScalar(1 + fadeP * 3);
        }
      }
      return true;
    });

    // Update pulse markers
    this.pulseMarkers = this.pulseMarkers.filter(m => {
      const age = now - m.createdAt;
      if (age > m.duration) {
        this.globeGroup.remove(m.dot);
        this.globeGroup.remove(m.ring);
        m.dot.geometry.dispose(); m.dot.material.dispose();
        m.ring.geometry.dispose(); m.ring.material.dispose();
        return false;
      }
      const p = age / m.duration;
      m.dot.material.opacity = Math.max(0, 1 - p);
      m.ring.scale.setScalar(1 + p * m.maxScale);
      m.ring.material.opacity = Math.max(0, 0.7 * (1 - p));
      return true;
    });

    if (this.starField) {
      this.starField.rotation.y += 0.00002;
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateLabelVisibility() {
    if (!this.labelSprites.length) return;
    const camPos = this.camera.position.clone();

    this.labelSprites.forEach(sprite => {
      const worldPos = new THREE.Vector3();
      sprite.getWorldPosition(worldPos);
      const toCamera = camPos.clone().sub(worldPos).normalize();
      const surfaceNormal = worldPos.clone().normalize();
      const dot = toCamera.dot(surfaceNormal);

      if (dot > 0.15) {
        sprite.material.opacity = Math.min(1, (dot - 0.15) * 2.5);
        sprite.visible = true;
      } else {
        sprite.visible = false;
      }
    });
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.renderer) this.renderer.dispose();
    clearTimeout(this._autoRotateTimeout);
  }
}
