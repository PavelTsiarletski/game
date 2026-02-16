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
        setInterval(() => save(state), 10000);
        
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
        
        const flow = getProduction(state);
        
        // Apply Flow
        if(flow.matter > 0){
            state.matter += flow.matter * dt;
            state.totalMatter += flow.matter * dt;
        }
        
        // Apply flow to upgrades
        for(const key in flow){
            if(key !== 'matter' && flow[key] > 0){
                state.upgrades[key] = (state.upgrades[key] || 0) + flow[key] * dt;
            }
        }

        updateUI();
        Renderer.draw(state, getCurrentStage(state));
        
        requestAnimationFrame(loop);
    }
    
    // function onPlanetClick(e){ ... } // Removed
    
    function updateUI(){
        // Use global Utils.fmt if available, or fallback
        const fmt = window.Game.Utils ? window.Game.Utils.fmt : (n) => n.toFixed(0);
        
        const flow = getProduction(state);
        ui.matter.textContent = fmt(state.matter);
        ui.perSec.textContent = fmt(flow.matter || 0) + "/s";
        
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
            
            // Get user's wallet amount for this currency
            const wallet = (u.currency === 'matter') ? state.matter : (state.upgrades[u.currency] || 0);
            
            // Determine how many we are trying to buy
            let count = 1;
            let cost = 0;
            
            if(buyAmount === "max"){
                 const max = getMaxBuyable(u.id, lvl, wallet);
                 count = Math.max(1, max); 
                 cost = getBulkCost(u.id, lvl, count);
            } else {
                 count = buyAmount;
                 cost = getBulkCost(u.id, lvl, count);
            }

            const canBuy = wallet >= cost;
            
            if(buyAmount === 'max' && cost === 0){
                 count = 1;
                 cost = getBulkCost(u.id, lvl, 1);
            }

            let btn = document.getElementById(`btn-upg-${u.id}`);
            
            if(!btn){
                // Create new
                btn = document.createElement("button");
                btn.id = `btn-upg-${u.id}`;
                btn.className = `shop-card-large`;
                
                btn.onclick = () => {
                     const clickLvl = getUpgradeLevel(state, u.id);
                     const clickWallet = (u.currency === 'matter') ? state.matter : (state.upgrades[u.currency] || 0); // Need realtime check
                     let clickCount = 1;
                     
                     if(buyAmount === "max"){
                         clickCount = Math.max(1, getMaxBuyable(u.id, clickLvl, clickWallet));
                     } else {
                         clickCount = buyAmount;
                     }
                     
                    if(buyUpgrade(state, u.id, clickCount)){
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

            // Display Currency Name
            let costName = "Matter";
            if(u.currency !== "matter"){
                const prev = upgrades.find(p => p.id === u.currency);
                costName = prev ? prev.name : u.currency;
            }
            
            // Effect Description
            let effectDesc = "+Matter";
            if(u.tier > 1){
                 const produces = upgrades.find(p => p.tier === u.tier-1);
                 effectDesc = produces ? `+${produces.name}` : "";
            }

            // Effect diff
            const currentEffect = u.effect(lvl);
            const newEffect = u.effect(lvl + count);
            const diff = newEffect - currentEffect;
            
            // Shorten names if needed or use icons? For now just text.
            
            const html = `
                <div class="card-title-row">
                    <span class="name">${u.name}</span>
                    <span class="lvl">Lvl ${fmt(lvl)}</span>
                </div>
                <div class="card-desc">${u.desc}</div>
                <div class="card-footer" style="flex-direction:column; align-items:flex-end; gap:2px;">
                    <div class="bonus" style="font-size:0.85em; color:#fab1a0">
                        +${fmt(diff)} ${effectDesc.replace('+','')} /s 
                        ${count > 1 ? `<span style="opacity:0.7">(x${count})</span>` : ''}
                    </div>
                    <div class="price" style="color: ${canBuy ? '#fff' : '#ff7675'}">
                        ${cost === 0 && lvl===0 ? 'FREE' : fmt(cost) + ' ' + (costName === 'Matter' ? 'Matter' : 'Items')}
                    </div>
                     ${costName !== 'Matter' ? `<div style="font-size:0.7em; opacity:0.6">Uses: ${costName}</div>` : ''}
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
