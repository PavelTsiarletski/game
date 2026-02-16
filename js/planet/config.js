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

    // Upgrades - Realistic Formation Steps (IDLE ONLY)
    const upgrades = [
        {
            id: "electrostatic",
            name: "Electrostatic Forces",
            type: "auto",
            baseCost: 15, 
            freeFirst: true, // First level is free, then costs 15*growth
            growth: 1.5,
            desc: "Dust grains stick together automatically.",
            effect: (lvl) => (lvl + 1) * 1 // Base income
        },
        {
            id: "accretion",
            name: "Gravitational Accretion",
            type: "auto",
            baseCost: 100,
            growth: 1.4,
            desc: "Mass attracts more mass by gravity.",
            effect: (lvl) => lvl * 5
        },
        {
            id: "collisions",
            name: "Meteorite Attraction", // Renamed from Capture
            type: "auto", 
            baseCost: 500,
            growth: 1.5,
            desc: "Gravity pulls in wandering rocks.",
            effect: (lvl) => lvl * 20
        },
        {
            id: "gravity_well",
            name: "Deep Gravity Well",
            type: "auto",
            baseCost: 2000,
            growth: 1.4,
            desc: "Stronger gravity pulls larger bodies.",
            effect: (lvl) => lvl * 80
        },
        {
            id: "volcanism",
            name: "Volcanic Outgassing",
            type: "auto",
            baseCost: 10000,
            growth: 1.5,
            desc: "Releases gases for atmosphere.",
            effect: (lvl) => lvl * 300
        },
        {
            id: "comets",
            name: "Comet Rain", // Renamed
            type: "auto", 
            baseCost: 50000,
            growth: 1.6,
            desc: "Constant bombardment delivers water.",
            effect: (lvl) => lvl * 1000
        },
        {
            id: "cooling",
            name: "Surface Cooling",
            type: "auto",
            baseCost: 200000,
            growth: 1.5,
            desc: "Crust formation accelerates stability.",
            effect: (lvl) => lvl * 5000
        }
    ];

    return { stages, upgrades };
})();
