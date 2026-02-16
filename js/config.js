import { clamp } from './utils.js';

// ---------- Upgrade Definitions ----------
export const upgrades = [
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
    desc: "Пассивно генерируют энергию каждую секунду.",
    baseCost: 60,
    growth: 1.22,
    effectText: (lvl) => `Авто: +${autoBonus(lvl)}/сек`,
  },
  {
    id: "reactor",
    name: "Квантовый реактор",
    badge: "mult",
    desc: "Увеличивает общий множитель ко всем источникам.",
    baseCost: 250,
    growth: 1.28,
    effectText: (lvl) => `Множитель: x${multBonus(lvl).toFixed(2)}`,
  },
  {
    id: "capacitor",
    name: "Импульсный конденсатор",
    badge: "crit",
    desc: "Шанс крит-клика: +1% за уровень. Крит даёт x3 за клик.",
    baseCost: 120,
    growth: 1.25,
    effectText: (lvl) => `Крит шанс: ${(critChance(lvl)*100).toFixed(0)}% (x3)`,
  }
];

// ---------- Effects / Formulas ----------
export function multBonus(reactorLvl){
  // Smooth growth: 1 + 0.08*lvl with small diminishing
  // => lvl 10 -> ~1.68, lvl 25 -> ~2.60
  return 1 + 0.08 * reactorLvl - 0.0006 * reactorLvl * reactorLvl;
}

export function clickBonus(clickPowerLvl){
  // Each lvl adds +1, with slight scaling every 10 levels
  const base = clickPowerLvl;
  const tier = Math.floor(clickPowerLvl / 10);
  return base + tier * 2;
}

export function autoBonus(dronesLvl){
  // Each level adds +0.6/sec plus scaling
  return Math.max(0, dronesLvl * 0.6 + Math.floor(dronesLvl/10) * 1.5);
}

export function critChance(capLvl){
  return clamp(capLvl * 0.01, 0, 0.35); // cap 35%
}

// ---------- Achievement Definitions (New) ----------
export const achievements = [
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
  }
];
