export function BatchResultCard({ result, idx }) {
  const accuracy = parseFloat(result.accuracy);
  
  const qualityLabel = accuracy >= 90 ? 'Excellent' :
                       accuracy >= 75 ? 'Good' :
                       accuracy >= 60 ? 'Fair' : 'Poor';
  
  const qualityColor = accuracy >= 90 ? 'text-green-600' :
                       accuracy >= 75 ? 'text-yellow-600' :
                       'text-red-600';

  return (
    <div className="bg-white border rounded-lg p-4 flex gap-4 items-start">
      <div className="flex-shrink-0">
        <div className="text-2xl font-bold text-purple-600 mb-1">
          #{idx + 1}
        </div>
        <div className="text-sm font-semibold text-gray-700">
          {result.accuracy}%
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {result.width}×{result.height}px
        </div>
      </div>
      
      <div className="flex gap-4 flex-1 overflow-hidden">
        <div>
          <div className="text-xs font-medium mb-1">Original</div>
          <img 
            src={result.originalUrl} 
            alt="original"
            className="border"
            style={{ imageRendering: 'pixelated', maxWidth: 128, maxHeight: 128 }}
          />
        </div>
        <div>
          <div className="text-xs font-medium mb-1">Bead Version</div>
          <img 
            src={result.beadUrl} 
            alt="bead version"
            className="border"
            style={{ imageRendering: 'pixelated', maxWidth: 128, maxHeight: 128 }}
          />
        </div>
      </div>
      
      <div className="flex-shrink-0 min-w-0">
        <div className="text-xs font-medium mb-1 truncate" title={result.filename}>
          {result.filename}
        </div>
        <div className={`text-xs font-semibold ${qualityColor}`}>
          {qualityLabel}
        </div>
      </div>
    </div>
  );
}