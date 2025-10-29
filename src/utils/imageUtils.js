/**
 * Trims transparent or white borders from a canvas image.
 * Handles both transparent backgrounds and white/light backgrounds.
 * 
 * Process:
 * 1. Detects if image uses transparency
 * 2. If not transparent, checks if background is light
 * 3. Finds boundaries of non-empty content
 * 4. Creates new canvas with trimmed content
 * 
 * @param {HTMLCanvasElement} srcCanvas - Source canvas to trim
 * @returns {HTMLCanvasElement} New canvas with trimmed content
 */
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

/**
 * Loads an image file into an Image object asynchronously.
 * Handles the multi-step process of:
 * 1. Reading file as DataURL
 * 2. Creating Image object
 * 3. Loading image data
 * 
 * @param {File} file - Image file from input or drop event
 * @returns {Promise<HTMLImageElement>} Loaded image
 */
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

/**
 * Calculates color accuracy score between original image and bead conversion.
 * Score ranges from 0-100, where:
 * - 100: Perfect color match
 * - 0: Maximum possible color difference
 * 
 * Process:
 * 1. Compares each non-transparent pixel
 * 2. Calculates Euclidean distance in RGB space
 * 3. Averages differences and normalizes to 0-100 scale
 * 
 * @param {ImageData} originalImageData - Source image pixel data
 * @param {ImageData} beadImageData - Converted bead pattern pixel data
 * @returns {number} Accuracy score (0-100)
 */
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