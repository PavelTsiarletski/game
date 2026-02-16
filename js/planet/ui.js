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
        ui.planetCanvas.addEventListener("click", onPlanetClick);
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
        if(prod.auto > 0){
             state.matter += prod.auto * dt;
             state.totalMatter += prod.auto * dt;
        }

        updateUI();
        Renderer.draw(state, getCurrentStage(state));
        
        requestAnimationFrame(loop);
    }
    
    function onPlanetClick(e){
        // Get Click Power
        const prod = getProduction(state);
        state.matter += prod.click;
        state.totalMatter += prod.click;
        
        // Determine position: e.clientX/Y are global, we might want relative to canvas
        // But the canvas is centered, so global is fine for fixed-position overlay?
        // Actually, let's just append absolute divs to body or a wrapper
        const rect = ui.planetCanvas.getBoundingClientRect();
        // Randomize slightly around center or click pos
        // visual pos:
        const x = e.clientX || (rect.left + rect.width/2);
        const y = e.clientY || (rect.top + rect.height/2);

        createFloatingText(x, y, `+${Math.floor(prod.click)}`);
        
        updateUI();
    }
    
    function createFloatingText(x, y, text){
        const el = document.createElement("div");
        el.textContent = text;
        el.style.position = "fixed";
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.color = "#fff";
        el.style.fontWeight = "bold";
        el.style.fontSize = "16px";
        el.style.pointerEvents = "none";
        el.style.userSelect = "none";
        el.style.textShadow = "0 2px 4px rgba(0,0,0,0.5)";
        el.style.transition = "transform 1s ease-out, opacity 1s ease-out";
        el.style.zIndex = "100";
        
        document.body.appendChild(el);
        
        // Animate
        requestAnimationFrame(() => {
            el.style.transform = `translate(-50%, -100px)`; // Move up
            el.style.opacity = "0";
        });
        
        // Remove
        setTimeout(() => {
            if(el.parentNode) el.parentNode.removeChild(el);
        }, 1000);
    }
    
    function updateUI(){
        ui.matter.textContent = Math.floor(state.matter).toLocaleString();
        ui.perSec.textContent = getProduction(state).auto.toFixed(1);
        
        const stage = getCurrentStage(state);
        ui.stageBadge.textContent = `Stage: ${stage.name}`;
        ui.stageBadge.style.backgroundColor = stage.color;
        
        // Check shop buttons
        renderShop(); // Refresh buttons state
    }
    
    function renderShop(){
        // Simple rebuild for now, optimization later if needed
        ui.shop.innerHTML = "";
        
        for(const u of upgrades){
            const lvl = getUpgradeLevel(state, u.id);
            const cost = getCost(u.id, lvl);
            const canBuy = state.matter >= cost;
            
            const item = document.createElement("div");
            item.className = "shop-item";
            item.innerHTML = `
                <div class="left">
                    <span class="name">${u.name}</span>
                    <span class="desc">${u.desc}</span>
                    <span class="meta">Lvl ${lvl} • Bonus: ${u.type === 'click' ? '+' : ''}${u.effect(lvl).toFixed(1)}</span>
                </div>
                <div class="right">
                    <div class="price">${cost.toLocaleString()}</div>
                    <button class="btn ${canBuy ? '' : 'disabled'}" ${!canBuy ? 'disabled' : ''}>Buy</button>
                </div>
            `;
            
            const btn = item.querySelector("button");
            btn.onclick = () => {
                if(buyUpgrade(state, u.id)){
                    renderShop(); // Update costs
                }
            };
            
            ui.shop.appendChild(item);
        }
    }

    function showToast(msg){
        ui.toast.textContent = msg;
        ui.toast.className = "toast show";
        setTimeout(() => ui.toast.className = "toast", 2000);
    }

    return { init };
})();
