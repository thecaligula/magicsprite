import { rgbToHsv, hsvToRgb, isHueInGroup } from "./colorUtils";

export function trimCanvasWhitespace(srcCanvas) {
  const ctx = srcCanvas.getContext('2d');
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;

  const isNonEmpty = (x, y, bgColor, useBgColor) => {
    const i = (y * w + x) * 4;
    const a = data[i + 3];
    if (a > 10) return true;
    if (useBgColor && bgColor) {
      const dr = Math.abs(data[i] - bgColor.r);
      const dg = Math.abs(data[i + 1] - bgColor.g);
      const db = Math.abs(data[i + 2] - bgColor.b);
      return (dr + dg + db) > 10;
    }
    return false;
  };

  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) { hasAlpha = true; break; }
  }

  let bgColor = null;
  let useBgColor = false;
  if (!hasAlpha) {
    const i0 = 0;
    bgColor = { r: data[i0], g: data[i0 + 1], b: data[i0 + 2] };
    const brightness = (bgColor.r * 299 + bgColor.g * 587 + bgColor.b * 114) / 1000;
    if (brightness > 240) useBgColor = true;
  }

  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isNonEmpty(x, y, bgColor, useBgColor)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return srcCanvas;

  const outW = maxX - minX + 1;
  const outH = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const octx = out.getContext('2d');
  octx.drawImage(srcCanvas, minX, minY, outW, outH, 0, 0, outW, outH);
  return out;
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function calculateAccuracyScore(originalImageData, beadImageData) {
  const data1 = originalImageData.data;
  const data2 = beadImageData.data;
  
  let totalDiff = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < data1.length; i += 4) {
    const a1 = data1[i + 3];
    const a2 = data2[i + 3];
    
    if (a1 < 128 && a2 < 128) continue;
    
    const r1 = data1[i];
    const g1 = data1[i + 1];
    const b1 = data1[i + 2];
    const r2 = data2[i];
    const g2 = data2[i + 1];
    const b2 = data2[i + 2];
    
    const diff = Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
    totalDiff += diff;
    pixelCount++;
  }
  
  if (pixelCount === 0) return 0;
  
  const avgDiff = totalDiff / pixelCount;
  const maxDiff = Math.sqrt(255**2 * 3);
  const accuracy = 100 * (1 - avgDiff / maxDiff);
  
  return accuracy;
}

export async function applyModifiersToImage(img, modifiers) {
  if (!modifiers) return img;

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  const { globalSat = 0, globalVal = 0, targetHue = "All", targetSat = 0, targetVal = 0 } = modifiers;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue; // skip transparent
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const { h, s, v } = rgbToHsv(r, g, b);

    let hD = h * 360;
    let newS = s + globalSat / 100;
    let newV = v + globalVal / 100;

    if (targetHue !== "All" && isHueInGroup(hD, targetHue, s)) {
      newS += targetSat / 100;
      newV += targetVal / 100;
    }

    newS = Math.min(1, Math.max(0, newS));
    newV = Math.min(1, Math.max(0, newV));

    const { r: nr, g: ng, b: nb } = hsvToRgb(h, newS, newV);
    d[i] = nr; d[i + 1] = ng; d[i + 2] = nb;
  }

  ctx.putImageData(imageData, 0, 0);
  const newImg = new Image();
  newImg.src = canvas.toDataURL();
  await newImg.decode();
  return newImg;
}
