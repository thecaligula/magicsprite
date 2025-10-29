import { useState } from 'react';
import { loadImageFromFile, trimCanvasWhitespace, calculateAccuracyScore } from '../utils/imageUtils';
import { findNearestInventoryColor, hexToRgb, rgbToHex } from '../utils/colorUtils';
import { analyzeMissedColors } from '../utils/colorAnalysis';

export function useBatchProcessing(palette, activeInventory, attemptDownscale) {
  const [batchResults, setBatchResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [suggestedColors, setSuggestedColors] = useState([]);

  async function handleBatchUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setProcessing(true);
    setBatchResults([]);
    setSuggestedColors([]);

    const results = [];
    const allMissedColors = [];

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
          
          const distance = Math.sqrt(
            (pixelRgb.r - nrgb.r) ** 2 +
            (pixelRgb.g - nrgb.g) ** 2 +
            (pixelRgb.b - nrgb.b) ** 2
          );
          
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

    if (allMissedColors.length > 0) {
      const suggestions = analyzeMissedColors(allMissedColors, palette, activeInventory);
      setSuggestedColors(suggestions);
    }

    setProcessing(false);
  }

  return {
    batchResults,
    processing,
    suggestedColors,
    handleBatchUpload,
    setBatchResults
  };
}