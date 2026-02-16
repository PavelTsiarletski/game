window.Game = window.Game || {};

window.Game.PlanetState = (function(){
    
    const defaultState = {
        matter: 0,
        totalMatter: 0,
        lastTick: Date.now(),
        upgrades: {
            // id: level
        }
    };

    function load(){
        const saved = localStorage.getItem("planetSave");
        if(saved){
            try {
                const parsed = JSON.parse(saved);
                return { ...defaultState, ...parsed, upgrades: { ...defaultState.upgrades, ...parsed.upgrades } };
            } catch(e){
                console.error("Save load failed", e);
            }
        }
        return JSON.parse(JSON.stringify(defaultState));
    }

    function save(state){
        localStorage.setItem("planetSave", JSON.stringify(state));
    }

    function reset(){
        if(confirm("Are you sure you want to wipe this planet?")){
             localStorage.removeItem("planetSave");
             window.location.reload();
        }
    }

    return { load, save, reset };
})();
