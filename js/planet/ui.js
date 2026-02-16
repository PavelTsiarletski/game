window.Game = window.Game || {};

window.Game.PlanetUI = (function(){
    const { load, save, reset } = window.Game.PlanetState;
    const { getProduction, buyUpgrade, getUpgradeLevel, getCost, getCurrentStage } = window.Game.PlanetCore;
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
        toast: document.getElementById("toast")
    };

    let state = load();

    function init(){
        Renderer.init(ui.planetCanvas);
        
        // Listeners
        // ui.planetCanvas.addEventListener("click", onPlanetClick); // Removed manual click
        
        ui.btnSave.addEventListener("click", () => {
             save(state);
             showToast("Saved!");
        });
        ui.btnReset.addEventListener("click", () => reset());
        
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
        ui.shop.innerHTML = "";
        const fmt = window.Game.Utils ? window.Game.Utils.fmt : (n) => n.toFixed(0);
        
        for(const u of upgrades){
            const lvl = getUpgradeLevel(state, u.id);
            const cost = getCost(u.id, lvl);
            const canBuy = state.matter >= cost;
            
            // Create a large button card
            const btn = document.createElement("button");
            btn.className = `shop-card-large ${canBuy ? '' : 'disabled'}`;
            btn.disabled = !canBuy;
            
            // Content
            btn.innerHTML = `
                <div class="card-title-row">
                    <span class="name">${u.name}</span>
                    <span class="lvl">Lvl ${lvl}</span>
                </div>
                <div class="card-desc">${u.desc}</div>
                <div class="card-footer">
                    <span class="bonus">+${fmt(u.effect(lvl))}/s</span>
                    <span class="price">${cost === 0 ? 'FREE' : fmt(cost)}</span>
                </div>
            `;
            
            btn.onclick = () => {
                if(buyUpgrade(state, u.id)){
                    // Visual feedback
                    btn.classList.add("bought");
                    setTimeout(()=>btn.classList.remove("bought"), 100);
                    renderShop(); 
                }
            };
            
            ui.shop.appendChild(btn);
        }
    }

    function showToast(msg){
        ui.toast.textContent = msg;
        ui.toast.className = "toast show";
        setTimeout(() => ui.toast.className = "toast", 2000);
    }

    return { init };
})();
