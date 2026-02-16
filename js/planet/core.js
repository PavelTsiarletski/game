window.Game = window.Game || {};

window.Game.PlanetCore = (function(){
    const Config = window.Game.PlanetConfig;

    function getUpgradeLevel(state, id){
        return state.upgrades[id] || 0;
    }

    function getCost(id, level){
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 999999999;
        return Math.floor(def.baseCost * Math.pow(def.growth, level));
    }

    // Geometric Series Sum: Cost * (1 - growth^k) / (1 - growth)
    function getBulkCost(id, level, count){
        if(count <= 0) return 0;
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 0;
        
        // Initial cost at current level
        const startCost = def.baseCost * Math.pow(def.growth, level);
        
        if (def.growth === 1) return Math.floor(startCost * count);
        
        const total = startCost * (Math.pow(def.growth, count) - 1) / (def.growth - 1);
        return Math.floor(total);
    }
    
    // Inverse Geometric Series
    function getMaxBuyable(id, level, matter){
        const def = Config.upgrades.find(u => u.id === id);
        if(!def) return 0;
        
        const startCost = def.baseCost * Math.pow(def.growth, level);
        if(startCost > matter) return 0;
        
        if (def.growth === 1) return Math.floor(matter / startCost);
        
        // matter = startCost * (growth^k - 1) / (growth - 1)
        // matter * (growth - 1) / startCost = growth^k - 1
        // k = log_growth ( 1 + matter * (growth - 1) / startCost )
        
        const term = 1 + (matter * (def.growth - 1) / startCost);
        const k = Math.log(term) / Math.log(def.growth);
        return Math.floor(k);
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
