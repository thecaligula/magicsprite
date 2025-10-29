import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, SunIcon, SwatchIcon } from "@heroicons/react/24/outline";

/**
 * SingleConversion Component
 * 
 * Main interface for converting individual sprites to bead patterns.
 * Features:
 * - File upload for sprite images
 * - Side-by-side original and converted previews
 * - Downscaling option for upscaled sprites
 * - Interactive grid toggle
 * - Pixel-perfect image rendering
 * 
 * Workflow:
 * 1. Upload sprite image
 * 2. Configure downscaling preference
 * 3. Convert to bead pattern
 * 4. View/edit in bead grid
 * 
 * @param {string} imageUrl - URL of uploaded sprite
 * @param {string} convertedUrl - URL of converted bead pattern
 * @param {boolean} attemptDownscale - Whether to try 2x downscaling
 * @param {Function} setAttemptDownscale - Updates downscale preference
 * @param {Array<Array>} pixelGridData - Generated bead grid data
 * @param {Function} onFileChange - File upload handler
 * @param {Function} convertImage - Conversion trigger handler
 * @param {boolean} showGrid - Whether bead grid is visible
 * @param {Function} setShowGrid - Updates grid visibility
 * @param {Array} palette - Available bead color palette
 */
export function SingleConversion({ 
  imageUrl,
  modifiedPreviewUrl, 
  convertedUrl, 
  attemptDownscale, 
  setAttemptDownscale,
  pixelGridData,
  onFileChange, 
  convertImage,
  showGrid,
  setShowGrid,
  palette,
  modifiers,
  setModifiers,
  HUE_GROUPS,
  isModifiersOpen,
  setIsModifiersOpen
}) {

  return (
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

      <div className="mt-4 p-4 border rounded bg-gray-50 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsModifiersOpen(!isModifiersOpen)}>
            <h3 className="font-semibold text-lg flex items-center gap-1">
              <SwatchIcon className="w-5 h-5 text-blue-600" />
              Advanced Color Modifiers
            </h3>
            {isModifiersOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </div>

          <button
            onClick={() => setModifiers({
              globalSat: 0,
              globalVal: 0,
              targetHue: "All",
              targetSat: 0,
              targetVal: 0,
            })}
            className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-100 flex items-center gap-1"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Collapsible content */}
        {isModifiersOpen && (
          <div className="space-y-4">
            {/* Global controls */}
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span className="flex items-center gap-1"><SunIcon className="w-4 h-4 text-yellow-500" /> Global Saturation</span>
                <span className="opacity-70">{modifiers.globalSat}</span>
              </label>
              <input 
                type="range" 
                min="-50" max="50" 
                className="w-full accent-blue-600"
                value={modifiers.globalSat}
                onChange={e => setModifiers({...modifiers, globalSat: +e.target.value})} 
              />
            </div>

            <div>
              <label className="text-sm font-medium flex justify-between">
                <span className="flex items-center gap-1"><SunIcon className="w-4 h-4 text-orange-400" /> Global Brightness</span>
                <span className="opacity-70">{modifiers.globalVal}</span>
              </label>
              <input 
                type="range" 
                min="-50" max="50" 
                className="w-full accent-yellow-600"
                value={modifiers.globalVal}
                onChange={e => setModifiers({...modifiers, globalVal: +e.target.value})} 
              />
            </div>

            {/* Hue targeting */}
            <div className="pt-2 border-t">
              <label className="text-sm font-medium block mb-1 flex items-center gap-1">
                <SwatchIcon className="w-4 h-4 text-purple-600" /> Target Hue Group
              </label>
              <select
                className="border rounded p-1 text-sm w-full bg-white"
                value={modifiers.targetHue}
                onChange={e => setModifiers({...modifiers, targetHue: e.target.value})}
              >
                <option>All</option>
                {Object.keys(HUE_GROUPS).map(x => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Hue Saturation Adjust</span>
                <span className="opacity-70">{modifiers.targetSat}</span>
              </label>
              <input 
                type="range" 
                min="-50" max="50" 
                className="w-full accent-purple-600"
                value={modifiers.targetSat}
                onChange={e => setModifiers({...modifiers, targetSat: +e.target.value})} 
              />
            </div>

            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Hue Brightness Adjust</span>
                <span className="opacity-70">{modifiers.targetVal}</span>
              </label>
              <input 
                type="range" 
                min="-50" max="50" 
                className="w-full accent-green-600"
                value={modifiers.targetVal}
                onChange={e => setModifiers({...modifiers, targetVal: +e.target.value})} 
              />
            </div>
          </div>
        )}
      </div>


      <div className="mt-4 flex gap-6 items-start flex-wrap justify-center">
        {imageUrl && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-center">Original</h3>
            <img 
              src={imageUrl} 
              alt="original" 
              className="border" 
              style={{ 
                imageRendering: 'pixelated', 
                maxWidth: 512, 
                maxHeight: 512,
                minWidth: 256,
                minHeight: 256  
              }} 
            />
          </div>
        )}
        {modifiedPreviewUrl && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-center">Modified Preview</h3>
            <img 
              src={modifiedPreviewUrl} 
              alt="converted" 
              className="border" 
              style={{ 
                imageRendering: 'pixelated', 
                maxWidth: 512, 
                maxHeight: 512,
                minWidth: 256,
                minHeight: 256  
              }} 
            />
          </div>
        )}
        {convertedUrl && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-center">Bead Version</h3>
            <img 
              src={convertedUrl} 
              alt="converted" 
              className="border" 
              style={{ 
                imageRendering: 'pixelated', 
                maxWidth: 512, 
                maxHeight: 512,
                minWidth: 256,
                minHeight: 256  
              }} 
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
  );
}