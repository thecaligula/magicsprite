import { rgbToHex } from './colorUtils';
import { findNearestPaletteColor } from './colorUtils';

/**
 * Analyzes color mismatches from batch conversions to suggest inventory additions.
 * The analysis process:
 * 1. Groups similar missed colors using a distance threshold
 * 2. Calculates average RGB values for each group
 * 3. Ranks groups by their impact (frequency * average distance)
 * 4. Filters out groups that have close matches in inventory
 * 5. Returns top suggestions for inventory additions
 * 
 * @param {Array} missedColors - List of color mismatches from conversions
 * @param {Array} palette - Complete bead color palette
 * @param {Array} activeInventory - Currently available bead colors
 * @returns {Array} Top 30 color suggestions with impact scores
 */
export function analyzeMissedColors(missedColors, palette, activeInventory) {
  const colorGroups = [];
  const threshold = 50;

  for (const miss of missedColors) {
    let foundGroup = false;
    
    for (const group of colorGroups) {
      const avgColor = group.average;
      const dist = Math.sqrt(
        (miss.original.r - avgColor.r) ** 2 +
        (miss.original.g - avgColor.g) ** 2 +
        (miss.original.b - avgColor.b) ** 2
      );
      
      if (dist < threshold) {
        group.colors.push(miss.original);
        group.totalDistance += miss.distance;
        group.count++;
        group.average = {
          r: Math.round(group.colors.reduce((s, c) => s + c.r, 0) / group.colors.length),
          g: Math.round(group.colors.reduce((s, c) => s + c.g, 0) / group.colors.length),
          b: Math.round(group.colors.reduce((s, c) => s + c.b, 0) / group.colors.length)
        };
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      colorGroups.push({
        colors: [miss.original],
        average: { ...miss.original },
        totalDistance: miss.distance,
        count: 1
      });
    }
  }

  colorGroups.sort((a, b) => {
    const impactA = a.count * (a.totalDistance / a.count);
    const impactB = b.count * (b.totalDistance / b.count);
    return impactB - impactA;
  });

  const processedGroups = colorGroups.map(group => {
    const hex = rgbToHex(group.average.r, group.average.g, group.average.b);
    const closestPalette = findNearestPaletteColor(group.average, palette);
    const impact = group.count * (group.totalDistance / group.count);
    
    const closestInInventory = activeInventory.find(inv => inv.code === closestPalette.code);
    
    return {
      hex,
      rgb: group.average,
      count: group.count,
      impact,
      impactScore: impact.toFixed(1),
      closestPalette,
      hasMatchInInventory: !!closestInInventory
    };
  });

  const uniqueGroups = processedGroups
    .filter(group => !group.hasMatchInInventory)
    .sort((a, b) => b.impact - a.impact);

  const suggestions = uniqueGroups.slice(0, 30).map(group => ({
    hex: group.hex,
    rgb: group.rgb,
    count: group.count,
    impact: group.impactScore,
    closestExisting: group.closestPalette
  }));

  return suggestions;
}