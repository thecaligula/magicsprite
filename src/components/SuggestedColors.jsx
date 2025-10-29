export function SuggestedColors({ suggestedColors }) {
  if (suggestedColors.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg">
      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
        💡 Suggested Palette Additions
      </h3>
      <p className="text-sm text-gray-700 mb-4">
        These colors would improve accuracy the most for your batch. They appear frequently in your sprites but aren't well-matched by your current palette.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestedColors.map((suggestion, idx) => (
          <div key={idx} className="bg-white border-2 border-amber-200 rounded p-3 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="text-lg font-bold text-amber-600">#{idx + 1}</div>
            </div>
            
            <div 
              className="w-16 h-16 border-2 border-gray-300 rounded flex-shrink-0"
              style={{ backgroundColor: suggestion.hex }}
              title={suggestion.hex}
            />
            
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs font-bold mb-1">{suggestion.hex}</div>
              <div className="text-xs text-gray-600">
                Used <strong>{suggestion.count}</strong> times
              </div>
              <div className="text-xs text-gray-600">
                Avg error: <strong>{suggestion.impact}</strong>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <div className="text-xs text-gray-500 mb-1">Closest match:</div>
              <div 
                className="w-12 h-12 border-2 border-gray-300 rounded"
                style={{ backgroundColor: suggestion.closestExisting.hex }}
                title={`${suggestion.closestExisting.code} - ${suggestion.closestExisting.name}`}
              />
              <div className="text-xs font-mono text-center mt-1">
                {suggestion.closestExisting.code}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-600 bg-white rounded p-3 border border-amber-200">
        <strong>💡 Tip:</strong> Look for bead brands that offer colors similar to the suggested hex codes above. 
        Adding these colors to your inventory would significantly improve the accuracy of these sprites.
      </div>
    </div>
  );
}