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

    function autoBonus(dronesLvl, minerLvl = 0, stationLvl = 0, swarmLvl = 0, stardustLvl = 0, blackHoleLvl = 0, singularityLvl = 0){
        // Stardust: ~8/sec
        const stardust = Math.max(0, stardustLvl * 8 + Math.floor(stardustLvl/10) * 12);
        // Drones: ~0.6/sec
        const drone = Math.max(0, dronesLvl * 0.6 + Math.floor(dronesLvl/10) * 1.5);
        // Miners: ~5/sec base
        const miner = Math.max(0, minerLvl * 5 + Math.floor(minerLvl/10) * 8);
        // Station: ~25/sec
        const station = Math.max(0, stationLvl * 25 + Math.floor(stationLvl/10) * 50);
        // Swarm: ~150/sec
        const swarm = Math.max(0, swarmLvl * 150 + Math.floor(swarmLvl/10) * 400);
        // Black Hole: ~500/sec
        const blackHole = Math.max(0, blackHoleLvl * 500 + Math.floor(blackHoleLvl/10) * 1000);
        // Singularity: ~2500/sec
        const singularity = Math.max(0, singularityLvl * 2500 + Math.floor(singularityLvl/10) * 5000);
        
        return stardust + drone + miner + station + swarm + blackHole + singularity;
    }

    function critChance(capLvl){
        // 0.5% per level, max 50%
        return Math.min(0.5, capLvl * 0.005); 
    }

    // ---------- Upgrade Definitions ----------
    const upgrades = [
        {
            id: "clickPower",
            name: "Лазерный фокус",
            badge: "click",
            desc: "Увеличивает энергию за клик.",
            baseCost: 15,
            growth: 1.4,
            effectText: (lvl) => `Ур.: ${lvl} • За клик: +${clickBonus(lvl)}`,
        },
        {
            id: "stardust",
            name: "Сборщик Пыли",
            badge: "auto",
            desc: "Собирает звездную пыль. Мелочь, а приятно.",
            baseCost: 30,
            growth: 1.3,
            effectText: (lvl) => `Авто: +8/c`,
        },
        {
            id: "drones",
            name: "Дроны-добытчики",
            badge: "auto",
            desc: "Маленькие помощники. Добывают крохи энергии.",
            baseCost: 100,
            growth: 1.25,
            effectText: (lvl) => `Авто: +0.6/c`,
        },
        {
            id: "miner",
            name: "Энерго-шахта",
            badge: "auto",
            desc: "Бурит пространство в поисках энергии.",
            baseCost: 500,
            growth: 1.3,
            effectText: (lvl) => `Авто: +5/c`, 
        },
        {
            id: "nanobots",
            name: "Наноботы",
            badge: "syn",
            desc: "Синергия: +1 к силе клика за каждые 5 зданий.",
            baseCost: 1200,
            growth: 1.4,
            effectText: (lvl) => `Клик +${lvl} за 5 зданий`,
        },
        {
            id: "alien",
            name: "Инопланетный чип",
            badge: "click%",
            desc: "Мультипликатор клика: +5% (сложно).",
            baseCost: 3500,
            growth: 1.8,
            effectText: (lvl) => `Клик x${Math.pow(1.05, lvl).toFixed(2)}`,
        },
        {
            id: "neural",
            name: "Нейролинкед",
            badge: "link",
            desc: "Синергия: 15% от авто-дохода добавляется к клику.",
            baseCost: 5000,
            growth: 1.6,
            effectText: (lvl) => `Клик +${(lvl * 15)}% от авто`,
        },
        {
            id: "station",
            name: "Орбитальная станция",
            badge: "auto++",
            desc: "Крупный комплекс на орбите.",
            baseCost: 8500,
            growth: 1.3,
            effectText: (lvl) => `Авто: +25/c`,
        },
        {
            id: "swarm",
            name: "Рой Дайсона",
            badge: "mega",
            desc: "Окружает звезду для сбора всей энергии.",
            baseCost: 45000,
            growth: 1.35,
            effectText: (lvl) => `Авто: +150/c`,
        },
        {
            id: "blackhole",
            name: "Генератор ЧД",
            badge: "hyper",
            desc: "Извлекает энергию из горизонта событий.",
            baseCost: 120000,
            growth: 1.4,
            effectText: (lvl) => `Авто: +500/c`,
        },
        {
            id: "singularity",
            name: "Сингулярность",
            badge: "ultra",
            desc: "Сжимает пространство-время в чистую энергию.",
            baseCost: 800000,
            growth: 1.5,
            effectText: (lvl) => `Авто: +2500/c`,
        },
        {
            id: "reactor",
            name: "Реактор ТМ",
            badge: "mult+",
            desc: "Усиливает эффективность Темной Материи.",
            baseCost: 5000,
            growth: 1.5,
            effectText: (lvl) => `ТМ бонус: +${lvl*10}%`,
        },
        {
            id: "capacitor",
            name: "Флюксовый куб",
            badge: "crit",
            desc: "Повышает шанс критического клика.",
            baseCost: 2000,
            growth: 1.3,
            effectText: (lvl) => `Крит шанс: ${(critChance(lvl)*100).toFixed(0)}%`,
        },
        {
            id: "timecrystal",
            name: "Кристалл Времени",
            badge: "global",
            desc: "Ускоряет само время. +5% ко ВСЕЙ добыче.",
            baseCost: 50000,
            growth: 1.55,
            effectText: (lvl) => `Все x${Math.pow(1.05, lvl).toFixed(2)}`,
        },
        {
            id: "fusion",
            name: "Термоядерное ядро",
            badge: "mult++",
            desc: "Мощный усилитель. Каждое ядро умножает ВСЮ добычу на 1.5.",
            baseCost: 1500000, // Rebalanced cost higher due to new upgrades
            growth: 1.6, 
            effectText: (lvl) => `Бонус: x${Math.pow(1.5, lvl).toFixed(2)}`,
        }
    ];

    // ---------- Prestige Upgrades ----------
    const prestigeUpgrades = [
        {
            id: "darkFlow",
            name: "Темный Поток",
            desc: "Увеличивает получение Темной Материи при сбросе.",
            baseCost: 10,
            growth: 2.5,
            effectText: (lvl) => `+${lvl * 5}% ТМ`,
            maxLevel: 20
        },
        {
             id: "timeWarp",
             name: "Временная Петля",
             desc: "Начинать с энергией после сброса.",
             baseCost: 25,
             growth: 3,
             effectText: (lvl) => `Старт: ${fmt(1000 * Math.pow(5, lvl))}`,
             maxLevel: 10
        },
        {
            id: "critMastery",
            name: "Мастер Крита",
            desc: "Увеличивает множитель критического клика.",
            baseCost: 50,
            growth: 4,
            effectText: (lvl) => `Крит: x${3 + lvl}`, // Base 3, +1 per level
            maxLevel: 10
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

    // Helper for formatted numbers in config (needed for timeWarp textual description)
    function fmt(n){
         return window.Game.Utils.fmt(n);
    }

    return { 
        upgrades, prestigeUpgrades, achievements, 
        multBonus, clickBonus, autoBonus, critChance 
    };
})();
