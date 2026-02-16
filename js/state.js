import { now } from './utils.js';

const STORAGE_KEY = "galaxy_clicker_mini_v2"; // Bumped version

const defaultState = () => ({
  energy: 0,
  totalEnergy: 0,
  upgrades: {
    clickPower: 0,
    drones: 0,
    reactor: 0,
    capacitor: 0
  },
  achievements: [], // List of unlocked achievement IDs
  stats: {
      clicks: 0
  },
  autoHold: false,
  lastTick: now()
});

export function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);

    // Migration / Sanitization
    return {
      ...defaultState(), // Ensure structure
      ...parsed,
      upgrades: { ...defaultState().upgrades, ...(parsed.upgrades || {}) },
      stats: { ...defaultState().stats, ...(parsed.stats || {}) },
      // Ensure specific fields are type-safe
      energy: Number(parsed.energy) || 0,
      totalEnergy: Number(parsed.totalEnergy) || 0,
      lastTick: Number(parsed.lastTick) || now()
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state){
  const payload = {
    ...state,
    energy: Math.floor(state.energy),
    totalEnergy: Math.floor(state.totalEnergy)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function resetState(){
    const s = defaultState();
    saveState(s);
    return s;
}
