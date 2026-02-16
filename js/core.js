window.Game = window.Game || {};

window.Game.Core = (function(){
    const { upgrades, multBonus, clickBonus, autoBonus, critChance } = window.Game.Config;

    function getUpgradeLevel(state, id){
        return state.upgrades[id] ?? 0;
    }

    function getCost(id, nextLevel){
        const def = upgrades.find(d => d.id === id);
        if(!def) return Infinity;
        const lvl = nextLevel - 1; 
        return Math.floor(def.baseCost * Math.pow(def.growth, lvl));
    }

    function getNextCost(state, id){
        const nextLevel = getUpgradeLevel(state, id) + 1;
        return getCost(id, nextLevel);
    }

    function getPerClick(state){
        const base = 1 + clickBonus(getUpgradeLevel(state, "clickPower"));
        const mult = multBonus(getUpgradeLevel(state, "reactor"), state.darkMatter);
        return base * mult;
    }

    function getPerSec(state){
        const base = autoBonus(
            getUpgradeLevel(state, "drones"),
            getUpgradeLevel(state, "miner")
        );
        const mult = multBonus(getUpgradeLevel(state, "reactor"), state.darkMatter);
        return base * mult;
    }

    function buyUpgrade(state, id, count = 1){
        const def = upgrades.find(d => d.id === id);
        if (!def) return false;

        let bought = false;

        for (let i = 0; i < count; i++){
            const lvl = getUpgradeLevel(state, id);
            const cost = getCost(id, lvl + 1);
            
            if (state.energy < cost){
                return i > 0; 
            }
            
            state.energy -= cost;
            state.upgrades[id] = lvl + 1;
            bought = true;
        }
        return bought;
    }

    // New: Prestige Logic
    function calculatePrestigeGain(totalEnergy){
        // Basic formula: 1 DM for every 1M energy? Or sqrt?
        // Let's say: (Total Energy / 1,000,000) ^ 0.5
        // 1M -> 1
        // 4M -> 2
        // 100M -> 10
        if(totalEnergy < 1000000) return 0;
        return Math.floor(Math.pow(totalEnergy / 1000000, 0.5));
    }

    function doPrestige(state){
        const gain = calculatePrestigeGain(state.totalEnergy);
        if(gain <= 0) return false;

        // Reset state but keep DM, Achievements, and Stats
        const newState = window.Game.State.defaultState();
        newState.darkMatter = (state.darkMatter || 0) + gain;
        newState.achievements = state.achievements;
        newState.stats = state.stats;
        newState.stats.resets = (state.stats.resets || 0) + 1;
        
        // Preserve settings
        newState.autoHold = state.autoHold;

        return newState;
    }

    return { 
        getUpgradeLevel, getCost, getNextCost, 
        getPerClick, getPerSec, buyUpgrade,
        calculatePrestigeGain, doPrestige
    };
})();
