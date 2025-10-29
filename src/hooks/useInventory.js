import { useState, useMemo } from 'react';
import { defaultInventory } from '../data/constants';

export function useInventory(palette) {
  const [inventory, setInventory] = useState(defaultInventory);

  const activeInventory = useMemo(() => {
    return Object.entries(inventory)
      .filter(([_, amount]) => amount > 0)
      .map(([code, amount]) => {
        const found = palette.find(p => p.code === code);
        return found ? { code, amount, hex: found.hex, name: found.name } : null;
      })
      .filter(Boolean);
  }, [inventory, palette]);

  function updateInventory(code, amount) {
    setInventory(prev => ({ ...prev, [code]: Math.max(0, amount) }));
  }

  return {
    inventory,
    activeInventory,
    updateInventory
  };
}