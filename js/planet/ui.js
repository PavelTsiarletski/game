window.Game = window.Game || {};

window.Game.PlanetUI = (function(){
    const { load, save, reset } = window.Game.PlanetState;
    const { getProduction, buyUpgrade, getUpgradeLevel, getCost, getBulkCost, getMaxBuyable, getCurrentStage } = window.Game.PlanetCore;
    const { upgrades } = window.Game.PlanetConfig;
    const Renderer = window.Game.PlanetRenderer;

    const ui = {
        matter: document.getElementById("matter"),
        perSec: document.getElementById("perSec"),
        shop: document.getElementById("shop"),
        stageBadge: document.getElementById("stageBadge"),
        planetCanvas: document.getElementById("planet-render"),
        btnSave: document.getElementById("btnSave"),
        btnReset: document.getElementById("btnReset"),
        toast: document.getElementById("toast"),
        
        // Multipliers
        btnX1: document.getElementById("btn-x1"),
        btnX10: document.getElementById("btn-x10"),
        btnMax: document.getElementById("btn-max")
    };

    let state = load();
    let buyAmount = 1; // 1, 10, or "max"

    function init(){
        Renderer.init(ui.planetCanvas);
        
        // Listeners
        // ui.planetCanvas.addEventListener("click", onPlanetClick); // Removed manual click
        
        ui.btnSave.addEventListener("click", () => {
             save(state);
             showToast("Saved!");
        });
        ui.btnReset.addEventListener("click", () => reset());
        
        // Multiplier Toggles
        const setMult = (amt, btn) => {
            buyAmount = amt;
            // updating classes
            ui.btnX1.className = "btn-small";
            ui.btnX10.className = "btn-small";
            ui.btnMax.className = "btn-small";
            btn.className = "btn-small active";
            renderShop();
        };
        
        ui.btnX1.addEventListener("click", () => setMult(1, ui.btnX1));
        ui.btnX10.addEventListener("click", () => setMult(10, ui.btnX10));
        ui.btnMax.addEventListener("click", () => setMult("max", ui.btnMax));
        
        // Auto-Save
        setInterval(() => save(state), 30000);
        
        // Game Loop
        requestAnimationFrame(loop);
        
        renderShop();
        updateUI();
    }
    
    let lastTime = Date.now();
    function loop(){
        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        
        const prod = getProduction(state);
        // Only auto production
        if(prod.auto > 0){
             state.matter += prod.auto * dt;
             state.totalMatter += prod.auto * dt;
        }

        updateUI();
        Renderer.draw(state, getCurrentStage(state));
        
        requestAnimationFrame(loop);
    }
    
    // function onPlanetClick(e){ ... } // Removed
    
    function updateUI(){
        // Use global Utils.fmt if available, or fallback
        const fmt = window.Game.Utils ? window.Game.Utils.fmt : (n) => n.toFixed(0);
        
        ui.matter.textContent = fmt(state.matter);
        ui.perSec.textContent = fmt(getProduction(state).auto) + "/s";
        
        const stage = getCurrentStage(state);
        ui.stageBadge.textContent = `Stage: ${stage.name}`;
        ui.stageBadge.style.backgroundColor = stage.color;
        
        // Check shop buttons
        renderShop(); 
    }
    
    function renderShop(){
        const fmt = window.Game.Utils ? window.Game.Utils.fmt : (n) => n.toFixed(0);
        
        for(const u of upgrades){
            const lvl = getUpgradeLevel(state, u.id);
            
            // Determine how many we are trying to buy
            let count = 1;
            let cost = 0;
            
            if(buyAmount === "max"){
                 const max = getMaxBuyable(u.id, lvl, state.matter);
                 count = Math.max(1, max); // Always show at least next 1 cost if max is 0
                 cost = getBulkCost(u.id, lvl, count);
            } else {
                 count = buyAmount;
                 cost = getBulkCost(u.id, lvl, count);
            }

            const canBuy = state.matter >= cost;
            
            // Special case for Max: if we can't afford even 1, cost handles it but let's be clean
            // actually logic is: if max=0, we show cost for 1 but disable it
            if(buyAmount === 'max' && cost === 0){
                 // We can't afford any. Show cost for 1.
                 count = 1;
                 cost = getBulkCost(u.id, lvl, 1);
            }

            let btn = document.getElementById(`btn-upg-${u.id}`);
            
            if(!btn){
                // Create new
                btn = document.createElement("button");
                btn.id = `btn-upg-${u.id}`;
                btn.className = `shop-card-large`;
                
                // Static connection (only needs to happen once)
                btn.onclick = () => {
                     // Re-calculate count at click time to be safe/consistent
                     const clickLvl = getUpgradeLevel(state, u.id);
                     let clickCount = 1;
                     if(buyAmount === "max"){
                         clickCount = Math.max(1, getMaxBuyable(u.id, clickLvl, state.matter));
                     } else {
                         clickCount = buyAmount;
                     }
                     
                    if(buyUpgrade(state, u.id, clickCount)){
                        // Visual feedback
                        btn.classList.add("bought");
                        setTimeout(()=>btn.classList.remove("bought"), 100);
                        renderShop(); 
                    }
                };
                
                ui.shop.appendChild(btn);
            }
            
            // Update State/Content
            const currentClass = `shop-card-large ${canBuy ? '' : 'disabled'}`;
            if(btn.className !== currentClass) btn.className = currentClass;
            btn.disabled = !canBuy;

            // Efficient innerHTML update (or we could update specific spans for more speed)
            // For now, full innerHTML is fine as long as the ELEMENT itself isn't replaced.
            
            // Effect diff
            const currentEffect = u.effect(lvl);
            const newEffect = u.effect(lvl + count);
            const diff = newEffect - currentEffect;
            
            const html = `
                <div class="card-title-row">
                    <span class="name">${u.name}</span>
                    <span class="lvl">Lvl ${lvl}</span>
                </div>
                <div class="card-desc">${u.desc}</div>
                <div class="card-footer">
                    <span class="bonus">+${fmt(diff)}/s <span style="font-size:0.8em; opacity:0.7">(x${count})</span></span>
                    <span class="price">${cost === 0 && lvl===0 ? 'FREE' : fmt(cost)}</span>
                </div>
            `;
            
            if(btn.innerHTML !== html) btn.innerHTML = html;
        }
    }

    function showToast(msg){
        ui.toast.textContent = msg;
        ui.toast.className = "toast show";
        setTimeout(() => ui.toast.className = "toast", 2000);
    }

    return { init };
})();
