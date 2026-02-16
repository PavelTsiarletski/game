window.Game.Core = (function(){
    const { upgrades, prestigeUpgrades, multBonus, clickBonus, autoBonus, critChance } = window.Game.Config;

    function getUpgradeLevel(state, id){
        return state.upgrades[id] ?? 0;
    }

    function getPrestigeUpgradeLevel(state, id){
        return state.prestigeUpgrades ? (state.prestigeUpgrades[id] ?? 0) : 0;
    }

    function getCost(id, nextLevel){
        const def = upgrades.find(d => d.id === id);
        if(!def) return Infinity;
        const lvl = nextLevel - 1; 
        return Math.floor(def.baseCost * Math.pow(def.growth, lvl));
    }

    function getPrestigeCost(id, nextLevel){
        const def = prestigeUpgrades.find(d => d.id === id);
        if(!def) return Infinity;
        const lvl = nextLevel - 1;
        // Prestige cost scaling might be simpler or steeper
        return Math.floor(def.baseCost * Math.pow(def.growth, lvl));
    }

    function getNextCost(state, id){
        const nextLevel = getUpgradeLevel(state, id) + 1;
        return getCost(id, nextLevel);
    }
    
    function getNextPrestigeCost(state, id){
        const next = getPrestigeUpgradeLevel(state, id) + 1;
        return getPrestigeCost(id, next);
    }

    // New: Calculate total multipliers including Fusion + Prestige Upgrades
    function getTotalMultiplier(state){
        const reactorLvl = getUpgradeLevel(state, "reactor");
        const fusionLvl = getUpgradeLevel(state, "fusion");
        
        // Base Multiplier (Rest + DarkMatter)
        let mult = multBonus(reactorLvl, state.darkMatter);
        
        // Fusion Multiplier (x1.5 per level)
        if(fusionLvl > 0){
            mult *= Math.pow(1.5, fusionLvl);
        }
        
        return mult;
    }

    function getPerClick(state){
        let base = 1 + clickBonus(getUpgradeLevel(state, "clickPower"));
        
        // Neural Link Synergy
        const neuralLvl = getUpgradeLevel(state, "neural");
        if(neuralLvl > 0){
            // 15% of *base* auto production added to base click? Or total?
            // Let's use raw auto base for stability, or current perSec
            // Using current perSec creates a feedback loop if perSec depended on click (it doesn't).
            const autoRaw = getPerSec(state); 
            // Warning: getPerSec calls getTotalMultiplier. getPerClick calls getTotalMultiplier.
            // This is fine.
            base += autoRaw * (0.15 * neuralLvl);
        }

        const mult = getTotalMultiplier(state);
        return base * mult;
    }

    function getPerSec(state){
        const base = autoBonus(
            getUpgradeLevel(state, "drones"),
            getUpgradeLevel(state, "miner"),
            getUpgradeLevel(state, "station"),
            getUpgradeLevel(state, "swarm")
        );
        const mult = getTotalMultiplier(state);
        return base * mult;
    }
    
    function getCritMultiplier(state){
        const lvl = getPrestigeUpgradeLevel(state, "critMastery");
        return 3 + lvl; // Base 3x, +1x per level
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

    function buyPrestigeUpgrade(state, id){
        const def = prestigeUpgrades.find(d => d.id === id);
        if(!def) return false;
        
        const lvl = getPrestigeUpgradeLevel(state, id);
        if(def.maxLevel && lvl >= def.maxLevel) return false;
        
        const cost = getPrestigeCost(id, lvl + 1);
        
        if(state.darkMatter >= cost){
            state.darkMatter -= cost;
            if(!state.prestigeUpgrades) state.prestigeUpgrades = {};
            state.prestigeUpgrades[id] = lvl + 1;
            return true;
        }
        return false;
    }

    // New: Prestige Logic
    function calculatePrestigeGain(state){
        const totalEnergy = state.totalEnergy;
        // Basic formula: (Total Energy / 1,000,000) ^ 0.5
        if(totalEnergy < 1000000) return 0;
        
        let gain = Math.floor(Math.pow(totalEnergy / 1000000, 0.5));
        
        // Apply "Dark Flow" bonus
        const flowLvl = getPrestigeUpgradeLevel(state, "darkFlow");
        if(flowLvl > 0){
            gain = Math.floor(gain * (1 + flowLvl * 0.05));
        }
        
        return gain;
    }

    function doPrestige(state){
        const gain = calculatePrestigeGain(state);
        if(gain <= 0) return false;

        // Reset state but keep DM, Achievements, Stats, and Prestige Upgrades
        const newState = window.Game.State.defaultState();
        newState.darkMatter = (state.darkMatter || 0) + gain;
        newState.achievements = state.achievements;
        newState.stats = state.stats;
        newState.stats.resets = (state.stats.resets || 0) + 1;
        newState.prestigeUpgrades = state.prestigeUpgrades || {};
        
        // Apply "Time Warp" bonus (Start Energy)
        const warpLvl = getPrestigeUpgradeLevel(state, "timeWarp");
        if(warpLvl > 0){
             // 1000 * 5^lvl
             newState.energy = 1000 * Math.pow(5, warpLvl);
        }
        
        // Preserve settings
        newState.autoHold = state.autoHold;

        return newState;
    }

    return { 
        getUpgradeLevel, getPrestigeUpgradeLevel, 
        getCost, getNextCost, getNextPrestigeCost,
        getPerClick, getPerSec, getCritMultiplier, getTotalMultiplier,
        buyUpgrade, buyPrestigeUpgrade,
        calculatePrestigeGain, doPrestige
    };
})();
