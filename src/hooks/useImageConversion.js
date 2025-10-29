import { useState, useEffect } from 'react';
import { loadImageFromFile, trimCanvasWhitespace, applyModifiersToImage } from '../utils/imageUtils';
import { findNearestInventoryColor, hexToRgb } from '../utils/colorUtils';

export function useImageConversion(palette, activeInventory, canvasRef, resultCanvasRef) {
  const [imageUrl, setImageUrl] = useState(null);
  const [modifiers, setModifiers] = useState({
    globalSat: 0,
    globalVal: 0,
    targetHue: 'All',
    targetSat: 0,
    targetVal: 0
  });
  const [isModifiersOpen, setIsModifiersOpen] = useState(false);
  const [modifiedPreviewUrl, setModifiedPreviewUrl] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [beadCount, setBeadCount] = useState({});
  const [pixelGridData, setPixelGridData] = useState(null);
  const [attemptDownscale, setAttemptDownscale] = useState(false);

  useEffect(() => {
    async function generatePreview() {
      if (!imageUrl) return;
      if (!modifiers) return;

      const baseImg = new Image();
      baseImg.src = imageUrl;
      await baseImg.decode();

      try {
        const modImg = await applyModifiersToImage(baseImg, modifiers);
        const canvas = document.createElement('canvas');
        canvas.width = modImg.width;
        canvas.height = modImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(modImg, 0, 0);
        setModifiedPreviewUrl(canvas.toDataURL());
      } catch (err) {
        console.warn("Live modifier preview failed:", err);
      }
    }

    generatePreview();
  }, [imageUrl, modifiers]); // ✅ live preview updates whenever sliders change


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

  async function convertImage() {
    if (!imageUrl || palette.length === 0) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    await img.decode();

    let modifiedImg = img;

    if (modifiers) {
      try {
        modifiedImg = await applyModifiersToImage(img, modifiers);
      } catch (err) {
        console.warn("Modifier processing failed, using original image.", err);
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let w = modifiedImg.width;
    let h = modifiedImg.height;

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
    ctx.drawImage(modifiedImg, 0, 0, w, h);

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
    modifiers,
    setModifiers,
    isModifiersOpen,
    setIsModifiersOpen,
    modifiedPreviewUrl,
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