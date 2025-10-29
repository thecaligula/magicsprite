import { getBrightness } from '../utils/colorUtils';

export function BeadGrid({ 
  pixelGridData, 
  selectedCell, 
  gridZoom, 
  setGridZoom,
  handleCellClick 
}) {
  if (!pixelGridData) return null;

  return (
    <div>
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
    </div>
  );
}