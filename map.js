/**
 * map.js - Three.js 3D Realistic Earth Globe for Cyber Attack Map
 * 
 * Renders a photorealistic 3D Earth globe using NASA Blue Marble textures,
 * with bump mapping for terrain, specular highlights on oceans, cloud layer,
 * country labels, attack arc animations, pulse markers, and smooth controls.
 */

import { ATTACK_TYPES } from './data.js';

const EARTH_TEXTURE_CDN = {
  // NASA Blue Marble (public domain) via CDN mirror.
  color: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  bump: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
  specular: 'https://unpkg.com/three-globe/example/img/earth-water.png',
  clouds: 'https://unpkg.com/three-globe/example/img/earth-clouds.png',
};

function loadTexture(url, renderer, { isColorMap = false } = {}) {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        if (renderer?.capabilities?.getMaxAnisotropy) {
          texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        }
        if (isColorMap) {
          if ('colorSpace' in texture && THREE.SRGBColorSpace) {
            texture.colorSpace = THREE.SRGBColorSpace;
          } else if ('encoding' in texture && THREE.sRGBEncoding) {
            texture.encoding = THREE.sRGBEncoding;
          }
        }
        resolve(texture);
      },
      undefined,
      (error) => reject(error),
    );
  });
}

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
 * Generate Earth texture using canvas (procedural realistic Earth)
 * Creates a detailed color map with realistic ocean, land, and ice colors
 */
function generateEarthTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Base ocean color - deep blue
  ctx.fillStyle = '#0a2a5e';
  ctx.fillRect(0, 0, width, height);
  
  // Detailed landmass data - polygons approximating real continents
  // Format: array of {points: [{x, y}], color, ...}
  // x = 0..1 maps to lng -180..180, y = 0..1 maps to lat 90..-90
  
  function lngToX(lng) { return ((lng + 180) / 360) * width; }
  function latToY(lat) { return ((90 - lat) / 180) * height; }
  
  function drawLandRegion(lats, lngs, baseColor, highlightColor) {
    if (lats.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(lngToX(lngs[0]), latToY(lats[0]));
    for (let i = 1; i < lats.length; i++) {
      ctx.lineTo(lngToX(lngs[i]), latToY(lats[i]));
    }
    ctx.closePath();
    
    // Create gradient for terrain variation
    const gradient = ctx.createLinearGradient(
      lngToX(Math.min(...lngs)), latToY(Math.max(...lats)),
      lngToX(Math.max(...lngs)), latToY(Math.min(...lats))
    );
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.5, highlightColor || baseColor);
    gradient.addColorStop(1, baseColor);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  // Color palette for different biomes
  const colors = {
    forest: '#1a5c2a',
    forestLight: '#2d7a3e',
    tropical: '#1e6b35',
    tropicalLight: '#2a8040',
    desert: '#c4a35a',
    desertLight: '#d4b76a',
    tundra: '#6b8c6b',
    tundraLight: '#8aaa8a',
    ice: '#d8e8f0',
    iceLight: '#e8f4fa',
    savanna: '#8a9a3a',
    savannaLight: '#a0b050',
    steppe: '#9aaa6a',
    steppeLight: '#b0c080',
    mountain: '#6a6a5a',
    mountainLight: '#8a8a7a',
    arid: '#b09060',
    aridLight: '#c0a070',
  };
  
  // ===== NORTH AMERICA =====
  // Alaska
  drawLandRegion(
    [72, 71, 68, 64, 60, 55, 55, 60, 64, 68, 71, 72],
    [-168, -160, -153, -148, -140, -132, -160, -166, -168, -165, -163, -168],
    colors.tundra, colors.tundraLight
  );
  // Canada (northern)
  drawLandRegion(
    [72, 70, 68, 65, 60, 55, 50, 50, 55, 60, 65, 70, 72],
    [-140, -130, -120, -100, -80, -65, -55, -80, -95, -110, -120, -135, -140],
    colors.tundra, colors.forest
  );
  // Canada (southern) + US
  drawLandRegion(
    [50, 49, 48, 47, 45, 42, 38, 35, 30, 25, 25, 28, 30, 33, 37, 40, 42, 45, 48, 50],
    [-130, -125, -124, -124, -124, -124, -122, -120, -118, -110, -97, -97, -90, -85, -76, -74, -70, -67, -65, -55],
    colors.forest, colors.forestLight
  );
  // US mainland fill
  drawLandRegion(
    [49, 48, 47, 45, 42, 38, 35, 30, 26, 25, 28, 30, 30, 35, 40, 45, 49],
    [-125, -124, -124, -124, -124, -122, -120, -115, -110, -98, -97, -90, -82, -76, -74, -67, -67],
    colors.forest, colors.forestLight
  );
  // Florida
  drawLandRegion(
    [31, 30, 28, 25, 25, 27, 30, 31],
    [-87, -85, -82, -81, -80, -80, -82, -85],
    colors.tropical, colors.tropicalLight
  );
  // US Southwest (desert)
  drawLandRegion(
    [37, 35, 32, 30, 28, 32, 35, 37],
    [-120, -118, -115, -112, -105, -105, -108, -112],
    colors.desert, colors.desertLight
  );
  // Mexico
  drawLandRegion(
    [32, 30, 28, 24, 20, 16, 15, 18, 20, 23, 28, 32],
    [-117, -115, -112, -110, -106, -96, -92, -90, -97, -100, -105, -110],
    colors.arid, colors.desert
  );
  // Central America
  drawLandRegion(
    [18, 16, 14, 10, 8, 7, 8, 10, 14, 16, 18],
    [-92, -90, -88, -84, -80, -78, -76, -78, -83, -87, -90],
    colors.tropical, colors.tropicalLight
  );
  // Greenland
  drawLandRegion(
    [84, 83, 80, 76, 72, 68, 65, 60, 60, 64, 68, 72, 76, 80, 83, 84],
    [-40, -30, -20, -18, -20, -25, -40, -48, -55, -58, -56, -55, -50, -45, -42, -40],
    colors.ice, colors.iceLight
  );
  
  // ===== SOUTH AMERICA =====
  drawLandRegion(
    [12, 10, 8, 5, 2, 0, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -55, -55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 8, 10, 12],
    [-72, -68, -63, -58, -52, -50, -45, -40, -39, -40, -42, -48, -52, -58, -65, -70, -72, -68, -65, -62, -58, -52, -48, -45, -42, -40, -38, -35, -50, -55, -60, -65, -72],
    colors.tropical, colors.tropicalLight
  );
  // Amazon basin (darker green)
  drawLandRegion(
    [2, 0, -5, -10, -15, -12, -8, -3, 0, 2],
    [-55, -52, -48, -45, -50, -58, -62, -60, -55, -55],
    '#0d4a1a', '#1a5c2a'
  );
  // Andes (mountain)
  drawLandRegion(
    [5, 0, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5],
    [-78, -80, -80, -78, -76, -72, -70, -70, -72, -73, -74, -75, -70, -70, -68, -68, -66, -66, -68, -70, -72, -75, -76, -76],
    colors.mountain, colors.mountainLight
  );
  // Patagonia (steppe)
  drawLandRegion(
    [-40, -45, -50, -55, -55, -50, -45, -40],
    [-65, -68, -72, -72, -68, -65, -62, -62],
    colors.steppe, colors.steppeLight
  );
  
  // ===== EUROPE =====
  // Scandinavia
  drawLandRegion(
    [72, 70, 68, 65, 62, 60, 58, 56, 56, 58, 60, 62, 65, 68, 70, 72],
    [20, 28, 30, 28, 25, 20, 15, 10, 5, 5, 8, 10, 14, 16, 18, 20],
    colors.tundra, colors.forest
  );
  // Western Europe
  drawLandRegion(
    [60, 58, 55, 52, 50, 48, 46, 44, 42, 40, 37, 36, 37, 40, 42, 44, 46, 48, 50, 52, 55, 58, 60],
    [-10, -8, -6, -5, -5, -5, -2, -1, -2, -5, -8, -6, 0, 3, 5, 7, 8, 8, 6, 5, 3, 0, -5],
    colors.forest, colors.forestLight
  );
  // Central/Eastern Europe
  drawLandRegion(
    [55, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 55],
    [10, 14, 16, 18, 20, 22, 24, 26, 28, 26, 24, 20, 18, 16, 14, 12, 10, 8, 8, 8, 10],
    colors.forest, colors.forestLight
  );
  // Italy
  drawLandRegion(
    [46, 44, 42, 40, 38, 37, 38, 40, 42, 44, 46],
    [7, 8, 10, 12, 14, 16, 18, 16, 14, 12, 10],
    colors.forest, colors.savanna
  );
  // Iberian Peninsula
  drawLandRegion(
    [44, 42, 40, 38, 36, 37, 38, 40, 42, 44],
    [-10, -9, -8, -7, -6, -2, 0, 2, 3, 0],
    colors.savanna, colors.savannaLight
  );
  // UK & Ireland
  drawLandRegion(
    [58, 56, 54, 52, 50, 50, 52, 54, 56, 58],
    [-8, -6, -5, -4, -3, -6, -8, -10, -10, -8],
    colors.forest, colors.forestLight
  );
  drawLandRegion(
    [59, 57, 55, 52, 50, 50, 52, 55, 57, 59],
    [-2, 0, 1, 2, 1, -3, -4, -5, -4, -2],
    colors.forest, colors.forestLight
  );
  // Iceland
  drawLandRegion(
    [66, 65, 64, 63, 64, 65, 66],
    [-24, -20, -16, -14, -14, -18, -22],
    colors.tundra, colors.tundraLight
  );
  
  // ===== AFRICA =====
  drawLandRegion(
    [37, 35, 32, 30, 28, 25, 20, 15, 10, 5, 0, -5, -10, -15, -20, -25, -30, -35, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 28, 30, 32, 35, 37],
    [-10, -8, -5, -2, 0, 5, 10, 15, 15, 12, 10, 12, 15, 20, 25, 30, 32, 28, 18, 15, 15, 20, 30, 38, 42, 45, 48, 50, 50, 45, 40, 35, 32, 28, 20, 10],
    colors.desert, colors.savanna
  );
  // Sahara Desert
  drawLandRegion(
    [35, 32, 28, 22, 18, 15, 15, 18, 22, 28, 32, 35],
    [-12, -8, -5, 0, 5, 10, 30, 35, 38, 35, 30, 20],
    colors.desert, colors.desertLight
  );
  // Central Africa (tropical)
  drawLandRegion(
    [10, 5, 0, -5, -10, -10, -5, 0, 5, 10],
    [8, 10, 10, 12, 15, 30, 32, 35, 38, 35],
    colors.tropical, '#0d4a1a'
  );
  // East African highlands
  drawLandRegion(
    [12, 8, 4, 0, -4, -8, -12, -10, -6, -2, 2, 6, 10, 12],
    [32, 35, 38, 40, 42, 40, 38, 35, 33, 32, 32, 33, 34, 32],
    colors.savanna, colors.savannaLight
  );
  // Southern Africa
  drawLandRegion(
    [-15, -20, -25, -30, -35, -35, -30, -25, -20, -15],
    [20, 18, 16, 18, 20, 30, 33, 35, 35, 32],
    colors.savanna, colors.steppe
  );
  // Madagascar
  drawLandRegion(
    [-12, -14, -18, -22, -26, -25, -22, -18, -14, -12],
    [49, 50, 50, 48, 47, 44, 43, 44, 46, 49],
    colors.tropical, colors.tropicalLight
  );
  
  // ===== ASIA =====
  // Russia (massive)
  drawLandRegion(
    [72, 70, 68, 65, 60, 55, 50, 48, 45, 42, 42, 45, 48, 50, 55, 60, 65, 68, 70, 72],
    [30, 40, 50, 60, 70, 75, 80, 85, 90, 100, 130, 135, 140, 145, 155, 165, 175, 180, 180, 170],
    colors.tundra, colors.forest
  );
  // Russia (western)
  drawLandRegion(
    [72, 70, 65, 60, 55, 50, 45, 42, 42, 45, 50, 55, 60, 65, 70, 72],
    [28, 30, 32, 35, 38, 40, 42, 44, 50, 55, 58, 60, 62, 60, 55, 40],
    colors.forest, colors.tundra
  );
  // Middle East
  drawLandRegion(
    [38, 36, 34, 32, 30, 25, 20, 15, 12, 15, 20, 25, 30, 32, 35, 38],
    [26, 28, 30, 32, 35, 40, 45, 50, 55, 60, 58, 55, 50, 45, 40, 35],
    colors.desert, colors.desertLight
  );
  // Arabian Peninsula
  drawLandRegion(
    [30, 28, 25, 22, 18, 15, 12, 14, 18, 22, 25, 28, 30],
    [35, 38, 42, 48, 52, 55, 50, 45, 40, 38, 36, 35, 35],
    colors.desert, colors.desertLight
  );
  // India
  drawLandRegion(
    [35, 32, 28, 24, 20, 16, 12, 8, 8, 12, 16, 20, 24, 28, 32, 35],
    [70, 72, 74, 76, 78, 80, 80, 78, 72, 70, 72, 74, 76, 78, 76, 74],
    colors.tropical, colors.savanna
  );
  // Sri Lanka
  drawLandRegion(
    [10, 8, 6, 6, 8, 10],
    [80, 81, 81, 80, 79, 80],
    colors.tropical, colors.tropicalLight
  );
  // Central Asia (steppe)
  drawLandRegion(
    [50, 48, 45, 42, 38, 35, 35, 38, 42, 45, 48, 50],
    [52, 55, 58, 62, 68, 72, 80, 82, 80, 78, 72, 65],
    colors.steppe, colors.steppeLight
  );
  // Himalayas
  drawLandRegion(
    [38, 36, 34, 30, 28, 26, 28, 30, 34, 36, 38],
    [72, 76, 80, 85, 90, 95, 98, 100, 95, 88, 80],
    colors.mountain, colors.ice
  );
  // China
  drawLandRegion(
    [50, 48, 45, 42, 38, 35, 30, 25, 22, 20, 22, 25, 30, 35, 38, 42, 45, 48, 50],
    [80, 85, 90, 95, 100, 105, 110, 115, 118, 112, 108, 105, 100, 98, 100, 105, 110, 115, 120],
    colors.forest, colors.steppe
  );
  // Southeast China (green)
  drawLandRegion(
    [35, 30, 25, 22, 20, 22, 25, 30, 35],
    [105, 110, 115, 118, 112, 108, 105, 100, 100],
    colors.tropical, colors.forest
  );
  // Mongolia (steppe/desert)
  drawLandRegion(
    [52, 50, 48, 45, 42, 42, 45, 48, 50, 52],
    [88, 92, 95, 100, 105, 115, 118, 120, 115, 105],
    colors.steppe, colors.desert
  );
  // Korea
  drawLandRegion(
    [43, 40, 38, 35, 33, 34, 36, 38, 40, 43],
    [124, 125, 126, 127, 128, 130, 130, 129, 128, 126],
    colors.forest, colors.forestLight
  );
  // Japan
  drawLandRegion(
    [45, 42, 40, 38, 36, 34, 32, 30, 31, 33, 35, 37, 39, 41, 43, 45],
    [142, 143, 140, 138, 136, 134, 132, 131, 133, 135, 137, 139, 140, 141, 142, 142],
    colors.forest, colors.forestLight
  );
  // Southeast Asia mainland
  drawLandRegion(
    [24, 22, 20, 18, 15, 12, 10, 8, 5, 2, 1, 2, 5, 8, 10, 14, 18, 22, 24],
    [95, 98, 100, 102, 104, 105, 106, 105, 103, 102, 104, 106, 108, 108, 107, 106, 104, 100, 98],
    colors.tropical, colors.tropicalLight
  );
  // Indonesia (Sumatra, Java, Borneo, etc.)
  drawLandRegion(
    [6, 4, 2, 0, -2, -4, -6, -8, -8, -6, -4, -2, 0, 2, 4, 6],
    [95, 98, 100, 102, 104, 106, 108, 110, 115, 116, 115, 112, 110, 108, 105, 100],
    colors.tropical, colors.tropicalLight
  );
  // Borneo
  drawLandRegion(
    [7, 5, 2, 0, -2, -4, -3, -1, 1, 3, 5, 7],
    [108, 110, 112, 114, 116, 118, 119, 118, 117, 115, 112, 110],
    colors.tropical, '#0d4a1a'
  );
  // Philippines
  drawLandRegion(
    [20, 18, 15, 12, 8, 6, 5, 7, 10, 14, 18, 20],
    [118, 120, 122, 124, 126, 125, 122, 120, 118, 118, 118, 118],
    colors.tropical, colors.tropicalLight
  );
  // Papua New Guinea
  drawLandRegion(
    [-2, -4, -6, -8, -10, -10, -8, -6, -4, -2],
    [140, 142, 145, 148, 150, 155, 156, 152, 148, 144],
    colors.tropical, '#0d4a1a'
  );
  // Taiwan
  drawLandRegion(
    [26, 24, 22, 22, 24, 26],
    [120, 121, 121, 120, 120, 120],
    colors.forest, colors.forestLight
  );
  
  // ===== AUSTRALIA =====
  drawLandRegion(
    [-10, -12, -15, -18, -22, -25, -28, -32, -35, -38, -38, -35, -32, -28, -25, -22, -18, -15, -12, -10],
    [130, 135, 140, 145, 148, 150, 152, 153, 150, 148, 140, 135, 130, 125, 120, 118, 115, 120, 125, 130],
    colors.desert, colors.arid
  );
  // Australia coastal green
  drawLandRegion(
    [-12, -15, -18, -22, -25, -28, -30, -32, -34, -36, -38, -37, -35, -33, -30, -28, -25, -22, -18, -15, -12],
    [130, 135, 140, 145, 148, 150, 152, 153, 152, 150, 148, 146, 143, 140, 138, 135, 132, 128, 125, 128, 130],
    colors.savanna, colors.savannaLight
  );
  // Eastern Australia (green coast)
  drawLandRegion(
    [-15, -18, -22, -28, -32, -36, -38, -37, -34, -30, -25, -20, -15],
    [145, 148, 150, 152, 153, 152, 148, 146, 148, 150, 150, 148, 145],
    colors.forest, colors.forestLight
  );
  // New Zealand
  drawLandRegion(
    [-34, -36, -38, -40, -42, -44, -46, -46, -44, -42, -40, -38, -36, -34],
    [172, 174, 176, 177, 176, 172, 168, 167, 168, 170, 172, 174, 175, 174],
    colors.forest, colors.forestLight
  );
  
  // ===== OCEAN DETAILS =====
  // Add subtle ocean variation
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      // Only modify ocean pixels (dark blue)
      if (pixel[0] < 20 && pixel[1] < 60 && pixel[2] > 70) {
        const noise = (Math.sin(x * 0.05) * Math.cos(y * 0.03) + 1) * 0.5;
        const lat = 90 - (y / height) * 180;
        
        // Polar ice
        if (Math.abs(lat) > 70) {
          const iceFactor = (Math.abs(lat) - 70) / 20;
          const iceR = Math.floor(200 + noise * 40);
          const iceG = Math.floor(220 + noise * 30);
          const iceB = Math.floor(240 + noise * 15);
          ctx.fillStyle = `rgba(${iceR}, ${iceG}, ${iceB}, ${iceFactor * 0.7})`;
          ctx.fillRect(x, y, 4, 4);
        }
        
        // Shallow water near coasts - lighter blue
        const shallowNoise = Math.sin(x * 0.02 + y * 0.01) * 0.5 + 0.5;
        if (shallowNoise > 0.7) {
          ctx.fillStyle = 'rgba(15, 50, 110, 0.3)';
          ctx.fillRect(x, y, 4, 4);
        }
      }
    }
  }
  
  // Antarctic continent
  drawLandRegion(
    [-65, -70, -75, -80, -85, -90, -90, -85, -80, -75, -70, -65],
    [-180, -150, -120, -90, -60, -30, 30, 60, 90, 120, 150, 180],
    colors.ice, colors.iceLight
  );
  
  return canvas;
}

/**
 * Generate bump map texture
 */
function generateBumpTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Start with flat (black = no bump)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  function lngToX(lng) { return ((lng + 180) / 360) * width; }
  function latToY(lat) { return ((90 - lat) / 180) * height; }
  
  function drawBumpRegion(lats, lngs, intensity) {
    if (lats.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(lngToX(lngs[0]), latToY(lats[0]));
    for (let i = 1; i < lats.length; i++) {
      ctx.lineTo(lngToX(lngs[i]), latToY(lats[i]));
    }
    ctx.closePath();
    const v = Math.floor(intensity * 255);
    ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
    ctx.fill();
  }
  
  // Mountain ranges with high bump values
  // Himalayas
  drawBumpRegion(
    [38, 36, 34, 30, 28, 26, 28, 30, 34, 36, 38],
    [72, 76, 80, 85, 90, 95, 98, 100, 95, 88, 80],
    0.9
  );
  // Andes
  drawBumpRegion(
    [5, 0, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5],
    [-78, -80, -80, -78, -76, -72, -70, -70, -72, -73, -74, -75, -70, -70, -68, -68, -66, -66, -68, -70, -72, -75, -76, -76],
    0.85
  );
  // Rocky Mountains
  drawBumpRegion(
    [55, 50, 45, 40, 35, 30, 32, 35, 40, 45, 50, 55],
    [-125, -120, -115, -112, -110, -108, -105, -105, -108, -112, -118, -122],
    0.7
  );
  // Alps
  drawBumpRegion(
    [48, 47, 46, 44, 44, 46, 47, 48],
    [5, 8, 12, 16, 14, 10, 7, 5],
    0.65
  );
  // East African Rift
  drawBumpRegion(
    [12, 8, 4, 0, -4, -8, -6, -2, 2, 6, 10, 12],
    [34, 36, 38, 40, 38, 36, 34, 33, 33, 34, 35, 34],
    0.6
  );
  
  // General land areas with moderate bump
  // All continents at low bump
  const landRegions = [
    { lats: [72, 25, 25, 72], lngs: [-170, -170, -50, -50], bump: 0.2 }, // N America
    { lats: [15, -55, -55, 15], lngs: [-82, -82, -34, -34], bump: 0.25 }, // S America
    { lats: [72, 35, 35, 72], lngs: [-12, -12, 42, 42], bump: 0.2 }, // Europe
    { lats: [37, -35, -35, 37], lngs: [-18, -18, 52, 52], bump: 0.2 }, // Africa
    { lats: [75, 5, 5, 75], lngs: [25, 25, 180, 180], bump: 0.2 }, // Asia
    { lats: [-10, -45, -45, -10], lngs: [110, 110, 155, 155], bump: 0.15 }, // Australia
  ];
  
  landRegions.forEach(r => {
    drawBumpRegion(r.lats, r.lngs, r.bump);
  });
  
  return canvas;
}

/**
 * Generate specular map (bright = reflective = ocean)
 */
function generateSpecularTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Ocean is reflective (white), land is not (black)
  // Start with all ocean (white)
  ctx.fillStyle = '#4488cc';
  ctx.fillRect(0, 0, width, height);
  
  // We'll use the earth texture to mask out land
  // For simplicity, draw land areas as black (non-reflective)
  function lngToX(lng) { return ((lng + 180) / 360) * width; }
  function latToY(lat) { return ((90 - lat) / 180) * height; }
  
  function drawLandMask(lats, lngs) {
    if (lats.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(lngToX(lngs[0]), latToY(lats[0]));
    for (let i = 1; i < lats.length; i++) {
      ctx.lineTo(lngToX(lngs[i]), latToY(lats[i]));
    }
    ctx.closePath();
    ctx.fillStyle = '#000000';
    ctx.fill();
  }
  
  // Major landmasses (simplified)
  drawLandMask([72, 25, 25, 72], [-170, -170, -50, -50]); // N America
  drawLandMask([15, -55, -55, 15], [-85, -85, -30, -30]); // S America
  drawLandMask([72, 35, 35, 72], [-15, -15, 45, 45]); // Europe
  drawLandMask([37, -35, -35, 37], [-20, -20, 55, 55]); // Africa
  drawLandMask([75, 5, 5, 75], [25, 25, 180, 180]); // Asia
  drawLandMask([35, 5, 5, 35], [65, 65, 95, 95]); // India
  drawLandMask([-10, -45, -45, -10], [110, 110, 160, 160]); // Australia
  drawLandMask([84, 58, 58, 84], [-75, -75, -10, -10]); // Greenland
  drawLandMask([-60, -90, -90, -60], [-180, -180, 180, 180]); // Antarctica
  
  return canvas;
}

/**
 * Generate cloud texture
 */
function generateCloudTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);
  
  // Generate cloud-like patterns
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const lat = 90 - (y / height) * 180;
    
    // More clouds near equator and mid-latitudes
    let cloudChance = 0.3;
    if (Math.abs(lat) < 15) cloudChance = 0.5; // ITCZ
    if (Math.abs(lat) > 40 && Math.abs(lat) < 60) cloudChance = 0.6; // Storm tracks
    if (Math.abs(lat) > 70) cloudChance = 0.4; // Polar
    
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
  
  return canvas;
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
    this._pendingTimeouts = new Set();
    this._onResize = null;
    this._isDestroyed = false;
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
    this.createCloudLayer();
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
      
      // Vary star colors slightly (white to blue to warm)
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
   * Create the realistic Earth globe with NASA Blue Marble CDN textures.
   * Falls back to procedural textures only if CDN loading fails.
   */
  createRealisticGlobe() {
    const globeGeometry = new THREE.SphereGeometry(this.globeRadius, 128, 128);

    // Placeholder material to avoid visual pop while CDN assets load.
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x1d3f77,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });

    this.globe = new THREE.Mesh(globeGeometry, globeMaterial);
    this.globeGroup.add(this.globe);

    Promise.all([
      loadTexture(EARTH_TEXTURE_CDN.color, this.renderer, { isColorMap: true }),
      loadTexture(EARTH_TEXTURE_CDN.bump, this.renderer),
      loadTexture(EARTH_TEXTURE_CDN.specular, this.renderer),
    ])
      .then(([earthTexture, bumpTexture, specTexture]) => {
        if (this._isDestroyed || !this.globe) return;
        globeMaterial.map = earthTexture;
        globeMaterial.bumpMap = bumpTexture;
        globeMaterial.bumpScale = 1.25;
        globeMaterial.specularMap = specTexture;
        globeMaterial.needsUpdate = true;
      })
      .catch(() => {
        if (this._isDestroyed || !this.globe) return;
        // Fallback keeps app functional when CDN is blocked/offline.
        const texSize = 2048;
        globeMaterial.map = new THREE.CanvasTexture(generateEarthTexture(texSize, texSize));
        globeMaterial.bumpMap = new THREE.CanvasTexture(generateBumpTexture(texSize, texSize));
        globeMaterial.bumpScale = 1.5;
        globeMaterial.specularMap = new THREE.CanvasTexture(generateSpecularTexture(texSize, texSize));
        globeMaterial.needsUpdate = true;
      });

    // Add subtle grid overlay for the cyber aesthetic
    this.createGlobeGrid();
  }

  /**
   * Create cloud layer
   */
  createCloudLayer() {
    const cloudGeometry = new THREE.SphereGeometry(this.globeRadius + 1.2, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.globeGroup.add(this.cloudMesh);

    loadTexture(EARTH_TEXTURE_CDN.clouds, this.renderer, { isColorMap: true })
      .then((cloudTexture) => {
        if (this._isDestroyed || !this.cloudMesh) return;
        cloudMaterial.map = cloudTexture;
        cloudMaterial.needsUpdate = true;
      })
      .catch(() => {
        if (this._isDestroyed || !this.cloudMesh) return;
        cloudMaterial.map = new THREE.CanvasTexture(generateCloudTexture(1024, 512));
        cloudMaterial.needsUpdate = true;
      });
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

  scheduleTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      this._pendingTimeouts.delete(timeoutId);
      if (!this._isDestroyed) {
        callback();
      }
    }, delay);
    this._pendingTimeouts.add(timeoutId);
    return timeoutId;
  }

  queueAutoRotateResume() {
    clearTimeout(this._autoRotateTimeout);
    this._autoRotateTimeout = this.scheduleTimeout(() => {
      this.autoRotate = true;
    }, 5000);
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
      this.queueAutoRotateResume();
    });

    canvas.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        canvas.style.cursor = 'grab';
        this.queueAutoRotateResume();
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
      this.queueAutoRotateResume();
    }, { passive: true });

    // Resize
    this._onResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this._onResize);
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
    this.scheduleTimeout(() => {
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
      
      // Keep current scale fixed; only update visibility/opacities here.
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    this._isDestroyed = true;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    clearTimeout(this._autoRotateTimeout);
    this._pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this._pendingTimeouts.clear();
  }
}
