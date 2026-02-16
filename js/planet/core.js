window.Game = window.Game || {};

window.Game.PlanetCore = (function(){
    const Config = window.Game.PlanetConfig;

    function getUpgradeLevel(state, id){
        return state.upgrades[id] || 0;
    }

    function getCost(id, level){
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 999999999;
        if(def.freeFirst && level === 0) return 0;
        return Math.floor(def.baseCost * Math.pow(def.growth, level));
    }

    // Geometric Series Sum: Cost * (1 - growth^k) / (1 - growth)
    function getBulkCost(id, level, count){
        if(count <= 0) return 0;
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 0;
        
        let effectiveLevel = level;
        let effectiveCount = count;
        let costSoFar = 0;

        // Handle free first level
        if(def.freeFirst && effectiveLevel === 0){
             effectiveCount--;
             effectiveLevel++;
             // costSoFar += 0;
             if(effectiveCount <= 0) return 0;
        }
        
        // Initial cost at current level
        const startCost = def.baseCost * Math.pow(def.growth, effectiveLevel);
        
        if (def.growth === 1) return Math.floor(costSoFar + startCost * effectiveCount);
        
        const total = startCost * (Math.pow(def.growth, effectiveCount) - 1) / (def.growth - 1);
        return Math.floor(costSoFar + total);
    }
    
    // Inverse Geometric Series
    function getMaxBuyable(id, level, matter){
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 0;
        
        let effectiveLevel = level;
        let extraCount = 0;
        
        if(def.freeFirst && effectiveLevel === 0){
            extraCount = 1; // Can definitely buy the free one
            effectiveLevel++;
            // cost is 0, matter unchanged
        }
        
        const startCost = def.baseCost * Math.pow(def.growth, effectiveLevel);
        if(startCost > matter) return extraCount; // Can only buy the free one (if applicable) and no more
        
        if (def.growth === 1) return Math.floor(extraCount + matter / startCost);
        
        const term = 1 + (matter * (def.growth - 1) / startCost);
        const k = Math.log(term) / Math.log(def.growth);
        return Math.floor(extraCount + k);
    }

    function buyUpgrade(state, id, count = 1){
        const level = getUpgradeLevel(state, id);
        const cost = getBulkCost(id, level, count);
        
        if(state.matter >= cost){
            state.matter -= cost;
            state.upgrades[id] = level + count;
            return true;
        }
        return false;
    }

    function getProduction(state){
        let auto = 0;
        let click = 1; // Base click

        for(const u of Config.upgrades){
            const lvl = getUpgradeLevel(state, u.id);
            if(lvl > 0){
                if(u.type === 'auto'){
                    auto += u.effect(lvl);
                } else if(u.type === 'click'){
                    click += u.effect(lvl) - 1; // -1 because base is 1
                }
            }
        }
        return { auto, click };
    }
    
    function getCurrentStage(state){
        // Find highest unlocked stage
        // Config.stages is ordered low to high
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
