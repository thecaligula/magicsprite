/**
 * BeadRequirements Component
 * 
 * Displays a detailed table showing the required beads for the current sprite conversion.
 * Compares needed quantities against available inventory and highlights shortages.
 * 
 * @param {Object} beadCount - Number of beads needed for each color code
 * @param {Array} palette - Complete palette data with color information
 * @param {Object} inventory - Current inventory levels for each color code
 * 
 * Features:
 * - Sorts beads by quantity needed (highest first)
 * - Shows visual color samples
 * - Highlights shortages in red
 * - Only displays colors that are actually used (count > 0)
 */
export function BeadRequirements({ beadCount, palette, inventory }) {
  // Don't render anything if no beads are needed
  if (Object.keys(beadCount).length === 0) {
    return null;
  }

  return (
    <section className="mb-6 border rounded-lg p-4">
      <h2 className="font-semibold text-xl mb-3">Bead Requirements</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Code</th>
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2">Color</th>
              <th className="border p-2 text-right">Needed</th>
              <th className="border p-2 text-right">Available</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(beadCount)
              .filter(([_, cnt]) => cnt > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([code, cnt]) => {
                const color = palette.find(p => p.code === code);
                const have = inventory[code] || 0;
                const isShort = have < cnt;
                return (
                  <tr key={code} className={isShort ? 'bg-red-50' : ''}>
                    <td className="border p-2 font-mono font-bold">{code}</td>
                    <td className="border p-2">{color?.name || '—'}</td>
                    <td className="border p-2 text-center">
                      <div className="w-8 h-8 border inline-block" style={{ background: color?.hex || '#fff' }} />
                    </td>
                    <td className="border p-2 text-right font-semibold">{cnt}</td>
                    <td className="border p-2 text-right">{have}</td>
                    <td className="border p-2 text-center">
                      {isShort ? (
                        <span className="text-red-600 font-semibold">Short: {cnt - have}</span>
                      ) : (
                        <span className="text-green-600">✓ OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}