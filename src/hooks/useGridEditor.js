import { useState } from 'react';

/**
 * useGridEditor Hook
 * 
 * Manages the interactive bead grid editor functionality, allowing users to:
 * - Manually override individual bead colors
 * - Perform bulk color replacements
 * - Adjust grid zoom level
 * - Track cell selection and modifications
 * 
 * The grid editor is a crucial feature for fine-tuning sprite conversions,
 * especially for areas where automatic conversion needs manual adjustment.
 * 
 * @param {Array} palette - Complete bead color palette for color selection
 * @param {Array<Array>} pixelGridData - Current 2D grid of bead placements
 * @param {Function} setPixelGridData - Updates the main grid data
 * @param {Function} recalculateCounts - Updates bead counts after changes
 * @param {Function} updatePreviewFromGrid - Refreshes the preview image
 */
export function useGridEditor(palette, pixelGridData, setPixelGridData, recalculateCounts, updatePreviewFromGrid) {
  const [showGrid, setShowGrid] = useState(false);
  const [cellOverrides, setCellOverrides] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [gridZoom, setGridZoom] = useState(48);

  /**
   * Updates the selected cell state when a grid cell is clicked.
   * This selection is used for cell-specific operations like
   * color overrides.
   * 
   * @param {number} x - Grid column index of clicked cell
   * @param {number} y - Grid row index of clicked cell
   */
  function handleCellClick(x, y) {
    setSelectedCell({ x, y });
  }

  /**
   * Handles individual cell color overrides.
   * Updates both the visual grid and underlying data structure,
   * then refreshes counts and preview.
   * 
   * @param {number} x - Grid column index
   * @param {number} y - Grid row index
   * @param {string} newCode - Color code to apply
   */
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

  /**
   * Performs bulk color replacement across the entire grid.
   * Useful for quickly replacing one bead color with another,
   * typically used when running low on certain colors or
   * when wanting to achieve a different color balance.
   * 
   * @param {string} fromCode - Color code to replace
   * @param {string} toCode - New color code to use
   */
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

  /**
   * Replaces colors within a specific region of the grid.
   * Allows targeted color replacement in a specific area
   * rather than affecting the entire grid.
   * 
   * @param {string} fromCode - Color code to replace
   * @param {string} toCode - New color code to use
   * @param {number} regionY - Y coordinate of the region
   * @param {number} regionX - X coordinate of the region
   */
  function replaceRegionColor(fromCode, toCode, regionY, regionX) {
    const toColor = palette.find(p => p.code === toCode);
    if (!toColor) return;

    // Implementation pending
  }

  /**
   * Fills the entire grid with a single color.
   * Useful for creating a base layer or resetting
   * the grid to a uniform color.
   * 
   * @param {string} toCode - Color code to fill with
   */
  function fillAllColor(toCode) {
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

  /**
   * Resets the grid editor state to its initial values.
   * Clears all temporary states including:
   * - Grid visibility
   * - Cell override history
   * - Selected cell highlighting
   */
  function resetGridState() {
    setShowGrid(false);
    setCellOverrides({});
    setSelectedCell(null);
  }

  return {
    showGrid,
    setShowGrid,
    cellOverrides,
    selectedCell,
    setSelectedCell,
    gridZoom,
    setGridZoom,
    handleCellClick,
    overrideCell,
    replaceAllColor,
    resetGridState
  };
}