import { Upload } from 'lucide-react';
import { BatchResultCard } from './BatchResultCard';
import { SuggestedColors } from './SuggestedColors';

/**
 * BatchAnalysis Component
 * 
 * Handles bulk sprite conversion analysis and provides color optimization suggestions.
 * This component allows users to upload multiple sprites at once and:
 * 1. Analyzes each sprite's compatibility with the current bead palette
 * 2. Ranks sprites by conversion accuracy
 * 3. Suggests new colors that would improve overall conversion quality
 * 
 * @param {boolean} processing - Whether batch processing is currently active
 * @param {Array} batchResults - Processed sprite results with accuracy scores
 * @param {Array} suggestedColors - Recommended colors to add to palette
 * @param {Function} handleBatchUpload - Handler for file upload events
 */
export function BatchAnalysis({ 
  processing, 
  batchResults, 
  suggestedColors,
  handleBatchUpload 
}) {
  return (
    <section className="mb-6 border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <h2 className="font-semibold text-xl mb-3 flex items-center gap-2">
        <Upload size={24} />
        Batch Sprite Analysis
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Upload multiple sprites to see which ones convert most accurately to bead colors
      </p>
      
      <input 
        type="file" 
        accept="image/*" 
        multiple 
        onChange={handleBatchUpload}
        className="mb-4"
        disabled={processing}
      />

      {processing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Processing sprites...</p>
        </div>
      )}

      {batchResults.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-3">Results (sorted by accuracy)</h3>
          <div className="space-y-4">
            {batchResults.map((result, idx) => (
              <BatchResultCard key={idx} result={result} idx={idx} />
            ))}
          </div>

          <SuggestedColors suggestedColors={suggestedColors} />
        </div>
      )}
    </section>
  );
}