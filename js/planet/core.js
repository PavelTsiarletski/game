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

    function buyUpgrade(state, id){
        const level = getUpgradeLevel(state, id);
        const cost = getCost(id, level);
        if(state.matter >= cost){
            state.matter -= cost;
            state.upgrades[id] = level + 1;
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

    return { getUpgradeLevel, getCost, buyUpgrade, getProduction, getCurrentStage };

})();
