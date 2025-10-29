import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function InventorySection({ palette, inventory, activeInventory, updateInventory }) {
  const [showInventory, setShowInventory] = useState(false);

  return (
    <section className="mb-6 border rounded-lg p-4 bg-gray-50">
      <button 
        className="flex items-center gap-2 font-semibold text-lg w-full"
        onClick={() => setShowInventory(!showInventory)}
      >
        {showInventory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        Bead Inventory ({activeInventory.length} colors active)
      </button>
      
      {showInventory && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {palette.map(color => (
            <div key={color.code} className="flex items-center gap-2 bg-white p-2 rounded border">
              <div 
                className="w-8 h-8 border flex-shrink-0" 
                style={{ background: color.hex }} 
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-bold">{color.code}</div>
                <div className="text-xs text-gray-600 truncate">{color.name}</div>
              </div>
              <input
                type="number"
                min="0"
                value={inventory[color.code] || 0}
                onChange={(e) => updateInventory(color.code, parseInt(e.target.value) || 0)}
                className="w-16 text-sm border rounded px-1 py-0.5"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}