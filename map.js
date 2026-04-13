/**
 * map.js - Three.js 3D Realistic Earth Globe for Cyber Attack Map
 * 
 * Improved version with:
 * - More accurate continent/island polygon shapes
 * - Better positioned country labels
 * - Refined biome colors and terrain detail
 * - Polished atmosphere, ocean, and lighting
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
 * Country label data - curated list of ~40 major countries
 * Positioned at visual center of each country, sized by area/importance
 */
const COUNTRY_LABELS = [
  // Americas
  { name: 'United States', lat: 39.0, lng: -98.0, size: 1.0 },
  { name: 'Canada', lat: 58.0, lng: -100.0, size: 0.9 },
  { name: 'Mexico', lat: 24.0, lng: -102.0, size: 0.7 },
  { name: 'Brazil', lat: -10.0, lng: -52.0, size: 1.0 },
  { name: 'Argentina', lat: -35.0, lng: -64.0, size: 0.7 },
  { name: 'Colombia', lat: 4.0, lng: -72.0, size: 0.55 },
  { name: 'Peru', lat: -10.0, lng: -76.0, size: 0.55 },
  { name: 'Chile', lat: -33.0, lng: -71.0, size: 0.45 },
  { name: 'Greenland', lat: 72.0, lng: -40.0, size: 0.6 },
  // Europe
  { name: 'Russia', lat: 62.0, lng: 95.0, size: 1.0 },
  { name: 'Germany', lat: 51.0, lng: 10.0, size: 0.55 },
  { name: 'France', lat: 46.5, lng: 2.5, size: 0.55 },
  { name: 'UK', lat: 54.0, lng: -2.0, size: 0.5 },
  { name: 'Spain', lat: 40.0, lng: -3.5, size: 0.5 },
  { name: 'Italy', lat: 42.5, lng: 12.5, size: 0.45 },
  { name: 'Poland', lat: 52.0, lng: 19.5, size: 0.45 },
  { name: 'Ukraine', lat: 49.0, lng: 32.0, size: 0.5 },
  { name: 'Sweden', lat: 62.0, lng: 16.0, size: 0.45 },
  { name: 'Norway', lat: 64.0, lng: 10.0, size: 0.4 },
  { name: 'Iceland', lat: 65.0, lng: -19.0, size: 0.35 },
  // Africa
  { name: 'Egypt', lat: 27.0, lng: 30.0, size: 0.6 },
  { name: 'Nigeria', lat: 9.5, lng: 8.0, size: 0.55 },
  { name: 'South Africa', lat: -29.0, lng: 25.0, size: 0.6 },
  { name: 'Algeria', lat: 28.0, lng: 2.0, size: 0.6 },
  { name: 'DR Congo', lat: -3.0, lng: 23.0, size: 0.55 },
  { name: 'Kenya', lat: 0.5, lng: 38.0, size: 0.45 },
  // Asia
  { name: 'China', lat: 35.0, lng: 103.0, size: 1.0 },
  { name: 'India', lat: 22.0, lng: 79.0, size: 0.9 },
  { name: 'Japan', lat: 36.5, lng: 138.5, size: 0.6 },
  { name: 'South Korea', lat: 36.0, lng: 128.0, size: 0.4 },
  { name: 'Indonesia', lat: -2.0, lng: 118.0, size: 0.7 },
  { name: 'Turkey', lat: 39.5, lng: 35.0, size: 0.55 },
  { name: 'Saudi Arabia', lat: 24.0, lng: 44.0, size: 0.65 },
  { name: 'Iran', lat: 33.0, lng: 53.0, size: 0.6 },
  { name: 'Pakistan', lat: 30.0, lng: 69.0, size: 0.55 },
  { name: 'Thailand', lat: 15.0, lng: 101.0, size: 0.45 },
  { name: 'Vietnam', lat: 16.0, lng: 108.0, size: 0.4 },
  { name: 'Philippines', lat: 12.0, lng: 122.0, size: 0.4 },
  { name: 'Kazakhstan', lat: 48.0, lng: 67.0, size: 0.65 },
  { name: 'Mongolia', lat: 47.0, lng: 104.0, size: 0.55 },
  // Oceania
  { name: 'Australia', lat: -25.0, lng: 134.0, size: 0.9 },
  { name: 'New Zealand', lat: -42.0, lng: 173.0, size: 0.4 },
];

/**
 * Create a text sprite for country labels - improved styling
 */
function createTextSprite(text, fontSize, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const scale = 2;
  const fSize = fontSize * scale;

  ctx.font = `600 ${fSize}px 'Inter', 'Segoe UI', Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width + 10 * scale;
  const textHeight = fSize * 1.5;

  canvas.width = textWidth;
  canvas.height = textHeight;

  // Subtle background pill
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
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

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text with shadow
  ctx.font = `600 ${fSize}px 'Inter', 'Segoe UI', Arial, sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = color || 'rgba(255, 255, 255, 0.88)';
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
  const spriteScale = fontSize * 0.14;
  sprite.scale.set(spriteScale * aspect, spriteScale, 1);

  return sprite;
}

// ============================================================
// PROCEDURAL EARTH TEXTURE - Improved continent shapes
// ============================================================

function generateEarthTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0b1a3a');    // polar dark
  oceanGrad.addColorStop(0.15, '#0a2555'); // mid-high lat
  oceanGrad.addColorStop(0.35, '#0c2d65'); // mid lat
  oceanGrad.addColorStop(0.5, '#0e3570');  // equator
  oceanGrad.addColorStop(0.65, '#0c2d65');
  oceanGrad.addColorStop(0.85, '#0a2555');
  oceanGrad.addColorStop(1, '#0b1a3a');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  function lngToX(lng) { return ((lng + 180) / 360) * width; }
  function latToY(lat) { return ((90 - lat) / 180) * height; }

  function drawLand(lats, lngs, baseColor, highlightColor) {
    if (lats.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(lngToX(lngs[0]), latToY(lats[0]));
    for (let i = 1; i < lats.length; i++) {
      ctx.lineTo(lngToX(lngs[i]), latToY(lats[i]));
    }
    ctx.closePath();
    if (highlightColor) {
      const gradient = ctx.createLinearGradient(
        lngToX(Math.min(...lngs)), latToY(Math.max(...lats)),
        lngToX(Math.max(...lngs)), latToY(Math.min(...lats))
      );
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, highlightColor);
      gradient.addColorStop(1, baseColor);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = baseColor;
    }
    ctx.fill();
  }

  // Biome color palette - more realistic
  const C = {
    forest:       '#1b5e2e', forestH:      '#2e7d42',
    tropical:     '#1a6b35', tropicalH:    '#258c48',
    darkJungle:   '#0e4a1c', darkJungleH:  '#1a5c2a',
    desert:       '#c9a84c', desertH:      '#d9be6a',
    tundra:       '#5f7f5f', tundraH:      '#7a9a7a',
    ice:          '#d0e4f0', iceH:         '#e4f0fa',
    savanna:      '#8a9a3a', savannaH:     '#a0b050',
    steppe:       '#95a56a', steppeH:      '#aab87a',
    mountain:     '#6a6a5a', mountainH:    '#8a8a7a',
    arid:         '#b09060', aridH:        '#c0a070',
    taiga:        '#3a5a3a', taigaH:       '#4a6a4a',
  };

  // ===== NORTH AMERICA =====
  // Alaska
  drawLand(
    [71, 70, 68, 66, 64, 62, 60, 58, 56, 55, 56, 58, 60, 62, 64, 66, 68, 70, 71],
    [-165, -162, -157, -153, -150, -147, -143, -140, -135, -132, -155, -160, -163, -165, -166, -165, -163, -162, -165],
    C.tundra, C.tundraH
  );
  // Alaska Peninsula
  drawLand(
    [58, 57, 55, 54, 53, 52, 53, 55, 57, 58],
    [-155, -158, -162, -165, -168, -170, -172, -168, -160, -155],
    C.tundra, C.tundraH
  );
  // Canada - Northern
  drawLand(
    [72, 70, 68, 66, 64, 62, 60, 58, 55, 52, 50, 48, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 72],
    [-140, -132, -120, -110, -95, -82, -72, -65, -58, -55, -56, -60, -80, -88, -95, -100, -110, -118, -125, -130, -135, -138, -140],
    C.taiga, C.tundra
  );
  // Canadian Arctic Islands
  drawLand(
    [78, 76, 74, 72, 70, 70, 72, 74, 76, 78],
    [-95, -88, -82, -78, -75, -95, -100, -102, -100, -95],
    C.ice, C.iceH
  );
  drawLand(
    [80, 78, 76, 75, 75, 76, 78, 80],
    [-80, -72, -68, -65, -80, -85, -85, -80],
    C.ice, C.iceH
  );
  // Baffin Island
  drawLand(
    [74, 72, 70, 68, 64, 62, 63, 66, 68, 70, 72, 74],
    [-72, -68, -65, -62, -64, -68, -75, -78, -78, -76, -74, -72],
    C.tundra, C.tundraH
  );
  // US + Southern Canada mainland
  drawLand(
    [50, 49, 48, 47, 46, 45, 43, 40, 38, 35, 33, 31, 30, 28, 26, 25, 25, 27, 29, 30, 30, 33, 35, 38, 40, 42, 44, 46, 48, 49, 50],
    [-128, -125, -124, -124, -124, -124, -124, -123, -122, -120, -118, -115, -112, -108, -100, -97, -82, -80, -82, -84, -88, -85, -78, -76, -74, -72, -70, -68, -66, -64, -56],
    C.forest, C.forestH
  );
  // Great Lakes region (slightly different color for visual interest)
  drawLand(
    [49, 48, 46, 44, 42, 41, 42, 44, 46, 48, 49],
    [-92, -88, -84, -82, -80, -83, -87, -90, -92, -93, -92],
    C.forest, '#2a6e3e'
  );
  // Florida
  drawLand(
    [31, 30, 29, 28, 26, 25, 25, 26, 27, 29, 30, 31],
    [-87, -85, -83, -82, -81, -80, -81, -82, -82, -83, -85, -87],
    C.tropical, C.tropicalH
  );
  // US Southwest desert
  drawLand(
    [38, 36, 34, 32, 30, 28, 30, 32, 34, 36, 38],
    [-120, -118, -116, -114, -112, -108, -106, -106, -108, -112, -115],
    C.desert, C.desertH
  );
  // Mexico
  drawLand(
    [32, 30, 28, 26, 24, 22, 20, 18, 16, 15, 16, 18, 20, 22, 24, 28, 30, 32],
    [-117, -115, -112, -110, -108, -106, -105, -103, -96, -92, -90, -92, -97, -100, -104, -108, -112, -115],
    C.arid, C.desert
  );
  // Yucatan Peninsula
  drawLand(
    [22, 21, 20, 18, 18, 20, 21, 22],
    [-92, -90, -88, -87, -90, -91, -91, -92],
    C.tropical, C.tropicalH
  );
  // Central America
  drawLand(
    [16, 15, 14, 12, 10, 9, 8, 7, 8, 9, 10, 12, 14, 15, 16],
    [-90, -89, -88, -86, -84, -82, -80, -78, -77, -79, -82, -84, -86, -88, -90],
    C.tropical, C.tropicalH
  );
  // Cuba
  drawLand(
    [23, 22.5, 22, 21, 20, 20, 20.5, 21, 22, 22.5, 23],
    [-84, -82, -80, -78, -76, -75, -77, -79, -81, -83, -84],
    C.tropical, C.tropicalH
  );
  // Hispaniola
  drawLand(
    [20, 19.5, 19, 18.5, 18.5, 19, 19.5, 20],
    [-74, -72, -70, -69, -71, -73, -74, -74],
    C.tropical, C.tropicalH
  );
  // Greenland
  drawLand(
    [84, 83, 81, 79, 77, 75, 72, 70, 68, 65, 62, 60, 60, 62, 65, 68, 70, 72, 74, 76, 78, 80, 82, 84],
    [-38, -28, -20, -18, -18, -19, -22, -25, -30, -40, -46, -48, -52, -54, -54, -52, -50, -48, -46, -44, -42, -40, -38, -38],
    C.ice, C.iceH
  );

  // ===== SOUTH AMERICA =====
  drawLand(
    [12, 10, 8, 6, 4, 2, 0, -2, -4, -6, -8, -10, -12, -15, -18, -20, -23, -26, -30, -33, -36, -40, -44, -48, -52, -55, -55, -52, -48, -44, -40, -36, -33, -30, -26, -23, -20, -18, -15, -12, -10, -8, -5, -2, 0, 2, 4, 6, 8, 10, 12],
    [-72, -70, -65, -60, -55, -51, -50, -48, -45, -42, -40, -38, -38, -39, -40, -41, -43, -46, -50, -53, -57, -62, -66, -70, -72, -70, -68, -68, -66, -64, -62, -58, -54, -52, -48, -46, -44, -42, -41, -40, -38, -36, -35, -50, -52, -55, -58, -62, -66, -70, -72],
    C.tropical, C.forest
  );
  // Amazon basin overlay
  drawLand(
    [2, 0, -2, -4, -6, -8, -10, -12, -10, -8, -5, -2, 0, 2],
    [-55, -52, -50, -48, -46, -44, -46, -52, -58, -62, -64, -62, -58, -55],
    C.darkJungle, C.darkJungleH
  );
  // Andes mountains
  drawLand(
    [4, 2, 0, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -52, -52, -48, -44, -40, -36, -32, -28, -24, -20, -16, -12, -8, -4, 0, 2, 4],
    [-78, -79, -80, -80, -79, -78, -76, -72, -70, -70, -71, -72, -72, -73, -74, -75, -72, -71, -70, -69, -68, -67, -67, -67, -68, -72, -74, -76, -77, -78, -77, -76],
    C.mountain, C.mountainH
  );
  // Patagonia steppe
  drawLand(
    [-40, -44, -48, -52, -55, -55, -52, -48, -44, -40],
    [-66, -68, -72, -72, -70, -68, -66, -64, -62, -62],
    C.steppe, C.steppeH
  );

  // ===== EUROPE =====
  // Scandinavia (Norway + Sweden)
  drawLand(
    [71, 70, 69, 68, 66, 64, 62, 60, 58, 56, 56, 58, 60, 62, 64, 66, 68, 70, 71],
    [24, 28, 30, 30, 28, 25, 22, 18, 14, 10, 6, 6, 8, 10, 12, 14, 16, 18, 24],
    C.taiga, C.forest
  );
  // Finland
  drawLand(
    [70, 68, 66, 64, 62, 60, 60, 62, 64, 66, 68, 70],
    [26, 28, 29, 28, 27, 25, 22, 22, 23, 24, 25, 26],
    C.taiga, C.tundra
  );
  // British Isles - Great Britain
  drawLand(
    [59, 57, 56, 55, 54, 53, 52, 51, 50, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    [-5, -4, -3, -2, -1, 0, 1, 1, -1, -4, -5, -5, -4, -4, -5, -5, -6, -6, -5],
    C.forest, C.forestH
  );
  // Ireland
  drawLand(
    [55, 54, 53, 52, 51.5, 51.5, 52, 53, 54, 55],
    [-8, -7, -6, -6, -7, -10, -10, -10, -10, -8],
    C.forest, C.forestH
  );
  // Iceland
  drawLand(
    [66.5, 66, 65.5, 64.5, 64, 63.5, 64, 65, 66, 66.5],
    [-22, -18, -15, -14, -15, -18, -22, -24, -24, -22],
    C.tundra, C.tundraH
  );
  // Western Europe (France, Benelux, W Germany)
  drawLand(
    [51, 50, 49, 48, 47, 46, 44, 43, 42, 43, 44, 46, 47, 48, 49, 50, 51],
    [-4, -3, -2, -2, -1, 0, 0, 2, 3, 5, 6, 7, 8, 8, 7, 6, 4],
    C.forest, C.forestH
  );
  // Central Europe
  drawLand(
    [55, 54, 52, 50, 48, 47, 46, 46, 47, 48, 50, 52, 54, 55],
    [8, 10, 14, 16, 18, 16, 14, 10, 8, 7, 6, 6, 7, 8],
    C.forest, C.forestH
  );
  // Eastern Europe (Poland, Baltics, W Russia)
  drawLand(
    [60, 58, 56, 54, 52, 50, 48, 46, 46, 48, 50, 52, 54, 56, 58, 60],
    [20, 22, 24, 24, 24, 24, 26, 28, 32, 34, 36, 38, 38, 36, 32, 28],
    C.forest, C.taiga
  );
  // Iberian Peninsula
  drawLand(
    [44, 43, 42, 40, 38, 37, 36, 37, 38, 40, 42, 43, 44],
    [-9, -8, -9, -9, -8, -6, -5, -2, 0, 2, 3, 2, 0],
    C.savanna, C.arid
  );
  // Italy boot
  drawLand(
    [46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
    [7, 8, 9, 10, 11, 13, 15, 16, 16, 15, 13, 12, 12, 13, 14, 15, 14, 12, 10],
    C.forest, C.savanna
  );
  // Sicily
  drawLand(
    [38.5, 38, 37, 37, 38, 38.5],
    [13, 12, 13, 15, 16, 15],
    C.savanna, C.savannaH
  );
  // Balkans / Greece
  drawLand(
    [46, 44, 42, 40, 38, 37, 38, 40, 42, 44, 46],
    [16, 18, 20, 22, 24, 22, 20, 18, 16, 15, 16],
    C.forest, C.savanna
  );
  // Greece peninsula
  drawLand(
    [40, 39, 38, 37, 36, 37, 38, 39, 40],
    [20, 21, 22, 23, 22, 20, 20, 20, 20],
    C.savanna, C.savannaH
  );

  // ===== AFRICA =====
  // Main continent
  drawLand(
    [37, 35, 33, 31, 28, 25, 22, 18, 14, 10, 6, 2, -2, -5, -8, -12, -16, -20, -24, -28, -32, -35, -34, -30, -26, -22, -18, -14, -10, -6, -2, 2, 6, 10, 14, 18, 22, 25, 28, 30, 32, 35, 37],
    [-8, -5, -2, 0, 2, 5, 8, 12, 14, 12, 10, 10, 10, 12, 14, 18, 22, 28, 32, 34, 30, 26, 20, 16, 16, 20, 28, 35, 40, 43, 46, 48, 50, 50, 48, 45, 40, 38, 35, 33, 30, 20, 10],
    C.desert, C.savanna
  );
  // Sahara Desert
  drawLand(
    [35, 33, 30, 27, 24, 20, 17, 17, 20, 24, 27, 30, 33, 35],
    [-10, -6, -2, 0, 3, 8, 12, 32, 36, 36, 34, 32, 28, 18],
    C.desert, C.desertH
  );
  // West Africa tropical
  drawLand(
    [12, 10, 8, 5, 4, 4, 5, 8, 10, 12],
    [-16, -14, -12, -8, -5, 2, 5, 8, 10, 8],
    C.tropical, C.tropicalH
  );
  // Congo Basin
  drawLand(
    [6, 4, 2, 0, -2, -5, -5, -2, 0, 2, 4, 6],
    [10, 12, 12, 14, 16, 18, 28, 30, 30, 28, 26, 22],
    C.darkJungle, C.darkJungleH
  );
  // East African highlands
  drawLand(
    [10, 8, 5, 2, 0, -3, -6, -10, -8, -5, -2, 0, 3, 6, 8, 10],
    [32, 34, 36, 38, 40, 42, 40, 38, 36, 34, 33, 33, 33, 34, 34, 32],
    C.savanna, C.savannaH
  );
  // Southern Africa
  drawLand(
    [-16, -20, -24, -28, -32, -35, -34, -30, -26, -22, -18, -16],
    [20, 18, 16, 18, 20, 26, 30, 33, 34, 35, 34, 32],
    C.savanna, C.steppe
  );
  // Horn of Africa
  drawLand(
    [12, 10, 8, 5, 2, 0, 2, 5, 8, 10, 12],
    [42, 44, 46, 48, 50, 48, 46, 44, 42, 42, 42],
    C.arid, C.desert
  );
  // Madagascar
  drawLand(
    [-12, -14, -16, -18, -20, -22, -24, -26, -25, -23, -20, -18, -16, -14, -12],
    [49, 50, 50, 49, 48, 47, 46, 44, 43, 44, 44, 45, 46, 48, 49],
    C.tropical, C.tropicalH
  );

  // ===== ASIA =====
  // Russia - Western
  drawLand(
    [72, 70, 68, 65, 62, 58, 55, 52, 50, 48, 46, 46, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 72],
    [28, 30, 32, 35, 38, 42, 44, 46, 48, 50, 52, 58, 60, 62, 64, 65, 65, 62, 58, 55, 50, 42, 35],
    C.taiga, C.forest
  );
  // Russia - Siberia
  drawLand(
    [75, 73, 72, 70, 68, 65, 62, 58, 55, 52, 50, 48, 46, 44, 42, 42, 44, 46, 48, 50, 52, 55, 58, 62, 65, 68, 70, 72, 74, 75],
    [60, 65, 70, 80, 90, 100, 110, 120, 130, 135, 140, 142, 140, 135, 132, 140, 145, 150, 155, 160, 165, 170, 175, 180, 175, 170, 160, 150, 140, 120],
    C.tundra, C.taiga
  );
  // Kamchatka
  drawLand(
    [62, 60, 58, 56, 54, 52, 51, 52, 54, 56, 58, 60, 62],
    [160, 162, 163, 164, 162, 160, 158, 156, 156, 157, 158, 159, 160],
    C.tundra, C.tundraH
  );
  // Middle East
  drawLand(
    [38, 37, 36, 35, 34, 33, 32, 30, 28, 26, 24, 22, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38],
    [26, 28, 30, 32, 34, 36, 36, 38, 40, 42, 44, 48, 52, 56, 58, 58, 56, 52, 48, 44, 40, 35],
    C.desert, C.arid
  );
  // Arabian Peninsula
  drawLand(
    [30, 28, 26, 24, 22, 18, 15, 12, 14, 16, 18, 22, 24, 26, 28, 30],
    [35, 36, 38, 42, 48, 52, 54, 50, 46, 44, 42, 40, 38, 36, 35, 35],
    C.desert, C.desertH
  );
  // Iran/Afghanistan
  drawLand(
    [40, 38, 36, 34, 32, 30, 28, 26, 26, 28, 30, 32, 34, 36, 38, 40],
    [44, 48, 52, 56, 60, 64, 68, 66, 62, 58, 54, 50, 46, 44, 44, 44],
    C.arid, C.desert
  );
  // Central Asia steppe
  drawLand(
    [52, 50, 48, 46, 44, 42, 40, 38, 36, 38, 40, 42, 44, 46, 48, 50, 52],
    [52, 55, 58, 62, 66, 70, 74, 78, 80, 82, 82, 80, 78, 74, 70, 65, 60],
    C.steppe, C.steppeH
  );
  // India - triangle shape
  drawLand(
    [35, 33, 30, 28, 26, 24, 22, 20, 18, 15, 12, 10, 8, 8, 10, 12, 15, 18, 20, 22, 24, 26, 28, 30, 32, 35],
    [72, 74, 76, 78, 80, 82, 84, 85, 84, 82, 80, 78, 77, 73, 72, 72, 73, 74, 74, 73, 72, 70, 68, 68, 70, 72],
    C.tropical, C.savanna
  );
  // Sri Lanka - teardrop
  drawLand(
    [10, 9, 8, 7, 6, 6.5, 7.5, 8.5, 9.5, 10],
    [80, 80.5, 81, 81.5, 81, 80, 79.5, 79.5, 80, 80],
    C.tropical, C.tropicalH
  );
  // Himalayas
  drawLand(
    [37, 36, 35, 33, 31, 29, 27, 28, 30, 32, 34, 36, 37],
    [74, 78, 82, 86, 90, 94, 97, 98, 96, 92, 88, 82, 78],
    C.mountain, C.ice
  );
  // China mainland
  drawLand(
    [50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 25, 22, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50],
    [82, 86, 90, 94, 98, 102, 106, 108, 110, 112, 114, 118, 120, 118, 110, 108, 106, 104, 102, 100, 98, 96, 96, 98, 100, 104, 108, 112, 116, 120],
    C.forest, C.steppe
  );
  // Southeast China green
  drawLand(
    [34, 32, 30, 28, 25, 22, 20, 22, 25, 28, 30, 32, 34],
    [106, 108, 112, 116, 120, 118, 110, 106, 104, 102, 104, 106, 106],
    C.tropical, C.forest
  );
  // Mongolia
  drawLand(
    [52, 50, 48, 46, 44, 42, 42, 44, 46, 48, 50, 52],
    [88, 92, 96, 100, 106, 112, 118, 120, 118, 116, 112, 100],
    C.steppe, C.desert
  );
  // Korea Peninsula
  drawLand(
    [43, 42, 40, 38, 37, 35, 34, 34, 35, 37, 38, 40, 42, 43],
    [125, 126, 127, 127, 126, 127, 128, 130, 130, 129, 129, 128, 127, 126],
    C.forest, C.forestH
  );
  // Japan - Hokkaido
  drawLand(
    [46, 45, 44, 43, 42, 42, 43, 44, 45, 46],
    [140, 142, 144, 145, 144, 141, 140, 140, 140, 140],
    C.forest, C.forestH
  );
  // Japan - Honshu
  drawLand(
    [42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    [140, 141, 140, 140, 139, 138, 137, 136, 135, 133, 132, 133, 135, 137, 138, 139, 139, 140, 140],
    C.forest, C.forestH
  );
  // Japan - Shikoku
  drawLand(
    [34.5, 34, 33, 33, 34, 34.5],
    [133, 134, 134, 132, 132, 133],
    C.forest, C.forestH
  );
  // Japan - Kyushu
  drawLand(
    [34, 33.5, 33, 32, 31, 31, 32, 33, 33.5, 34],
    [130, 131, 132, 131, 131, 130, 129, 130, 130, 130],
    C.forest, C.forestH
  );
  // Taiwan
  drawLand(
    [25.5, 25, 24, 23, 22, 22, 23, 24, 25, 25.5],
    [121, 122, 122, 121.5, 121, 120, 120, 120.5, 121, 121],
    C.tropical, C.forest
  );
  // Southeast Asia mainland (Indochina)
  drawLand(
    [24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
    [98, 100, 102, 104, 106, 108, 108, 106, 104, 102, 100, 100, 104, 106, 106, 106, 106, 106, 106, 106, 104, 102, 100, 98, 96],
    C.tropical, C.tropicalH
  );
  // Malay Peninsula
  drawLand(
    [8, 6, 4, 2, 1, 1, 2, 4, 6, 8],
    [100, 100, 102, 103, 104, 102, 100, 100, 100, 100],
    C.darkJungle, C.tropical
  );
  // Sumatra
  drawLand(
    [6, 4, 2, 0, -2, -4, -6, -5, -3, -1, 1, 3, 5, 6],
    [95, 97, 99, 101, 103, 104, 105, 104, 102, 100, 98, 96, 95, 95],
    C.tropical, C.darkJungle
  );
  // Java
  drawLand(
    [-6, -6.5, -7, -7.5, -8, -8.5, -8, -7.5, -7, -6.5, -6],
    [105, 107, 109, 111, 113, 114, 114, 112, 110, 108, 106],
    C.tropical, C.tropicalH
  );
  // Borneo / Kalimantan
  drawLand(
    [7, 5, 3, 1, -1, -3, -4, -4, -3, -1, 1, 3, 5, 7],
    [109, 112, 114, 116, 118, 118, 116, 114, 112, 110, 108, 108, 108, 109],
    C.darkJungle, C.tropical
  );
  // Sulawesi (K-shape simplified)
  drawLand(
    [2, 1, 0, -1, -2, -3, -4, -5, -5, -4, -3, -2, -1, 0, 1, 2],
    [120, 121, 122, 123, 124, 124, 122, 121, 120, 120, 120, 121, 122, 122, 121, 120],
    C.tropical, C.tropicalH
  );
  // Papua / New Guinea
  drawLand(
    [-1, -2, -4, -6, -8, -10, -10, -8, -6, -4, -2, -1],
    [131, 134, 138, 142, 146, 150, 154, 155, 152, 148, 142, 136],
    C.darkJungle, C.tropical
  );
  // Philippines - Luzon
  drawLand(
    [19, 18, 17, 16, 15, 14, 14, 15, 16, 17, 18, 19],
    [120, 121, 122, 122, 121, 120, 119, 119, 119, 120, 120, 120],
    C.tropical, C.tropicalH
  );
  // Philippines - Visayas/Mindanao
  drawLand(
    [13, 12, 10, 8, 6, 6, 7, 8, 10, 12, 13],
    [122, 124, 126, 127, 126, 124, 122, 121, 120, 121, 122],
    C.tropical, C.tropicalH
  );

  // ===== AUSTRALIA =====
  drawLand(
    [-11, -13, -15, -17, -20, -23, -25, -28, -30, -32, -34, -36, -38, -38, -36, -34, -32, -30, -28, -25, -22, -20, -18, -15, -13, -11],
    [131, 136, 140, 144, 147, 150, 152, 153, 153, 152, 150, 148, 146, 142, 138, 134, 130, 126, 122, 118, 115, 114, 116, 120, 126, 131],
    C.desert, C.arid
  );
  // Australia - Eastern coast (green)
  drawLand(
    [-14, -16, -18, -22, -26, -30, -34, -38, -37, -34, -30, -26, -22, -18, -14],
    [144, 146, 148, 150, 152, 153, 152, 146, 145, 147, 150, 150, 148, 146, 144],
    C.forest, C.tropical
  );
  // Australia - Northern tropical
  drawLand(
    [-11, -12, -14, -16, -18, -16, -14, -12, -11],
    [130, 132, 134, 136, 134, 132, 130, 128, 130],
    C.savanna, C.tropical
  );
  // New Zealand - North Island
  drawLand(
    [-35, -36, -37, -38, -39, -40, -41, -41, -40, -39, -38, -37, -36, -35],
    [173, 175, 176, 177, 177, 176, 175, 174, 173, 173, 174, 174, 174, 173],
    C.forest, C.forestH
  );
  // New Zealand - South Island
  drawLand(
    [-41, -42, -43, -44, -45, -46, -47, -47, -46, -45, -44, -43, -42, -41],
    [173, 174, 172, 170, 168, 167, 168, 170, 171, 172, 172, 172, 172, 173],
    C.forest, C.forestH
  );

  // ===== POLAR REGIONS =====
  // Antarctic
  drawLand(
    [-62, -65, -68, -72, -78, -85, -90, -90, -85, -78, -72, -68, -65, -62],
    [-180, -140, -100, -60, -30, 0, 30, 60, 90, 120, 150, 170, 180, 180],
    C.ice, C.iceH
  );
  // Arctic ice patches
  drawLand(
    [88, 86, 84, 82, 80, 80, 82, 84, 86, 88],
    [0, 40, 80, 120, 160, -160, -120, -80, -40, 0],
    C.ice, C.iceH
  );

  // ===== OCEAN DETAILS =====
  // Add subtle ocean depth variation
  for (let y = 0; y < height; y += 6) {
    for (let x = 0; x < width; x += 6) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      if (pixel[0] < 25 && pixel[1] < 65 && pixel[2] > 60) {
        const lat = 90 - (y / height) * 180;
        // Polar ice on ocean
        if (Math.abs(lat) > 72) {
          const iceFactor = (Math.abs(lat) - 72) / 18;
          const noise = (Math.sin(x * 0.04) * Math.cos(y * 0.03) + 1) * 0.5;
          const iceR = Math.floor(190 + noise * 50);
          const iceG = Math.floor(210 + noise * 40);
          const iceB = Math.floor(235 + noise * 20);
          ctx.fillStyle = `rgba(${iceR}, ${iceG}, ${iceB}, ${Math.min(1, iceFactor * 0.6)})`;
          ctx.fillRect(x, y, 6, 6);
        }
      }
    }
  }

  return canvas;
}

// ============================================================
// BUMP MAP
// ============================================================
function generateBumpTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  function lngToX(lng) { return ((lng + 180) / 360) * width; }
  function latToY(lat) { return ((90 - lat) / 180) * height; }

  function drawBump(lats, lngs, intensity) {
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

  // Mountain ranges - high bump
  // Himalayas
  drawBump([37, 36, 35, 33, 31, 29, 27, 28, 30, 32, 34, 36, 37], [74, 78, 82, 86, 90, 94, 97, 98, 96, 92, 88, 82, 78], 0.9);
  // Andes
  drawBump([4, 0, -8, -16, -24, -36, -48, -52, -52, -48, -36, -24, -16, -8, 0, 4], [-78, -80, -79, -76, -70, -72, -74, -75, -72, -71, -68, -67, -72, -76, -78, -76], 0.85);
  // Rockies
  drawBump([55, 50, 45, 40, 35, 30, 32, 35, 40, 45, 50, 55], [-125, -120, -115, -112, -110, -108, -105, -105, -108, -112, -118, -122], 0.7);
  // Alps
  drawBump([48, 47, 46, 44, 44, 46, 47, 48], [5, 8, 12, 16, 14, 10, 7, 5], 0.65);
  // Urals
  drawBump([68, 65, 60, 55, 50, 50, 55, 60, 65, 68], [58, 60, 60, 58, 56, 62, 64, 64, 62, 60], 0.5);
  // East African Rift
  drawBump([10, 5, 0, -5, -10, -8, -4, 0, 4, 8, 10], [34, 36, 38, 40, 38, 36, 34, 33, 33, 34, 34], 0.6);

  // General land areas - low bump
  const landBumps = [
    { lats: [72, 25, 25, 72], lngs: [-170, -170, -50, -50], b: 0.18 },
    { lats: [15, -55, -55, 15], lngs: [-82, -82, -34, -34], b: 0.22 },
    { lats: [72, 35, 35, 72], lngs: [-12, -12, 42, 42], b: 0.18 },
    { lats: [37, -35, -35, 37], lngs: [-18, -18, 55, 55], b: 0.18 },
    { lats: [75, 5, 5, 75], lngs: [25, 25, 180, 180], b: 0.18 },
    { lats: [-10, -45, -45, -10], lngs: [110, 110, 160, 160], b: 0.14 },
  ];
  landBumps.forEach(r => drawBump(r.lats, r.lngs, r.b));

  return canvas;
}

// ============================================================
// SPECULAR MAP
// ============================================================
function generateSpecularTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Ocean = reflective (bright), land = non-reflective (dark)
  ctx.fillStyle = '#3a6699';
  ctx.fillRect(0, 0, width, height);

  function lngToX(lng) { return ((lng + 180) / 360) * width; }
  function latToY(lat) { return ((90 - lat) / 180) * height; }

  function drawMask(lats, lngs) {
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

  // Major landmasses (generous bounding)
  drawMask([75, 20, 20, 75], [-175, -175, -50, -50]);
  drawMask([15, -58, -58, 15], [-85, -85, -30, -30]);
  drawMask([72, 35, 35, 72], [-15, -15, 45, 45]);
  drawMask([38, -36, -36, 38], [-20, -20, 55, 55]);
  drawMask([76, 0, 0, 76], [25, 25, 180, 180]);
  drawMask([36, 0, 0, 36], [65, 65, 100, 100]);
  drawMask([-8, -42, -42, -8], [110, 110, 160, 160]);
  drawMask([85, 58, 58, 85], [-75, -75, -10, -10]);
  drawMask([-58, -90, -90, -58], [-180, -180, 180, 180]);
  // Islands
  drawMask([10, -10, -10, 10], [95, 95, 125, 125]); // SE Asia islands
  drawMask([48, 30, 30, 48], [128, 128, 148, 148]); // Japan

  return canvas;
}

// ============================================================
// CLOUD TEXTURE
// ============================================================
function generateCloudTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < 300; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const lat = 90 - (y / height) * 180;

    let chance = 0.25;
    if (Math.abs(lat) < 15) chance = 0.45;
    if (Math.abs(lat) > 40 && Math.abs(lat) < 60) chance = 0.55;
    if (Math.abs(lat) > 70) chance = 0.35;

    if (Math.random() < chance) {
      const size = 8 + Math.random() * 50;
      const opacity = 0.03 + Math.random() * 0.1;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.6, `rgba(255, 255, 255, ${opacity * 0.4})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
  }

  return canvas;
}

// ============================================================
// MAP MANAGER CLASS
// ============================================================
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
    this.clock = new THREE.Clock();
    this.atmosphereMesh = null;
    this.starField = null;
    this.cloudMesh = null;
    this.labelSprites = [];
  }

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
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Globe group
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    // Build elements
    this.createStarField();
    this.createRealisticGlobe();
    this.createCloudLayer();
    this.createAtmosphere();
    this.createCountryLabels();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x334466, 0.5);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.3);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.25);
    fillLight.position.set(-5, -1, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x88ccff, 0.15);
    rimLight.position.set(0, 5, -3);
    this.scene.add(rimLight);

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

  createRealisticGlobe() {
    const texSize = 2048;

    const earthCanvas = generateEarthTexture(texSize, texSize);
    const bumpCanvas = generateBumpTexture(texSize, texSize);
    const specCanvas = generateSpecularTexture(texSize, texSize);

    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.anisotropy = 4;
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    const specTexture = new THREE.CanvasTexture(specCanvas);

    const globeGeo = new THREE.SphereGeometry(this.globeRadius, 128, 128);
    const globeMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 1.5,
      specularMap: specTexture,
      specular: new THREE.Color(0x333333),
      shininess: 12,
    });

    this.globe = new THREE.Mesh(globeGeo, globeMat);
    this.globeGroup.add(this.globe);

    this.createGlobeGrid();
  }

  createCloudLayer() {
    const cloudCanvas = generateCloudTexture(1024, 512);
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);

    const geo = new THREE.SphereGeometry(this.globeRadius + 1.0, 64, 64);
    const mat = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    this.cloudMesh = new THREE.Mesh(geo, mat);
    this.globeGroup.add(this.cloudMesh);
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

    // Latitude lines every 30°
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        pts.push(latLngToVector3(lat, lng - 180, this.globeRadius + 0.2));
      }
      this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    // Longitude lines every 30°
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
      const sprite = createTextSprite(country.name, fontSize, 'rgba(255, 255, 255, 0.82)');
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
