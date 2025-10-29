export function SingleConversion({ 
  imageUrl, 
  convertedUrl, 
  attemptDownscale, 
  setAttemptDownscale,
  pixelGridData,
  onFileChange, 
  convertImage,
  showGrid,
  setShowGrid,
  palette 
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
  );
}