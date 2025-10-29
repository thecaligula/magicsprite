export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

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

export function getBrightness(hex) {
  const rgb = hexToRgb(hex);
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

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

// src/utils/colorModifiers.js
export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0, s = (max === 0 ? 0 : d / max), v = max;

  switch (max) {
    case min: h = 0; break;
    case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
    case g: h = ((b - r) / d + 2); break;
    case b: h = ((r - g) / d + 4); break;
  }
  h /= 6;
  return { h, s, v };
}

export function hsvToRgb(h, s, v) {
  let r, g, b;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Named hue bands (Option B)
export const HUE_GROUPS = {
  Red:       [350,  10],
  Orange:    [10,   40],
  Yellow:    [40,   70],
  Lime:      [70,   100],
  Green:     [100,  150],
  Teal:      [150,  180],
  Cyan:      [180,  200],
  Sky:       [200,  220],
  Blue:      [220,  260],
  Purple:    [260,  290],
  Pink:      [290,  330],
  Brown:     [20,   40],  // brown is tricky; shares with orange
  Gray:      null // handled separately: low saturation threshold
};

export function isHueInGroup(hDegrees, groupName, saturation) {
  if (groupName === "Gray") {
    return saturation < 0.18;
  }
  const range = HUE_GROUPS[groupName];
  if (!range) return false;
  const [min, max] = range;
  if (min < max) return hDegrees >= min && hDegrees <= max;
  return hDegrees >= min || hDegrees <= max; // wrap-around reds
}
