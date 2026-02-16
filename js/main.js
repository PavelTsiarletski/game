window.Game = window.Game || {};

window.Game.Main = (function(){
    const { $ } = window.Game.Utils;
    const { loadState, saveState, resetState } = window.Game.State; // resetState is handled specially now
    const { upgrades, achievements } = window.Game.Config;
    const { getPerClick, getPerSec, buyUpgrade, buyPrestigeUpgrade, getUpgradeLevel, getNextCost, getCritMultiplier, doPrestige, calculatePrestigeGain } = window.Game.Core;
    const { ui, render, renderShop, renderPrestigeShop, renderAchievements, spawnPop, showToast, setOrbActive, spawnGoldenOrb } = window.Game.UI;
    const { fmt, clamp, now } = window.Game.Utils;

    let state = loadState();

    function updateUI(){
        render(state);
        
        // Autohold toggle
        if(ui.chkAutoHold) ui.chkAutoHold.checked = state.autoHold;

        // Render Normal Shop
        renderShop(state, (id) => {
            try {
                 const bought = buyUpgrade(state, id, 1);
                 if(bought) showToast("Куплено");
                 else showToast("Не хватает энергии");
                 updateUI();
            } catch(e) {
                console.error(e);
                showToast("Ошибка: " + e.message);
            }
        });
        
        // Render Prestige Shop
        renderPrestigeShop(state, (id) => {
             const bought = buyPrestigeUpgrade(state, id);
             if(bought) showToast("Улучшено (ТМ)");
             else showToast("Не хватает ТМ");
             updateUI();
        });
    }

    // Actions
    function doClick(cX, cY){
        let gain = getPerClick(state);
        
        // Crit check 
        const capLvl = getUpgradeLevel(state, "capacitor");
        const chance = window.Game.Config.critChance(capLvl);
        const isCrit = Math.random() < chance;
        if (isCrit) {
            gain *= getCritMultiplier(state);
        }

        gain = Math.floor(gain);
        state.energy += gain;
        state.totalEnergy += gain;
        
        if(!state.stats) state.stats = { clicks: 0, resets: 0 };
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
        if(newUnlock || !ui.achievementsPanel.hasChildNodes()){
            renderAchievements(state); 
        }
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

    // Reset / Prestige Handler
    ui.btnReset.addEventListener("click", () => {
        const gain = calculatePrestigeGain(state);
        if(gain > 0){
             if(confirm(`Сбросить прогресс и получить ${fmt(gain)} Темной Материи? (Бонус: +${gain*10}%)`)){
                 state = doPrestige(state);
                 updateUI();
                 renderAchievements(state);
                 showToast(`ПРЕСТИЖ! Получено ${fmt(gain)} TM`);
             }
        } else {
             if(!confirm("Полный сброс прогресса? (Hard Reset)")) return;
             // Manual hard reset
             state = window.Game.State.defaultState();
             saveState(state);
             updateUI();
             renderAchievements(state);
             showToast("Сброшено");
        }
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
        checkAchievements(); // check passive unlocks
        
        // Golden Orb Chance
        if(Math.random() < 0.005){ // ~1/200 per tick (250ms) -> ~1 per 50s
            spawnGoldenOrb(() => {
                // Reward: 20% of current energy or 60s of production, whichever is better?
                // Let's go with 60s production + 15% current energy
                const reward = Math.floor(getPerSec(state) * 60 + state.energy * 0.15);
                state.energy += reward;
                state.totalEnergy += reward;
                showToast(`Golden Orb! +${fmt(reward)}`);
            });
        }
        
    }, 250);

    // Autosave
    setInterval(() => saveState(state), 5000);

    // Init
    if(state.autoHold) startHold();

    // Starfield
    const canvas = $("stars");
    if(canvas){
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
    }

    // Initial render
    updateUI();
    renderAchievements(state);

    return { state }; // expose for debugging
})();
