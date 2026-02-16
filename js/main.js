import { $ } from './utils.js';
import { loadState, saveState, resetState } from './state.js';
import { upgrades, achievements } from './config.js';
import { getPerClick, getPerSec, buyUpgrade, getUpgradeLevel, getNextCost, 
         multBonus, clickBonus, autoBonus, critChance } from './core.js';
import { ui, render, spawnPop, showToast, setOrbActive } from './ui.js';
import { fmt, clamp, now } from './utils.js';

// State
let state = loadState();

// Helper to manually trigger UI updates that need config data
function updateUI(){
    // Update simple stats
    ui.energy.textContent = fmt(state.energy);
    ui.perClick.textContent = fmt(getPerClick(state));
    ui.perSec.textContent = fmt(getPerSec(state));
    ui.mult.textContent = "x" + multBonus(getUpgradeLevel(state, "reactor")).toFixed(2);
    
    // Autohold toggle
    if(ui.chkAutoHold) ui.chkAutoHold.checked = state.autoHold;

    // Redraw shop
    // In a real app we'd diff, but here we just rebuild innerHTML or update text
    // The previous implementation rebuilt it. Let's do that for simplicity.
    const container = ui.shop;
    container.innerHTML = "";
    
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
        
        btn.onclick = () => {
             const bought = buyUpgrade(state, def.id, 1);
             if(bought) showToast("Куплено");
             else showToast("Не хватает энергии");
             updateUI();
        };

        right.appendChild(price);
        right.appendChild(btn);

        el.appendChild(left);
        el.appendChild(right);

        container.appendChild(el);
    }
}

// Actions
function doClick(cX, cY){
    let gain = getPerClick(state);
    const capLvl = getUpgradeLevel(state, "capacitor");
    const chance = critChance(capLvl);
    const isCrit = Math.random() < chance;
    if (isCrit) gain *= 3;

    gain = Math.floor(gain);
    state.energy += gain;
    state.totalEnergy += gain;
    
    if(!state.stats) state.stats = { clicks: 0 };
    state.stats.clicks++;

    spawnPop((isCrit ? "CRIT +" : "+") + fmt(gain), cX, cY);
    updateUI();
    checkAchievements();
}

// Achievements Logic
function checkAchievements(){
    let newUnlock = false;
    for(const ach of achievements){
        if(state.achievements.includes(ach.id)) continue;
        if(ach.condition(state)){
            state.achievements.push(ach.id);
            showToast(`🏆 Достижение: ${ach.name}`);
            newUnlock = true;
        }
    }
    // If we had a UI panel for achievements, we'd update it here
}

// Holding Logic
let holding = false;
let holdTimer = null;

function startHold(){
    if (holdTimer) return;
    const rateMs = 110; 
    setOrbActive(true);
    
    holdTimer = setInterval(() => {
        const r = ui.orb.getBoundingClientRect();
        doClick(r.left + r.width/2, r.top + r.height/2);
    }, rateMs);
}

function stopHold(){
    if (!state.autoHold && !holding) {
        clearInterval(holdTimer);
        holdTimer = null;
        setOrbActive(false);
    }
}

// Events
ui.orb.addEventListener("pointerdown", (e) => {
    ui.orb.setPointerCapture(e.pointerId);
    doClick(e.clientX, e.clientY);
    holding = true;
    startHold();
});

window.addEventListener("pointerup", () => {
    holding = false;
    stopHold();
});

if(ui.chkAutoHold){
    ui.chkAutoHold.addEventListener("change", (e) => {
        state.autoHold = e.target.checked;
        if (state.autoHold) startHold();
        else stopHold();
        saveState(state);
    });
}

ui.btnSave.addEventListener("click", () => {
    saveState(state);
    showToast("Сохранено");
});

ui.btnReset.addEventListener("click", () => {
    if(!confirm("Сброс?")) return;
    state = resetState();
    updateUI();
    showToast("Сброшено");
});

ui.btnBuyMax.addEventListener("click", () => {
    let boughtAny = false;
    for (let pass = 0; pass < 12; pass++){
        let boughtThisPass = false;
        for (const def of upgrades){
            const cost = getNextCost(state, def.id);
            if (state.energy >= cost){
                buyUpgrade(state, def.id, 1);
                boughtThisPass = true;
                boughtAny = true;
            }
        }
        if (!boughtThisPass) break;
    }
    if (!boughtAny) showToast("Нечего купить");
    updateUI();
});

// Ticking
setInterval(() => {
    const t = now();
    const dtMs = clamp(t - state.lastTick, 0, 1000 * 60 * 60 * 6);
    const dt = dtMs / 1000;
    
    const income = getPerSec(state) * dt;
    if(income > 0){
        const add = Math.floor(income);
        if(add > 0){
            state.energy += add;
            state.totalEnergy += add;
        }
    }
    
    state.lastTick = t;
    updateUI();
    checkAchievements();
}, 250);

// Autosave
setInterval(() => saveState(state), 5000);

// Init
if(state.autoHold) startHold();

// Starfield (keep local to main or extract? Let's keep distinct)
const canvas = $("stars");
const ctx = canvas.getContext("2d");
let W=0,H=0,dpr=1;
let stars = [];

function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth * dpr);
    H = Math.floor(window.innerHeight * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const count = Math.floor((window.innerWidth * window.innerHeight) / 14000);
    stars = Array.from({length: clamp(count, 60, 240)}, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 1 + 0.2,
        r: Math.random() * 1.6 + 0.2,
        tw: Math.random() * Math.PI * 2
    }));
}

function drawStars(){
    ctx.clearRect(0,0,W,H);
    const g = ctx.createRadialGradient(W*0.5,H*0.45, Math.min(W,H)*0.05, W*0.5,H*0.5, Math.min(W,H)*0.85);
    g.addColorStop(0, "rgba(255,255,255,0.02)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    for (const s of stars){
        s.tw += 0.02 * s.z;
        const a = 0.35 + Math.sin(s.tw) * 0.18;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.z * dpr, 0, Math.PI*2);
        ctx.fillStyle = "rgba(233,236,255,1)";
        ctx.fill();

        s.y += 0.12 * s.z * dpr;
        if (s.y > H + 10) { s.y = -10; s.x = Math.random() * W; }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawStars);
}

window.addEventListener("resize", resize);
resize();
drawStars();

// Initial render
updateUI();
checkAchievements(); // check immediate unlocks (e.g. from loaded state)
