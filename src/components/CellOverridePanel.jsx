export function CellOverridePanel({ 
  selectedCell, 
  pixelGridData, 
  activeInventory, 
  overrideCell, 
  setSelectedCell 
}) {
  if (!selectedCell || !pixelGridData[selectedCell.y]?.[selectedCell.x]) {
    return null;
  }

  return (
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
  );
}