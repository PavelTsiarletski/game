import { upgrades } from './config.js';

export function getUpgradeLevel(state, id){
  return state.upgrades[id] ?? 0;
}

export function getCost(id, nextLevel){
  const def = upgrades.find(d => d.id === id);
  if(!def) return Infinity;
  // cost is based on level to buy (nextLevel is 1-based index of purchased level)
  // Using exponential cost: baseCost * growth^(level)
  const lvl = nextLevel - 1; // 0-based
  return Math.floor(def.baseCost * Math.pow(def.growth, lvl));
}

export function getNextCost(state, id){
  const nextLevel = getUpgradeLevel(state, id) + 1;
  return getCost(id, nextLevel);
}

// Re-export bonus functions for convenience in UI
import { multBonus, clickBonus, autoBonus, critChance } from './config.js';

export function getPerClick(state){
  const base = 1 + clickBonus(getUpgradeLevel(state, "clickPower"));
  const mult = multBonus(getUpgradeLevel(state, "reactor"));
  return base * mult;
}

export function getPerSec(state){
  const base = autoBonus(getUpgradeLevel(state, "drones"));
  const mult = multBonus(getUpgradeLevel(state, "reactor"));
  return base * mult;
}

export function buyUpgrade(state, id, count = 1){
  const def = upgrades.find(d => d.id === id);
  if (!def) return false;

  let bought = false;

  for (let i = 0; i < count; i++){
    const lvl = getUpgradeLevel(state, id);
    const cost = getCost(id, lvl + 1);
    
    if (state.energy < cost){
        // partial success if we bought at least one in a batch
        return i > 0; 
    }
    
    state.energy -= cost;
    state.upgrades[id] = lvl + 1;
    bought = true;
  }
  return bought;
}
