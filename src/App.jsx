import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Upload, X } from 'lucide-react';

// Import palette data from local palette.json
import paletteData from './palette.json';

// Default inventory - all colors with generous amounts
const defaultInventory = {"C10":1000,"C17":1000,"C43":1000,"C02":1000,"C42":1000,"C57":1000,"C22":1000,"C31":1000,"C34":1000,"C03":1000,"C07":1000,"C51":1000,"C32":1000,"C23":1000,"C88":1000,"C01":1000,"C47":1000,"C33":1000,"C52":1000,"C26":1000,"C25":1000,"C21":1000,"C20":1000,"C19":1000,"C15":1000,"C14":1000,"C12":1000,"C13":1000,"C09":1000,"C05":1000,"C157":1000,"C75":1000,"C139":1000,"C18":1000,"C136":1000,"C89":1000,"C95":1000,"C46":1000,"C91":1000,"C148":1000,"C30":1000,"C97":1000,"C126":1000,"C112":1000,"C155":1000,"C76":1000,"C133":1000,"C140":1000,"C120":1000,"C149":1000,"C117":1000,"C72":1000,"C129":1000,"C53":1000,"C143":1000,"C119":1000,"C71":1000,"C73":1000,"C121":1000,"C11":1000};
//const defaultInventory = {"C10":1000,"C17":1000,"C43":1000,"C02":1000,"C42":1000,"C57":1000,"C22":1000,"C31":1000,"C34":1000,"C03":1000,"C07":1000,"C51":1000,"C32":1000,"C23":1000,"C88":1000,"C01":1000,"C47":1000,"C33":1000,"C52":1000,"C26":1000,"C25":1000,"C21":1000,"C20":1000,"C19":1000,"C15":1000,"C14":1000,"C12":1000,"C13":1000,"C09":1000,"C05":1000};


// --- Utility helpers ---
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function colorDistanceSq(c1, c2) {
  const rMean = (c1.r + c2.r) / 2;
  const r = c1.r - c2.r;
  const g = c1.g - c2.g;
  const b = c1.b - c2.b;
  
  const weightR = 2 + rMean / 256;
  const weightG = 4.0;
  const weightB = 2 + (255 - rMean) / 256;
  
  return weightR * r * r + weightG * g * g + weightB * b * b;
}

function findNearestInventoryColor(pixelRgb, inventoryPalette) {
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

function getBrightness(hex) {
  const rgb = hexToRgb(hex);
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

function trimCanvasWhitespace(srcCanvas) {
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

function loadImageFromFile(file) {
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

// Calculate accuracy score between original and bead version
function calculateAccuracyScore(originalImageData, beadImageData) {
  const data1 = originalImageData.data;
  const data2 = beadImageData.data;
  
  let totalDiff = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < data1.length; i += 4) {
    const a1 = data1[i + 3];
    const a2 = data2[i + 3];
    
    if (a1 < 128 && a2 < 128) continue; // Both transparent
    
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

// --- Main App component ---
export default function App() {
  const [palette, setPalette] = useState([]);
  const [inventory, setInventory] = useState(defaultInventory);
  const [showInventory, setShowInventory] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [beadCount, setBeadCount] = useState({});
  const [pixelGridData, setPixelGridData] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [cellOverrides, setCellOverrides] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [attemptDownscale, setAttemptDownscale] = useState(true);
  const [batchResults, setBatchResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [gridZoom, setGridZoom] = useState(48);
  const [suggestedColors, setSuggestedColors] = useState([]);
  const canvasRef = useRef(null);
  const resultCanvasRef = useRef(null);

  useEffect(() => {
    const paletteArray = Object.entries(paletteData).map(([code, data]) => ({
      code: code,
      name: data['Color Name'] || data.name || 'Unknown',
      hex: rgbToHex(data.R || 0, data.G || 0, data.B || 0),
      r: data.R || 0,
      g: data.G || 0,
      b: data.B || 0
    }));
    setPalette(paletteArray);
  }, []);

  const activeInventory = Object.entries(inventory)
    .filter(([_, amount]) => amount > 0)
    .map(([code, amount]) => {
      const found = palette.find(p => p.code === code);
      return found ? { code, amount, hex: found.hex, name: found.name } : null;
    })
    .filter(Boolean);

  function updateInventory(code, amount) {
    setInventory({ ...inventory, [code]: Math.max(0, amount) });
  }

  function updatePreviewFromGrid(gridData) {
    const h = gridData.length;
    const w = gridData[0]?.length || 0;
    
    const rCanvas = resultCanvasRef.current;
    rCanvas.width = w;
    rCanvas.height = h;
    const rCtx = rCanvas.getContext('2d');
    const imageData = rCtx.createImageData(w, h);
    const data = imageData.data;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const pixel = gridData[y][x];
        const idx = (y * w + x) * 4;
        if (pixel) {
          const rgb = hexToRgb(pixel.hex);
          data[idx] = rgb.r;
          data[idx + 1] = rgb.g;
          data[idx + 2] = rgb.b;
          data[idx + 3] = 255;
        } else {
          data[idx + 3] = 0;
        }
      }
    }
    
    rCtx.putImageData(imageData, 0, 0);
    const url = rCanvas.toDataURL();
    setConvertedUrl(url);
  }

  function handleCellClick(x, y) {
    setSelectedCell({ x, y });
  }

  function overrideCell(x, y, newCode) {
    const key = `${x},${y}`;
    const newColor = palette.find(p => p.code === newCode);
    if (!newColor) return;

    const newOverrides = { ...cellOverrides, [key]: newCode };
    setCellOverrides(newOverrides);

    const newGridData = pixelGridData.map((row, rowY) =>
      row.map((pixel, colX) => {
        if (colX === x && rowY === y) {
          return { code: newColor.code, hex: newColor.hex, name: newColor.name };
        }
        return pixel;
      })
    );

    setPixelGridData(newGridData);
    recalculateCounts(newGridData);
    updatePreviewFromGrid(newGridData);
    setSelectedCell(null);
  }

  function replaceAllColor(fromCode, toCode) {
    const toColor = palette.find(p => p.code === toCode);
    if (!toColor) return;

    const newGridData = pixelGridData.map(row =>
      row.map(pixel => {
        if (pixel && pixel.code === fromCode) {
          return { code: toColor.code, hex: toColor.hex, name: toColor.name };
        }
        return pixel;
      })
    );

    setPixelGridData(newGridData);
    recalculateCounts(newGridData);
    updatePreviewFromGrid(newGridData);
  }

  function recalculateCounts(gridData) {
    const counts = {};
    activeInventory.forEach(item => counts[item.code] = 0);
    
    gridData.forEach(row => {
      row.forEach(pixel => {
        if (pixel) {
          counts[pixel.code] = (counts[pixel.code] || 0) + 1;
        }
      });
    });
    
    setBeadCount(counts);
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = await loadImageFromFile(file);
      const temp = document.createElement('canvas');
      temp.width = img.width;
      temp.height = img.height;
      const tctx = temp.getContext('2d');
      tctx.clearRect(0, 0, temp.width, temp.height);
      tctx.drawImage(img, 0, 0);

      const trimmed = trimCanvasWhitespace(temp);
      const dataUrl = trimmed.toDataURL();
      setImageUrl(dataUrl);
      setConvertedUrl(null);
      setBeadCount({});
      setCellOverrides({});
      setBatchResults([]);
    } catch (err) {
      console.error('Failed to load image', err);
    }
  }

  async function convertImage() {
    if (!imageUrl || palette.length === 0) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    await img.decode();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let w = img.width;
    let h = img.height;
    
    if (attemptDownscale) {
      w = Math.floor(w * 0.5);
      h = Math.floor(h * 0.5);
    }
    
    const maxSide = 128;
    const limitScale = Math.min(1, maxSide / Math.max(w, h));
    w = Math.max(1, Math.round(w * limitScale));
    h = Math.max(1, Math.round(h * limitScale));
    
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    const invPalette = activeInventory;
    if (invPalette.length === 0) {
      alert('No colors in inventory.');
      return;
    }

    const counts = {};
    invPalette.forEach(item => counts[item.code] = 0);

    const gridData = [];
    
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a < 128) {
          row.push(null);
          continue;
        }
        const pixelRgb = { r, g, b };
        const nearest = findNearestInventoryColor(pixelRgb, invPalette);
        const nrgb = hexToRgb(nearest.hex);
        data[idx] = nrgb.r;
        data[idx + 1] = nrgb.g;
        data[idx + 2] = nrgb.b;
        counts[nearest.code] = (counts[nearest.code] || 0) + 1;
        row.push({ code: nearest.code, hex: nearest.hex, name: nearest.name });
      }
      gridData.push(row);
    }

    const rCanvas = resultCanvasRef.current;
    rCanvas.width = w;
    rCanvas.height = h;
    const rCtx = rCanvas.getContext('2d');
    rCtx.putImageData(imageData, 0, 0);

    const url = rCanvas.toDataURL();
    setConvertedUrl(url);
    setBeadCount(counts);
    setPixelGridData(gridData);
    setShowGrid(false);
    setCellOverrides({});
  }

  async function handleBatchUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setProcessing(true);
    setBatchResults([]);
    setSuggestedColors([]);

    const results = [];
    const allMissedColors = []; // Track all colors that were approximated

    for (const file of files) {
      try {
        const img = await loadImageFromFile(file);
        const temp = document.createElement('canvas');
        temp.width = img.width;
        temp.height = img.height;
        const tctx = temp.getContext('2d');
        tctx.clearRect(0, 0, temp.width, temp.height);
        tctx.drawImage(img, 0, 0);

        const trimmed = trimCanvasWhitespace(temp);
        
        let w = trimmed.width;
        let h = trimmed.height;
        
        if (attemptDownscale) {
          w = Math.floor(w * 0.5);
          h = Math.floor(h * 0.5);
        }
        
        const maxSide = 128;
        const limitScale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.max(1, Math.round(w * limitScale));
        h = Math.max(1, Math.round(h * limitScale));

        const origCanvas = document.createElement('canvas');
        origCanvas.width = w;
        origCanvas.height = h;
        const origCtx = origCanvas.getContext('2d');
        origCtx.imageSmoothingEnabled = false;
        origCtx.drawImage(trimmed, 0, 0, w, h);
        const originalImageData = origCtx.getImageData(0, 0, w, h);

        const beadCanvas = document.createElement('canvas');
        beadCanvas.width = w;
        beadCanvas.height = h;
        const beadCtx = beadCanvas.getContext('2d');
        const beadImageData = beadCtx.createImageData(w, h);
        const beadData = beadImageData.data;
        const origData = originalImageData.data;

        // Track color mismatches for this image
        const colorMismatches = [];

        for (let i = 0; i < origData.length; i += 4) {
          const a = origData[i + 3];
          if (a < 128) {
            beadData[i + 3] = 0;
            continue;
          }
          const pixelRgb = { r: origData[i], g: origData[i + 1], b: origData[i + 2] };
          const nearest = findNearestInventoryColor(pixelRgb, activeInventory);
          const nrgb = hexToRgb(nearest.hex);
          
          // Calculate how far off this match was
          const distance = Math.sqrt(
            (pixelRgb.r - nrgb.r) ** 2 +
            (pixelRgb.g - nrgb.g) ** 2 +
            (pixelRgb.b - nrgb.b) ** 2
          );
          
          // If distance is significant, record the original color
          if (distance > 30) {
            colorMismatches.push({
              original: pixelRgb,
              matched: nrgb,
              distance: distance,
              hex: rgbToHex(pixelRgb.r, pixelRgb.g, pixelRgb.b)
            });
          }
          
          beadData[i] = nrgb.r;
          beadData[i + 1] = nrgb.g;
          beadData[i + 2] = nrgb.b;
          beadData[i + 3] = 255;
        }

        allMissedColors.push(...colorMismatches);

        const accuracy = calculateAccuracyScore(originalImageData, beadImageData);
        
        beadCtx.putImageData(beadImageData, 0, 0);
        const beadUrl = beadCanvas.toDataURL();

        results.push({
          filename: file.name,
          accuracy: accuracy.toFixed(2),
          originalUrl: origCanvas.toDataURL(),
          beadUrl: beadUrl,
          width: w,
          height: h
        });
      } catch (err) {
        console.error(`Failed to process ${file.name}`, err);
      }
    }

    results.sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy));
    setBatchResults(results);

    // Analyze missed colors to suggest palette additions
    if (allMissedColors.length > 0) {
      analyzeMissedColors(allMissedColors);
    }

    setProcessing(false);
  }

  function analyzeMissedColors(missedColors) {
    // Group similar colors together using clustering
    const colorGroups = [];
    const threshold = 50; // Color similarity threshold

    for (const miss of missedColors) {
      let foundGroup = false;
      
      for (const group of colorGroups) {
        const avgColor = group.average;
        const dist = Math.sqrt(
          (miss.original.r - avgColor.r) ** 2 +
          (miss.original.g - avgColor.g) ** 2 +
          (miss.original.b - avgColor.b) ** 2
        );
        
        if (dist < threshold) {
          group.colors.push(miss.original);
          group.totalDistance += miss.distance;
          group.count++;
          // Recalculate average
          group.average = {
            r: Math.round(group.colors.reduce((s, c) => s + c.r, 0) / group.colors.length),
            g: Math.round(group.colors.reduce((s, c) => s + c.g, 0) / group.colors.length),
            b: Math.round(group.colors.reduce((s, c) => s + c.b, 0) / group.colors.length)
          };
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        colorGroups.push({
          colors: [miss.original],
          average: { ...miss.original },
          totalDistance: miss.distance,
          count: 1
        });
      }
    }

    // Sort by impact (count * average distance)
    colorGroups.sort((a, b) => {
      const impactA = a.count * (a.totalDistance / a.count);
      const impactB = b.count * (b.totalDistance / b.count);
      return impactB - impactA;
    });

    // Process and filter color groups
    const processedGroups = colorGroups.map(group => {
      const hex = rgbToHex(group.average.r, group.average.g, group.average.b);
      const closestPalette = findNearestPaletteColor(group.average, palette);
      const impact = group.count * (group.totalDistance / group.count);
      
      // Check if the closest palette color is in the active inventory
      const closestInInventory = activeInventory.find(inv => inv.code === closestPalette.code);
      
      return {
        hex,
        rgb: group.average,
        count: group.count,
        impact,
        impactScore: impact.toFixed(1),
        closestPalette,
        hasMatchInInventory: !!closestInInventory
      };
    });

    // Filter and sort the groups
    const uniqueGroups = processedGroups
      .filter(group => !group.hasMatchInInventory) // Only keep colors without matches in inventory
      .sort((a, b) => b.impact - a.impact); // Sort by impact score

    // Create the final suggestions (up to 30)
    const suggestions = uniqueGroups.slice(0, 30).map(group => ({
      hex: group.hex,
      rgb: group.rgb,
      count: group.count,
      impact: group.impactScore,
      closestExisting: group.closestPalette
    }));

    setSuggestedColors(suggestions);
  }

  function findNearestPaletteColor(rgb, paletteList) {
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

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">Fusebead Sprite Converter</h1>

      {/* Inventory Section */}
      <section className="mb-6 border rounded-lg p-4 bg-gray-50">
        <button 
          className="flex items-center gap-2 font-semibold text-lg w-full"
          onClick={() => setShowInventory(!showInventory)}
        >
          {showInventory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          Bead Inventory ({activeInventory.length} colors active)
        </button>
        
        {showInventory && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {palette.map(color => (
              <div key={color.code} className="flex items-center gap-2 bg-white p-2 rounded border">
                <div 
                  className="w-8 h-8 border flex-shrink-0" 
                  style={{ background: color.hex }} 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold">{color.code}</div>
                  <div className="text-xs text-gray-600 truncate">{color.name}</div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={inventory[color.code] || 0}
                  onChange={(e) => updateInventory(color.code, parseInt(e.target.value) || 0)}
                  className="w-16 text-sm border rounded px-1 py-0.5"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Single Image Conversion */}
      <section className="mb-6 border rounded-lg p-4">
        <h2 className="font-semibold text-xl mb-3">Single Sprite Conversion</h2>
        <input type="file" accept="image/*" onChange={onFileChange} className="mb-3" />
        
        <label className="inline-flex items-center gap-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={attemptDownscale}
            onChange={(e) => setAttemptDownscale(e.target.checked)}
          />
          <span>Attempt 2x downscale for upscaled sprites</span>
        </label>

        <div className="mt-4 flex gap-6 items-start flex-wrap">
          {imageUrl && (
            <div>
              <h3 className="text-sm font-medium mb-2">Original</h3>
              <img 
                src={imageUrl} 
                alt="original" 
                className="border" 
                style={{ imageRendering: 'pixelated', maxWidth: 256 }} 
              />
            </div>
          )}
          {convertedUrl && (
            <div>
              <h3 className="text-sm font-medium mb-2">Bead Version</h3>
              <img 
                src={convertedUrl} 
                alt="converted" 
                className="border" 
                style={{ imageRendering: 'pixelated', maxWidth: 256 }} 
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400" 
            onClick={convertImage}
            disabled={!imageUrl || palette.length === 0}
          >
            Convert to Beads
          </button>
          {pixelGridData && (
            <button 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" 
              onClick={() => setShowGrid(!showGrid)}
            >
              {showGrid ? 'Hide' : 'Show'} Bead Grid
            </button>
          )}
        </div>
      </section>

      {/* Bead Grid with Color Override */}
      {showGrid && pixelGridData && (
        <section className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-semibold text-xl">Interactive Bead Grid</h2>
              <p className="text-sm text-gray-600">Click any cell to override its color</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Zoom:</label>
              <button
                onClick={() => setGridZoom(Math.max(24, gridZoom - 8))}
                className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                −
              </button>
              <span className="text-sm font-mono w-12 text-center">{gridZoom}px</span>
              <button
                onClick={() => setGridZoom(Math.min(96, gridZoom + 8))}
                className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="overflow-auto border rounded p-4 bg-white" style={{ maxHeight: '600px' }}>
            <div className="inline-block">
              {pixelGridData.map((row, y) => (
                <div key={y} className="flex">
                  {row.map((pixel, x) => (
                    <div
                      key={x}
                      onClick={() => pixel && handleCellClick(x, y)}
                      className={`border border-gray-300 flex items-center justify-center font-mono cursor-pointer hover:ring-2 hover:ring-blue-400 ${
                        selectedCell?.x === x && selectedCell?.y === y ? 'ring-2 ring-blue-600' : ''
                      }`}
                      style={{
                        width: `${gridZoom}px`,
                        height: `${gridZoom}px`,
                        fontSize: `${Math.max(8, gridZoom / 6)}px`,
                        backgroundColor: pixel ? pixel.hex : 'transparent',
                        color: pixel ? (getBrightness(pixel.hex) > 128 ? '#000' : '#fff') : '#ccc'
                      }}
                      title={pixel ? `${pixel.code} - ${pixel.name}` : 'Transparent'}
                    >
                      {gridZoom >= 40 && pixel ? pixel.code : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {selectedCell && pixelGridData[selectedCell.y]?.[selectedCell.x] && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-medium mb-2">Override Cell ({selectedCell.x}, {selectedCell.y})</h3>
              <div className="flex gap-2 flex-wrap">
                {activeInventory.map(color => (
                  <button
                    key={color.code}
                    onClick={() => overrideCell(selectedCell.x, selectedCell.y, color.code)}
                    className="flex items-center gap-2 px-2 py-1 border rounded hover:bg-white"
                    style={{ borderColor: color.hex }}
                  >
                    <div className="w-6 h-6 border" style={{ background: color.hex }} />
                    <span className="text-xs font-mono">{color.code}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setSelectedCell(null)}
                className="mt-2 text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Bulk color replacement */}
          {Object.keys(beadCount).length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-medium mb-2">Replace All Instances of a Color</h3>
              <div className="flex gap-2 items-center flex-wrap">
                <select 
                  id="fromColor"
                  className="border rounded px-2 py-1"
                >
                  <option value="">Select color to replace...</option>
                  {Object.keys(beadCount).map(code => {
                    const color = palette.find(p => p.code === code);
                    return (
                      <option key={code} value={code}>
                        {code} - {color?.name} ({beadCount[code]} beads)
                      </option>
                    );
                  })}
                </select>
                <span>→</span>
                <select 
                  id="toColor"
                  className="border rounded px-2 py-1"
                >
                  <option value="">Select replacement color...</option>
                  {activeInventory.map(color => (
                    <option key={color.code} value={color.code}>
                      {color.code} - {color.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const from = document.getElementById('fromColor').value;
                    const to = document.getElementById('toColor').value;
                    if (from && to) replaceAllColor(from, to);
                  }}
                  className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                >
                  Replace All
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Bead Summary */}
      {Object.keys(beadCount).length > 0 && (
        <section className="mb-6 border rounded-lg p-4">
          <h2 className="font-semibold text-xl mb-3">Bead Requirements</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Code</th>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2">Color</th>
                  <th className="border p-2 text-right">Needed</th>
                  <th className="border p-2 text-right">Available</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(beadCount)
                  .filter(([_, cnt]) => cnt > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([code, cnt]) => {
                    const color = palette.find(p => p.code === code);
                    const have = inventory[code] || 0;
                    const isShort = have < cnt;
                    return (
                      <tr key={code} className={isShort ? 'bg-red-50' : ''}>
                        <td className="border p-2 font-mono font-bold">{code}</td>
                        <td className="border p-2">{color?.name || '—'}</td>
                        <td className="border p-2 text-center">
                          <div className="w-8 h-8 border inline-block" style={{ background: color?.hex || '#fff' }} />
                        </td>
                        <td className="border p-2 text-right font-semibold">{cnt}</td>
                        <td className="border p-2 text-right">{have}</td>
                        <td className="border p-2 text-center">
                          {isShort ? (
                            <span className="text-red-600 font-semibold">Short: {cnt - have}</span>
                          ) : (
                            <span className="text-green-600">✓ OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Batch Processing */}
      <section className="mb-6 border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <h2 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <Upload size={24} />
          Batch Sprite Analysis
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload multiple sprites to see which ones convert most accurately to bead colors
        </p>
        
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleBatchUpload}
          className="mb-4"
          disabled={processing}
        />

        {processing && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">Processing sprites...</p>
          </div>
        )}

        {batchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-3">Results (sorted by accuracy)</h3>
            <div className="space-y-4">
              {batchResults.map((result, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-4 flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      #{idx + 1}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {result.accuracy}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {result.width}×{result.height}px
                    </div>
                  </div>
                  
                  <div className="flex gap-4 flex-1 overflow-hidden">
                    <div>
                      <div className="text-xs font-medium mb-1">Original</div>
                      <img 
                        src={result.originalUrl} 
                        alt="original"
                        className="border"
                        style={{ imageRendering: 'pixelated', maxWidth: 128, maxHeight: 128 }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-1">Bead Version</div>
                      <img 
                        src={result.beadUrl} 
                        alt="bead version"
                        className="border"
                        style={{ imageRendering: 'pixelated', maxWidth: 128, maxHeight: 128 }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 min-w-0">
                    <div className="text-xs font-medium mb-1 truncate" title={result.filename}>
                      {result.filename}
                    </div>
                    <div className={`text-xs font-semibold ${
                      parseFloat(result.accuracy) >= 90 ? 'text-green-600' :
                      parseFloat(result.accuracy) >= 75 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {parseFloat(result.accuracy) >= 90 ? 'Excellent' :
                       parseFloat(result.accuracy) >= 75 ? 'Good' :
                       parseFloat(result.accuracy) >= 60 ? 'Fair' :
                       'Poor'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Colors Section */}
            {suggestedColors.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  💡 Suggested Palette Additions
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  These colors would improve accuracy the most for your batch. They appear frequently in your sprites but aren't well-matched by your current palette.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedColors.map((suggestion, idx) => (
                    <div key={idx} className="bg-white border-2 border-amber-200 rounded p-3 flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="text-lg font-bold text-amber-600">#{idx + 1}</div>
                      </div>
                      
                      <div 
                        className="w-16 h-16 border-2 border-gray-300 rounded flex-shrink-0"
                        style={{ backgroundColor: suggestion.hex }}
                        title={suggestion.hex}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-bold mb-1">{suggestion.hex}</div>
                        <div className="text-xs text-gray-600">
                          Used <strong>{suggestion.count}</strong> times
                        </div>
                        <div className="text-xs text-gray-600">
                          Avg error: <strong>{suggestion.impact}</strong>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="text-xs text-gray-500 mb-1">Closest match:</div>
                        <div 
                          className="w-12 h-12 border-2 border-gray-300 rounded"
                          style={{ backgroundColor: suggestion.closestExisting.hex }}
                          title={`${suggestion.closestExisting.code} - ${suggestion.closestExisting.name}`}
                        />
                        <div className="text-xs font-mono text-center mt-1">
                          {suggestion.closestExisting.code}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-xs text-gray-600 bg-white rounded p-3 border border-amber-200">
                  <strong>💡 Tip:</strong> Look for bead brands that offer colors similar to the suggested hex codes above. 
                  Adding these colors to your inventory would significantly improve the accuracy of these sprites.
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={resultCanvasRef} style={{ display: 'none' }} />

      <div className="mt-8 text-sm text-gray-600 border-t pt-4">
        <strong>Features:</strong>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li><strong>Inventory Management:</strong> All {palette.length} bead colors are pre-loaded. Expand the inventory section to adjust quantities.</li>
          <li><strong>Single Conversion:</strong> Upload one sprite for detailed editing with individual cell overrides.</li>
          <li><strong>Grid Zoom:</strong> Use +/- buttons to zoom in/out on the bead grid (24px to 96px per cell).</li>
          <li><strong>Color Replacement:</strong> Click any cell in the grid to change its color, or use bulk replacement to swap all instances.</li>
          <li><strong>Batch Analysis:</strong> Upload multiple sprites to find which ones work best with your bead palette. Sorted by accuracy score.</li>
          <li><strong>Palette Suggestions:</strong> After batch upload, the app analyzes which missing colors would improve accuracy most.</li>
          <li><strong>Accuracy Score:</strong> Based on average color deviation between original and bead version (100% = perfect match).</li>
        </ul>
      </div>
    </div>
  );
}