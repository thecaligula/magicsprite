import { useState, useMemo } from 'react';
import { defaultInventory } from '../data/constants';

/**
 * useInventory Hook
 * 
 * Manages the user's bead inventory, tracking:
 * - Available bead colors and quantities
 * - Active (in-stock) beads for conversion
 * - Inventory updates and modifications
 * 
 * The inventory system:
 * - Starts with a default inventory preset
 * - Filters out beads with zero quantity
 * - Maintains color metadata (hex, name) for active beads
 * 
 * @param {Array} palette - Complete bead color palette for metadata
 */
export function useInventory(palette) {
  const [inventory, setInventory] = useState(defaultInventory);

  /**
   * Filtered list of beads currently available in inventory.
   * Only includes beads with quantity > 0 and adds color metadata.
   */
  const activeInventory = useMemo(() => {
    return Object.entries(inventory)
      .filter(([_, amount]) => amount > 0)
      .map(([code, amount]) => {
        const found = palette.find(p => p.code === code);
        return found ? { code, amount, hex: found.hex, name: found.name } : null;
      })
      .filter(Boolean);
  }, [inventory, palette]);

  /**
   * Updates the quantity of a specific bead color in inventory.
   * Ensures quantities never go below zero.
   * 
   * @param {string} code - Color code of the bead to update
   * @param {number} amount - New quantity to set (will be clamped to >= 0)
   */
  function updateInventory(code, amount) {
    setInventory(prev => ({ ...prev, [code]: Math.max(0, amount) }));
  }

  return {
    inventory,
    activeInventory,
    updateInventory
  };
}