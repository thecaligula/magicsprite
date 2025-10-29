import { useState } from 'react';
import { loadImageFromFile, trimCanvasWhitespace } from '../utils/imageUtils';
import { findNearestInventoryColor, hexToRgb } from '../utils/colorUtils';

/**
 * useImageConversion Hook
 * 
 * Core hook for sprite-to-bead conversion functionality. Handles:
 * - Image loading and preprocessing
 * - Sprite conversion to bead patterns
 * - Automatic size adjustment and downscaling
 * - Grid data generation for interactive editing
 * - Bead count tracking
 * 
 * The conversion process:
 * 1. Load and trim whitespace from uploaded image
 * 2. Optionally downscale if sprite appears to be upscaled
 * 3. Convert each pixel to nearest available bead color
 * 4. Generate interactive grid data for manual adjustments
 * 5. Track bead usage counts for inventory management
 * 
 * @param {Array} palette - Complete bead color palette
 * @param {Array} activeInventory - Currently available bead colors
 * @param {React.RefObject} canvasRef - Hidden canvas for image processing
 * @param {React.RefObject} resultCanvasRef - Hidden canvas for result preview
 */
export function useImageConversion(palette, activeInventory, canvasRef, resultCanvasRef) {
  const [imageUrl, setImageUrl] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [beadCount, setBeadCount] = useState({});
  const [pixelGridData, setPixelGridData] = useState(null);
  const [attemptDownscale, setAttemptDownscale] = useState(true);

  /**
   * Updates the preview image based on the current grid data.
   * Used after manual color overrides or bulk color replacements.
   * 
   * @param {Array<Array>} gridData - 2D array of bead color information
   */
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

  /**
   * Recalculates bead counts after grid modifications.
   * Ensures bead requirement numbers stay accurate after manual edits.
   * 
   * @param {Array<Array>} gridData - Current state of the bead grid
   */
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
      setPixelGridData(null);
    } catch (err) {
      console.error('Failed to load image', err);
    }
  }

  /**
   * Main conversion function that transforms a sprite into a bead pattern.
   * 
   * Process:
   * 1. Scale image to workable size (max 128px on longest side)
   * 2. Apply optional 2x downscaling for upscaled sprites
   * 3. Convert each pixel to nearest available bead color
   * 4. Generate grid data for interactive editing
   * 5. Create preview image
   */
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
  }

  return {
    imageUrl,
    convertedUrl,
    beadCount,
    pixelGridData,
    attemptDownscale,
    setAttemptDownscale,
    setPixelGridData,
    setBeadCount,
    onFileChange,
    convertImage,
    updatePreviewFromGrid,
    recalculateCounts
  };
}