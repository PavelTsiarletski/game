window.Game = window.Game || {};

window.Game.State = (function(){
    const { now } = window.Game.Utils;
    const STORAGE_KEY = "galaxy_clicker_mini_v3"; // Bumped version

    const defaultState = () => ({
        energy: 0,
        totalEnergy: 0,
        darkMatter: 0, // Prestige currency
        upgrades: {
            clickPower: 0,
            stardust: 0,
            drones: 0,
            miner: 0,
            station: 0,
            swarm: 0,
            blackhole: 0,
            singularity: 0,
            nanobots: 0,
            alien: 0,
            neural: 0,
            reactor: 0,
            capacitor: 0,
            timecrystal: 0,
            fusion: 0
        },
        prestigeUpgrades: {}, // New: Persistent across soft resets
        achievements: [],
        stats: {
            clicks: 0,
            resets: 0
        },
        autoHold: false,
        autoBuy: false, // New
        lastTick: now()
    });

    function loadState(){
        try{
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return defaultState();
            const parsed = JSON.parse(raw);
            return {
                ...defaultState(),
                ...parsed,
                upgrades: { ...defaultState().upgrades, ...(parsed.upgrades || {}) },
                prestigeUpgrades: { ...defaultState().prestigeUpgrades, ...(parsed.prestigeUpgrades || {}) },
                stats: { ...defaultState().stats, ...(parsed.stats || {}) },
                // Ensure numbers
                energy: Number(parsed.energy) || 0,
                totalEnergy: Number(parsed.totalEnergy) || 0,
                darkMatter: Number(parsed.darkMatter) || 0,
                lastTick: Number(parsed.lastTick) || now()
            };
        } catch {
            return defaultState();
        }
    }

    function saveState(state){
        const payload = {
            ...state,
            energy: Math.floor(state.energy),
            totalEnergy: Math.floor(state.totalEnergy)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }

    function resetState(hard = false){
        const s = defaultState();
        if(!hard){
            // Soft reset (prestige) logic handled elsewhere? 
            // Usually resetState implies hard reset or we pass params.
            // For now, this function is "Hard Reset" to default.
        }
        saveState(s);
        return s;
    }

    return { loadState, saveState, resetState, defaultState };
})();
