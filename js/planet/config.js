window.Game = window.Game || {};

window.Game.PlanetConfig = (function(){
    
    // Stages of planet formation
    const stages = [
        {
            id: "nebula",
            name: "Solar Nebula",
            threshold: 0,
            desc: "A swirling disk of dust and gas.",
            color: "#6c5ce7"
        },
        {
            id: "planetesimal",
            name: "Planetesimal",
            threshold: 1000,
            desc: "Dust clumps forming rock (1-10km).",
            color: "#a29bfe"
        },
        {
            id: "proto",
            name: "Proto-Planet",
            threshold: 10000,
            desc: "A molten ball of rock under heavy bombardment.",
            color: "#e17055"
        },
        {
            id: "differentiation",
            name: "Differentiation",
            threshold: 50000,
            desc: "Iron sinks to the core. Layers form.",
            color: "#d63031"
        },
        {
            id: "crust",
            name: "Solid Crust",
            threshold: 150000,
            desc: "Surface cools and hardens.",
            color: "#636e72"
        },
        {
            id: "ocean",
            name: "Primitive Oceans",
            threshold: 500000,
            desc: "Water condenses from volcanic gas and comets.",
            color: "#0984e3"
        },
        {
            id: "atmosphere",
            name: "Atmosphere",
            threshold: 2000000,
            desc: "Thick protective layer of gas.",
            color: "#74b9ff"
        },
        {
            id: "life",
            name: "Biosphere",
            threshold: 10000000,
            desc: "Simple life begins to thrive.",
            color: "#00b894"
        }
    ];

    // Upgrades - Realistic Formation Steps
    const upgrades = [
        {
            id: "electrostatic",
            name: "Electrostatic Forces",
            type: "click",
            baseCost: 10,
            growth: 1.4,
            desc: "Dust grains stick together. +2 Matter/click.",
            effect: (lvl) => 1 + lvl * 2 // Much stronger base click
        },
        {
            id: "accretion",
            name: "Gravitational Accretion",
            type: "auto",
            baseCost: 25,
            growth: 1.3,
            desc: "Mass attracts more mass by gravity.",
            effect: (lvl) => lvl * 1.5 // Early auto
        },
        {
            id: "collisions",
            name: "Meteorite Capture",
            type: "click",
            baseCost: 150,
            growth: 1.5,
            desc: "Manually guide impacts. Big specific click boost.",
            effect: (lvl) => lvl * 15
        },
        {
            id: "gravity_well",
            name: "Deep Gravity Well",
            type: "auto",
            baseCost: 500,
            growth: 1.4,
            desc: "Stronger gravity pulls larger bodies.",
            effect: (lvl) => lvl * 8
        },
        {
            id: "volcanism",
            name: "Volcanic Outgassing",
            type: "auto",
            baseCost: 2500,
            growth: 1.5,
            desc: "Releases gases for atmosphere.",
            effect: (lvl) => lvl * 40
        },
        {
            id: "comets",
            name: "Comet Bombardment",
            type: "click", // Active play reward
            baseCost: 8000,
            growth: 1.6,
            desc: "Direct comets to the surface. Massive clicks.",
            effect: (lvl) => lvl * 150
        },
        {
            id: "cooling",
            name: "Surface Cooling",
            type: "auto",
            baseCost: 20000,
            growth: 1.5,
            desc: "Crust formation accelerates stability.",
            effect: (lvl) => lvl * 250
        }
    ];

    return { stages, upgrades };
})();
