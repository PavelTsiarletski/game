window.Game = window.Game || {};

window.Game.UI = (function(){
    const { $ } = window.Game.Utils;
    const { upgrades, achievements } = window.Game.Config;
    const { getUpgradeLevel, getNextCost, getPerClick, getPerSec, calculatePrestigeGain } = window.Game.Core; // Accessing Game.Core after load? No, factory runs immediately. We'll access dynamically or ensuring order.
    // Actually, Core is defined before UI in index.html, so window.Game.Core should be available if we run this IIFE immediately? 
    // Yes, if scripts are ordered. But to be safe, we can access them inside functions.
    const { fmt } = window.Game.Utils;

    const ui = {
        energy: $("energy"),
        perClick: $("perClick"),
        perSec: $("perSec"),
        mult: $("mult"),
        orb: $("orb"),
        shop: $("shop"),
        toast: $("toast"),
        btnSave: $("btnSave"),
        btnReset: $("btnReset"), // This will be dynamic (Reset vs Prestige)
        btnBuyMax: $("btnBuyMax"),
        chkAutoHold: $("chkAutoHold"),
        achievementsPanel: $("achievementsPanel"),
        prestigeShop: $("prestigeShop")
    };

    let _toastTimeout;
    function showToast(text){
        ui.toast.textContent = text;
        ui.toast.classList.add("show");
        clearTimeout(_toastTimeout);
        _toastTimeout = setTimeout(() => ui.toast.classList.remove("show"), 1200);
    }

    function spawnPop(text, x, y){
        const el = document.createElement("div");
        el.className = "pop";
        el.textContent = text;
        document.body.appendChild(el);
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.animate([
            { transform:"translate(-50%,-50%) translateY(10px)", opacity:0 },
            { transform:"translate(-50%,-50%) translateY(-10px)", opacity:1, offset:0.25 },
            { transform:"translate(-50%,-50%) translateY(-38px)", opacity:0 }
        ], { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)" });
        setTimeout(() => el.remove(), 700);
    }

    function render(state){
        const Core = window.Game.Core;
        const Config = window.Game.Config;

        ui.energy.textContent = fmt(state.energy);
        ui.perClick.textContent = fmt(Core.getPerClick(state));
        ui.perSec.textContent = fmt(Core.getPerSec(state));
        
        // Mult display
        const mult = Core.getTotalMultiplier(state);
        ui.mult.textContent = "x" + mult.toFixed(2);
        
        // Prestige Button State
        const possibleGain = Core.calculatePrestigeGain(state);
        if(possibleGain > 0){
            ui.btnReset.textContent = `Prestige (+${fmt(possibleGain)} DM)`;
            ui.btnReset.classList.add("btn-prestige"); // Need CSS for this
            ui.btnReset.classList.remove("btn-danger");
            ui.btnReset.title = "Сбросить прогресс ради Темной Материи (+10% бонус за шт.)";
        } else {
            ui.btnReset.textContent = "Reset";
            ui.btnReset.classList.remove("btn-prestige");
            ui.btnReset.classList.add("btn-danger");
            ui.btnReset.title = "Сбросить прогресс (Hard Reset)";
        }
    }

    function createShopItem(name, badge, desc, meta, priceText, canBuy, onBuy, isPrestige = false){
        const el = document.createElement("div");
        el.className = isPrestige ? "item item-prestige" : "item";

        const left = document.createElement("div");
        left.className = "left";

        const nameEl = document.createElement("div");
        nameEl.className = "name";
        nameEl.innerHTML = `${name} <span class="badge" style="${isPrestige ? 'background:rgba(124,92,255,.3)' : ''}">${badge}</span>`;

        const descEl = document.createElement("div");
        descEl.className = "desc";
        descEl.textContent = desc;

        const metaEl = document.createElement("div");
        metaEl.className = "meta";
        metaEl.textContent = meta;

        left.appendChild(nameEl);
        left.appendChild(descEl);
        left.appendChild(metaEl);

        const right = document.createElement("div");
        right.className = "right";

        const priceEl = document.createElement("div");
        priceEl.className = "price";
        priceEl.textContent = priceText;

        const btn = document.createElement("button");
        btn.textContent = "Купить";
        btn.className = isPrestige ? "btn-prestige-buy" : "btn-accent";
        btn.disabled = !canBuy;
        btn.onclick = onBuy;

        right.appendChild(priceEl);
        right.appendChild(btn);

        el.appendChild(left);
        el.appendChild(right);
        
        return el;
    }

    function renderShop(state, onBuy){
        const Core = window.Game.Core;
        ui.shop.innerHTML = "";
        for (const def of upgrades){
            const lvl = Core.getUpgradeLevel(state, def.id);
            const next = Core.getNextCost(state, def.id);
            const canBuy = state.energy >= next;

            const el = createShopItem(
                def.name, def.badge, def.desc, 
                `Ур.: ${lvl} • ${def.effectText(lvl)}`,
                `Цена: ${fmt(next)}`,
                canBuy,
                () => onBuy(def.id)
            );
            ui.shop.appendChild(el);
        }
    }

    function renderPrestigeShop(state, onBuy){
        if(!ui.prestigeShop) return;
        
        // Only show if we have DM or have reset once
        if(!state.stats.resets && state.darkMatter <= 0){
             ui.prestigeShop.parentElement.style.display = "none";
             return;
        }
        ui.prestigeShop.parentElement.style.display = "flex"; // Ensure container is visible
        ui.prestigeShop.innerHTML = "";

        const { prestigeUpgrades } = window.Game.Config;
        const Core = window.Game.Core;

        for(const def of prestigeUpgrades){
             const lvl = Core.getPrestigeUpgradeLevel(state, def.id);
             const next = Core.getNextPrestigeCost(state, def.id);
             const maxed = def.maxLevel && lvl >= def.maxLevel;
             const canBuy = !maxed && state.darkMatter >= next;
             
             const priceText = maxed ? "MAX" : `${fmt(next)} ТМ`;
             
             const el = createShopItem(
                 def.name, "PRESTIGE", def.desc,
                 `Ур.: ${lvl}${def.maxLevel ? '/'+def.maxLevel : ''} • ${def.effectText(lvl)}`,
                 priceText,
                 canBuy,
                 () => onBuy(def.id),
                 true
             );
             ui.prestigeShop.appendChild(el);
        }
    }

    function renderAchievements(state){
        if(!ui.achievementsPanel) return;
        ui.achievementsPanel.innerHTML = "";
        
        // Sort: Unlocked first
        const sorted = [...achievements].sort((a,b) => {
            const hasA = state.achievements.includes(a.id);
            const hasB = state.achievements.includes(b.id);
            return (hasA === hasB) ? 0 : hasA ? -1 : 1;
        });

        for(const ach of sorted){
            const unlocked = state.achievements.includes(ach.id);
            const el = document.createElement("div");
            el.className = `achievement ${unlocked ? 'unlocked' : 'locked'}`;
            
            const title = document.createElement("div");
            title.className = "ach-title";
            title.textContent = ach.name;
            
            const desc = document.createElement("div");
            desc.className = "ach-desc";
            desc.textContent = ach.desc;
            
            el.appendChild(title);
            el.appendChild(desc);
            
            ui.achievementsPanel.appendChild(el);
        }
    }

    function setOrbActive(active){
        const orb = ui.orb;
        if(active) orb.classList.add("active-hold");
        else orb.classList.remove("active-hold");
    }
    
    // Golden Orb
    function spawnGoldenOrb(onClick){
        const el = document.createElement("div");
        el.className = "golden-orb";
        // Random pos
        const x = 10 + Math.random() * 80;
        const y = 10 + Math.random() * 80;
        el.style.left = x + "%";
        el.style.top = y + "%";
        
        el.addEventListener("click", (e) => {
            e.stopPropagation(); // prevent clicking through to something else? 
            spawnPop("GOLDEN!", e.clientX, e.clientY);
            onClick();
            el.remove();
        });
        
        document.body.appendChild(el);
        
        setTimeout(() => {
            if(el.parentElement) el.remove();
        }, 5000); // 5 sec lifetime
    }

    return { 
        ui, showToast, spawnPop, 
        render, renderShop, renderPrestigeShop, renderAchievements, 
        setOrbActive, spawnGoldenOrb
    };
})();
