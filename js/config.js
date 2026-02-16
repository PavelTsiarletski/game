window.Game = window.Game || {};

window.Game.Config = (function(){
    const { clamp } = window.Game.Utils;

    // ---------- Effects / Formulas ----------
    function multBonus(reactorLvl, prestigeLvl = 0){
        // Reactor: 1 + 0.08*lvl with small diminishing
        const reactorMult = 1 + 0.08 * reactorLvl - 0.0006 * reactorLvl * reactorLvl;
        // Prestige: +10% per point (additive or multiplicative? Multiplicative generally feels better for prestige)
        const prestigeMult = 1 + (prestigeLvl * 0.10);
        return reactorMult * prestigeMult;
    }

    function clickBonus(clickPowerLvl){
        const base = clickPowerLvl;
        const tier = Math.floor(clickPowerLvl / 10);
        return base + tier * 2;
    }

    function autoBonus(dronesLvl, minerLvl = 0){
        // Drones: ~0.6/sec
        const drone = Math.max(0, dronesLvl * 0.6 + Math.floor(dronesLvl/10) * 1.5);
        // Miners: ~5/sec base
        const miner = Math.max(0, minerLvl * 5 + Math.floor(minerLvl/10) * 8);
        return drone + miner;
    }

    function critChance(capLvl){
        return clamp(capLvl * 0.01, 0, 0.35); 
    }

    // ---------- Upgrade Definitions ----------
    const upgrades = [
        {
            id: "clickPower",
            name: "Лазерный фокус",
            badge: "click",
            desc: "Увеличивает энергию за клик.",
            baseCost: 15,
            growth: 1.18,
            effectText: (lvl) => `За клик: +${clickBonus(lvl)}`,
        },
        {
            id: "drones",
            name: "Сборочные дроны",
            badge: "auto",
            desc: "Пассивно генерируют энергию (мало).",
            baseCost: 60,
            growth: 1.22,
            effectText: (lvl) => `Авто: +0.6/c (всего ${autoBonus(lvl).toFixed(1)}/c)`,
        },
        {
            id: "miner", // New
            name: "Эфирный бур",
            badge: "auto+",
            desc: "Добывает энергию из эфира (много).",
            baseCost: 1200,
            growth: 1.24,
            effectText: (lvl) => `Авто: +5/c`, 
        },
        {
            id: "reactor",
            name: "Квантовый реактор",
            badge: "mult",
            desc: "Увеличивает множитель ко всем источникам.",
            baseCost: 250,
            growth: 1.28,
            effectText: (lvl) => `Реактор: x${(1 + 0.08 * lvl - 0.0006 * lvl * lvl).toFixed(2)}`,
        },
        {
            id: "capacitor",
            name: "Импульсный конденсатор",
            badge: "crit",
            desc: "Шанс крит-клика: +1% за уровень (x3 урон).",
            baseCost: 120,
            growth: 1.25,
            effectText: (lvl) => `Крит шанс: ${(critChance(lvl)*100).toFixed(0)}%`,
        },
        {
            id: "fusion", // New
            name: "Термоядерное ядро",
            badge: "mult++",
            desc: "Мощный усилитель реактора.",
            baseCost: 15000,
            growth: 1.35,
            effectText: (lvl) => `(В разработке) Пока просто красиво.`, // Placeholder logic if we want simple behavior or complex
        }
    ];

    // ---------- Achievement Definitions ----------
    const achievements = [
        {
            id: "energy_1k",
            name: "Малый накопитель",
            desc: "Накопить 1,000 Всего Энергии",
            condition: (state) => state.totalEnergy >= 1000
        },
        {
            id: "energy_1m",
            name: "Мега-батарея",
            desc: "Накопить 1,000,000 Всего Энергии",
            condition: (state) => state.totalEnergy >= 1000000
        },
        {
            id: "click_100",
            name: "Ручной труд",
            desc: "Сделать 100 ручных кликов",
            condition: (state) => state.stats && state.stats.clicks >= 100
        },
        {
            id: "upgrades_10",
            name: "Технолог",
            desc: "Купить 10 уровней любых улучшений",
            condition: (state) => {
                let total = 0;
                for(let k in state.upgrades) total += state.upgrades[k];
                return total >= 10;
            }
        },
        {
            id: "prestige_1",
            name: "Перерождение",
            desc: "Совершить первый сброс ради Темной Материи",
            condition: (state) => state.darkMatter > 0
        }
    ];

    return { 
        upgrades, achievements, 
        multBonus, clickBonus, autoBonus, critChance 
    };
})();
