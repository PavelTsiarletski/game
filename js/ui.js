import { $ } from './utils.js';
import { upgrades, achievements } from './config.js';
import { getUpgradeLevel, getNextCost, getPerClick, getPerSec, buyUpgrade } from './core.js';
import { fmt } from './utils.js';

const ui = {
  energy: $("energy"),
  perClick: $("perClick"),
  perSec: $("perSec"),
  mult: $("mult"),
  orb: $("orb"),
  shop: $("shop"),
  toast: $("toast"),
  btnSave: $("btnSave"),
  btnReset: $("btnReset"),
  btnBuyMax: $("btnBuyMax"),
  chkAutoHold: $("chkAutoHold"),
  achievementsPanel: $("achievementsPanel") // New
};

let _toastTimeout;
export function showToast(text){
  ui.toast.textContent = text;
  ui.toast.classList.add("show");
  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => ui.toast.classList.remove("show"), 1200);
}

export function spawnPop(text, x, y){
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

export function render(state){
  // Core stats
  ui.energy.textContent = fmt(state.energy);
  ui.perClick.textContent = fmt(getPerClick(state));
  ui.perSec.textContent = fmt(getPerSec(state));
  
  // Need to import multBonus or just calculate it from reactor level manually if not exported
  // We'll trust that the UI update loop calls this often enough.
  // Ideally render shouldn't calculate, but for simplicity:
  const reactorLvl = state.upgrades["reactor"] || 0;
  // A bit of duplication here with config.js unless we import multBonus
  // We will assume implementation in core.js exposed needed values or we import them
  // For now let's just use what we have available.
}

export function renderShop(state, onBuy){
  ui.shop.innerHTML = "";
  for (const def of upgrades){
    const lvl = getUpgradeLevel(state, def.id);
    const next = getNextCost(state, def.id);

    const el = document.createElement("div");
    el.className = "item";

    const left = document.createElement("div");
    left.className = "left";

    const name = document.createElement("div");
    name.className = "name";
    name.innerHTML = `${def.name} <span class="badge">${def.badge}</span>`;

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = def.desc;

    const meta = document.createElement("div");
    meta.className = "meta";
    // We need effectText. It's in the definition.
    meta.textContent = `Ур.: ${lvl} • ${def.effectText(lvl)}`;

    left.appendChild(name);
    left.appendChild(desc);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "right";

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `Цена: ${fmt(next)} энергии`;

    const btn = document.createElement("button");
    btn.textContent = "Купить";
    btn.className = "btn-accent";
    btn.disabled = state.energy < next;
    btn.addEventListener("click", () => {
      onBuy(def.id);
    });

    right.appendChild(price);
    right.appendChild(btn);

    el.appendChild(left);
    el.appendChild(right);

    ui.shop.appendChild(el);
  }
}

// Achievements UI
export function renderAchievements(state){
    if(!ui.achievementsPanel) return;
    
    // Simple render: unlocked ones are bright, locked are dim/hidden
    // For this pass we'll just clear and rebuild or update classes
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
        
        // Icon/Name
        const title = document.createElement("div");
        title.className = "ach-title";
        title.textContent = ach.name;
        
        const desc = document.createElement("div");
        desc.className = "ach-desc";
        desc.textContent = ach.desc; // Keep it secret if we want, but for now show it
        
        el.appendChild(title);
        el.appendChild(desc);
        
        ui.achievementsPanel.appendChild(el);
    }
}

export function bindEvents(handlers){
    ui.orb.addEventListener("pointerdown", (e) => {
        ui.orb.setPointerCapture(e.pointerId);
        handlers.onClick(e.clientX, e.clientY);
    });
    
    // Autohold toggle
    if(ui.chkAutoHold){
        ui.chkAutoHold.addEventListener("change", (e) => {
            handlers.onToggleAutoHold(e.target.checked);
        });
    }

    ui.btnSave.addEventListener("click", handlers.onSave);
    ui.btnReset.addEventListener("click", handlers.onReset);
    ui.btnBuyMax.addEventListener("click", handlers.onBuyMax);
}

// Helpers for orb animation
export function setOrbActive(active){
    const orb = ui.orb;
    if(active) orb.classList.add("active-hold");
    else orb.classList.remove("active-hold");
}

export { ui }; // export raw elements if needed
