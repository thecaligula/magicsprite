export function BulkColorReplace({ beadCount, palette, activeInventory, replaceAllColor }) {
  if (Object.keys(beadCount).length === 0) {
    return null;
  }

  function handleReplace() {
    const from = document.getElementById('fromColor').value;
    const to = document.getElementById('toColor').value;
    if (from && to) replaceAllColor(from, to);
  }

  return (
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
      <h3 className="font-medium mb-2">Replace All Instances of a Color</h3>
      <div className="flex gap-2 items-center flex-wrap">
        <select 
          id="fromColor"
          className="border rounded px-2 py-1"
        >
          <option value="">Select color to replace...</option>
          {Object.keys(beadCount).map(code => {
            const color = palette.find(p => p.code === code);
            return (
              <option key={code} value={code}>
                {code} - {color?.name} ({beadCount[code]} beads)
              </option>
            );
          })}
        </select>
        <span>→</span>
        <select 
          id="toColor"
          className="border rounded px-2 py-1"
        >
          <option value="">Select replacement color...</option>
          {activeInventory.map(color => (
            <option key={color.code} value={color.code}>
              {color.code} - {color.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleReplace}
          className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
        >
          Replace All
        </button>
      </div>
    </div>
  );
}