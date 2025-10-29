import React, { useState, useEffect, useRef } from 'react';
import { rgbToHex } from './utils/colorUtils';
import { useInventory } from './hooks/useInventory';
import { useImageConversion } from './hooks/useImageConversion';
import { useGridEditor } from './hooks/useGridEditor';
import { useBatchProcessing } from './hooks/useBatchProcessing';
import { InventorySection } from './components/InventorySection';
import { SingleConversion } from './components/SingleConversion';
import { BeadGrid } from './components/BeadGrid';
import { CellOverridePanel } from './components/CellOverridePanel';
import { BulkColorReplace } from './components/BulkColorReplace';
import { BeadRequirements } from './components/BeadRequirements';
import { BatchAnalysis } from './components/BatchAnalysis';

// Import palette data
import paletteData from './palette.json';

/**
 * App Component
 * 
 * Main application component for the Fusebead Sprite Converter.
 * Orchestrates all major features:
 * - Bead palette and inventory management
 * - Single sprite conversion and editing
 * - Batch sprite analysis
 * - Color optimization suggestions
 * 
 * Architecture:
 * - Uses custom hooks for core functionality separation
 * - Hidden canvases for image processing
 * - Centralized state management
 * - Responsive layout with Tailwind CSS
 * 
 * Features are organized into sections:
 * 1. Inventory management (top)
 * 2. Single conversion interface
 * 3. Interactive bead grid editor
 * 4. Bead requirements display
 * 5. Batch analysis tools
 */
export default function App() {
  // Core state and refs
  const [palette, setPalette] = useState([]);
  const canvasRef = useRef(null);
  const resultCanvasRef = useRef(null);

  /**
   * Initialize palette on component mount.
   * Transforms raw JSON data into structured color objects with:
   * - Unique color codes
   * - Standardized color names
   * - Hex color values
   * - RGB component values
   */
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

  /**
   * Custom Hook Integration
   * 
   * useInventory: Manages available bead colors and quantities
   * useImageConversion: Handles sprite-to-bead conversion process
   * useGridEditor: Provides interactive grid editing capabilities
   * useBatchProcessing: Manages bulk sprite analysis features
   */
  const { inventory, activeInventory, updateInventory } = useInventory(palette);
  
  const {
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
  } = useImageConversion(palette, activeInventory, canvasRef, resultCanvasRef);

  const {
    showGrid,
    setShowGrid,
    selectedCell,
    setSelectedCell,
    gridZoom,
    setGridZoom,
    handleCellClick,
    overrideCell,
    replaceAllColor
  } = useGridEditor(palette, pixelGridData, setPixelGridData, recalculateCounts, updatePreviewFromGrid);

  const {
    batchResults,
    processing,
    suggestedColors,
    handleBatchUpload
  } = useBatchProcessing(palette, activeInventory, attemptDownscale);

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">Fusebead Sprite Converter</h1>

      <InventorySection 
        palette={palette}
        inventory={inventory}
        activeInventory={activeInventory}
        updateInventory={updateInventory}
      />

      <SingleConversion
        imageUrl={imageUrl}
        convertedUrl={convertedUrl}
        attemptDownscale={attemptDownscale}
        setAttemptDownscale={setAttemptDownscale}
        pixelGridData={pixelGridData}
        onFileChange={onFileChange}
        convertImage={convertImage}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        palette={palette}
      />

      {/* Interactive Editing Section - Only shown when grid is toggled and data exists */}
      {showGrid && pixelGridData && (
        <section className="mb-6 border rounded-lg p-4 bg-gray-50">
          <BeadGrid
            pixelGridData={pixelGridData}
            selectedCell={selectedCell}
            gridZoom={gridZoom}
            setGridZoom={setGridZoom}
            handleCellClick={handleCellClick}
          />

          <CellOverridePanel
            selectedCell={selectedCell}
            pixelGridData={pixelGridData}
            activeInventory={activeInventory}
            overrideCell={overrideCell}
            setSelectedCell={setSelectedCell}
          />

          <BulkColorReplace
            beadCount={beadCount}
            palette={palette}
            activeInventory={activeInventory}
            replaceAllColor={replaceAllColor}
          />
        </section>
      )}

      <BeadRequirements
        beadCount={beadCount}
        palette={palette}
        inventory={inventory}
      />

      <BatchAnalysis
        processing={processing}
        batchResults={batchResults}
        suggestedColors={suggestedColors}
        handleBatchUpload={handleBatchUpload}
      />

      {/* Hidden canvases for image processing
          - canvasRef: Used for initial image loading and manipulation
          - resultCanvasRef: Used for generating the final bead pattern preview
      */}
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