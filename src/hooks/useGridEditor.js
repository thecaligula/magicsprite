import { useState } from 'react';

export function useGridEditor(palette, pixelGridData, setPixelGridData, recalculateCounts, updatePreviewFromGrid) {
  const [showGrid, setShowGrid] = useState(false);
  const [cellOverrides, setCellOverrides] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [gridZoom, setGridZoom] = useState(48);

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