window.Game = window.Game || {};

window.Game.PlanetCore = (function(){
    const Config = window.Game.PlanetConfig;

    function getUpgradeLevel(state, id){
        return state.upgrades[id] || 0;
    }

    // Generic helper to get currency amount
    function getCurrencyAmount(state, currencyId){
        if(currencyId === 'matter') return state.matter;
        return state.upgrades[currencyId] || 0;
    }

    function getCost(id, level){
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 999999999;
        if(def.freeFirst && level === 0) return 0;
        return Math.floor(def.baseCost * Math.pow(def.growth, level));
    }

    // Geometric Series for Bulk Cost
    function getBulkCost(id, level, count){
        if(count <= 0) return 0;
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 0;
        
        let effectiveLevel = level;
        let effectiveCount = count;
        
        // Handle free first level
        if(def.freeFirst && effectiveLevel === 0){
             effectiveCount--;
             effectiveLevel++;
             if(effectiveCount <= 0) return 0;
        }
        
        const startCost = def.baseCost * Math.pow(def.growth, effectiveLevel);
        
        if (def.growth === 1) return Math.floor(startCost * effectiveCount);
        
        const total = startCost * (Math.pow(def.growth, effectiveCount) - 1) / (def.growth - 1);
        return Math.floor(total);
    }
    
    function getMaxBuyable(id, level, stateLike){ 
        // stateLike can be state object or just a number (amount)
        // normalized to amount below
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 0;

        const currencyAmount = (typeof stateLike === 'number') ? stateLike : getCurrencyAmount(stateLike, def.currency);
        
        let effectiveLevel = level;
        let extraCount = 0;
        
        if(def.freeFirst && effectiveLevel === 0){
            extraCount = 1; 
            effectiveLevel++;
        }
        
        const startCost = def.baseCost * Math.pow(def.growth, effectiveLevel);
        if(startCost > currencyAmount) return extraCount; 
        
        if (def.growth === 1) return Math.floor(extraCount + currencyAmount / startCost);
        
        const term = 1 + (currencyAmount * (def.growth - 1) / startCost);
        const k = Math.log(term) / Math.log(def.growth);
        return Math.floor(extraCount + k);
    }

    function buyUpgrade(state, id, count = 1){
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return false;

        const level = getUpgradeLevel(state, id);
        const cost = getBulkCost(id, level, count);
        const currencyAmt = getCurrencyAmount(state, def.currency);
        
        if(currencyAmt >= cost){
            // Deduct
            if(def.currency === 'matter'){
                state.matter -= cost;
            } else {
                state.upgrades[def.currency] -= cost;
            }
            
            // Add
            state.upgrades[id] = level + count;
            return true;
        }
        return false;
    }

    // Returns production rates for display AND for the game loop to apply
    // This now needs to return a map: { matter: X, [upgradeId]: Y, ... }
    function getProduction(state){
        const flow = { matter: 0 };
        
        // Calculate from Top Tier down? Or just sum it up.
        // Tiers produce Independently based on their count.
        for(const u of Config.upgrades){
            const lvl = getUpgradeLevel(state, u.id);
            if(lvl > 0){
                const prod = u.effect(lvl);
                if(u.tier === 1){
                    flow.matter = (flow.matter || 0) + prod;
                } else {
                    // Produces previous tier
                    const prev = Config.upgrades.find(p => p.tier === u.tier - 1);
                    if(prev){
                         flow[prev.id] = (flow[prev.id] || 0) + prod;
                    }
                }
            }
        }
        return flow;
    }
    
    function getCurrentStage(state){
        let current = Config.stages[0];
        for(const s of Config.stages){
            if(state.totalMatter >= s.threshold){
                current = s;
            }
        }
        return current;
    }

    return { getUpgradeLevel, getCost, getBulkCost, getMaxBuyable, buyUpgrade, getProduction, getCurrentStage };

})();
