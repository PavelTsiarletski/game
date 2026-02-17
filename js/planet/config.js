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
            threshold: 10000000, // 10M
            desc: "Simple life begins to thrive.",
            color: "#00b894"
        },
        {
            id: "lush",
            name: "Lush Biosphere",
            threshold: 50000000, // 50M
            desc: "Forests cover the continents.",
            color: "#27ae60" // Darker Green
        },
        {
            id: "civilization",
            name: "Civilization",
            threshold: 250000000, // 250M
            desc: "Cities light up the night.",
            color: "#dfe6e9" // White-ish/Grey (cities)
        },
        {
            id: "technosphere",
            name: "Technosphere",
            threshold: 1000000000, // 1B
            desc: "A machine world of pure efficiency.",
            color: "#0984e3" // Cyan/Electric Blue
        }
    ];

    // Upgrades - Realistic Formation Steps (IDLE ONLY)
    // Upgrades - Cascading Production (Tier N produces Tier N-1)
    const upgrades = [
        {
            id: "electrostatic",
            name: "Electrostatic Forces",
            tier: 1,
            currency: "matter", // Costs Matter
            baseCost: 15, 
            freeFirst: true,
            growth: 1.15, // Reduced from 1.5 to make early game easier
            desc: "Dust grains stick together. Produces Matter.",
            effect: (lvl) => lvl * 1 // Produces Matter
        },
        {
            id: "accretion",
            name: "Gravitational Accretion",
            tier: 2,
            currency: "electrostatic", // Costs Tier 1
            baseCost: 10, // Costs 10 Tier 1
            growth: 1.2, // Growth for "building cost" usually lower or linear? Let's use 1.2 for now.
            desc: "Accretes dust into larger clumps. Produces Electrostatic Forces.",
            effect: (lvl) => lvl * 1 // Produces Tier 1
        },
        {
            id: "collisions",
            name: "Meteorite Attraction",
            tier: 3,
            currency: "accretion", // Costs Tier 2
            baseCost: 20, // Costs 20 Tier 2
            growth: 1.2,
            desc: "Attracts meteorites. Produces Gravitational Accretion.",
            effect: (lvl) => lvl * 1 // Produces Tier 2
        },
        {
            id: "gravity_well",
            name: "Deep Gravity Well",
            tier: 4,
            currency: "collisions",
            baseCost: 30,
            growth: 1.2,
            desc: "Intense gravity field. Produces Meteorite Attraction.",
            effect: (lvl) => lvl * 1
        },
        {
            id: "volcanism",
            name: "Volcanic Outgassing",
            tier: 5,
            currency: "gravity_well",
            baseCost: 40,
            growth: 1.2,
            desc: "Releases internal pressure. Produces Deep Gravity Well.",
            effect: (lvl) => lvl * 1
        },
        {
            id: "comets",
            name: "Comet Rain",
            tier: 6,
            currency: "volcanism",
            baseCost: 50,
            growth: 1.2,
            desc: "Delivers water and volatiles. Produces Volcanic Outgassing.",
            effect: (lvl) => lvl * 1
        },
        {
            id: "cooling",
            name: "Surface Cooling",
            tier: 7,
            currency: "comets",
            baseCost: 60,
            growth: 1.2,
            desc: "Stabilizes the crust. Produces Comet Rain.",
            effect: (lvl) => lvl * 1
        }
    ];

    return { stages, upgrades };
})();
