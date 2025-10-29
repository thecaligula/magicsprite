/**
 * Converts RGB color values to hexadecimal color string.
 * 
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {string} Hex color code (e.g., '#ff0000' for red)
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Converts hexadecimal color string to RGB color object.
 * 
 * @param {string} hex - Hex color code (e.g., '#ff0000')
 * @returns {Object} RGB color object with r, g, b properties
 */
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

/**
 * Calculates weighted squared distance between two RGB colors.
 * Uses a perceptual color difference algorithm that accounts for
 * human eye sensitivity to different color components.
 * 
 * @param {Object} c1 - First RGB color {r, g, b}
 * @param {Object} c2 - Second RGB color {r, g, b}
 * @returns {number} Weighted squared distance between colors
 */
export function colorDistanceSq(c1, c2) {
  const rMean = (c1.r + c2.r) / 2;
  const r = c1.r - c2.r;
  const g = c1.g - c2.g;
  const b = c1.b - c2.b;
  
  const weightR = 2 + rMean / 256;
  const weightG = 4.0;
  const weightB = 2 + (255 - rMean) / 256;
  
  return weightR * r * r + weightG * g * g + weightB * b * b;
}

/**
 * Calculates perceived brightness of a color using the YIQ formula.
 * Accounts for human perception of different color components.
 * 
 * @param {string} hex - Hex color code
 * @returns {number} Perceived brightness value (0-255)
 */
export function getBrightness(hex) {
  const rgb = hexToRgb(hex);
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

/**
 * Finds the closest matching bead color from available inventory.
 * Uses weighted color distance for perceptually accurate matches.
 * 
 * @param {Object} pixelRgb - Source color in RGB format
 * @param {Array} inventoryPalette - Available bead colors
 * @returns {Object} Best matching bead color with metadata
 */
export function findNearestInventoryColor(pixelRgb, inventoryPalette) {
  let best = null;
  let bestDist = Infinity;
  for (const p of inventoryPalette) {
    const rgb = hexToRgb(p.hex);
    const d = colorDistanceSq(pixelRgb, rgb);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

/**
 * Finds closest matching color from a general palette list.
 * Similar to findNearestInventoryColor but works with raw RGB values.
 * 
 * @param {Object} rgb - Source color in RGB format
 * @param {Array} paletteList - List of palette colors with r,g,b properties
 * @returns {Object} Best matching palette color
 */
export function findNearestPaletteColor(rgb, paletteList) {
  let best = null;
  let bestDist = Infinity;
  
  for (const p of paletteList) {
    const prgb = { r: p.r, g: p.g, b: p.b };
    const d = colorDistanceSq(rgb, prgb);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  
  return best;
}