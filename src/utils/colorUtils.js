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