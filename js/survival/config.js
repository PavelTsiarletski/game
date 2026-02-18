window.SURVIVAL = window.SURVIVAL || {};

window.SURVIVAL.Config = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    FPS: 60,
    
    // Collision Categories (Bitmask)
    CATEGORY_PLAYER: 0x0001,
    CATEGORY_ENEMY: 0x0002,
    CATEGORY_PROJECTILE: 0x0004,
    CATEGORY_PICKUP: 0x0008,

    COLORS: {
        PLAYER: '#00bcd4', // Cyan
        PROJECTILE: '#ffff00', // Yellow
        XP_GEM: '#4caf50', // Green
        GOLD_COIN: '#ffd700', // Gold
        TEXT_DAMAGE: '#ff0000',
        TEXT_HEAL: '#00ff00',
        BACKGROUND: '#1a1a2e'
    },

    PLAYER_DEFAULTS: {
        hp: 100,
        speed: 4,
        pickupRange: 100,
        invincibilityTime: 1000, // ms
    },

    ENEMIES: {
        BASIC: {
            hp: 15,
            damage: 10,
            speed: 2,
            radius: 12,
            color: '#e94560', // Reddish
            xp: 10,
            goldChance: 0.1
        },
        FAST: {
            hp: 10,
            damage: 5,
            speed: 3.5,
            radius: 8,
            color: '#ff9800', // Orange
            xp: 15,
            goldChance: 0.15
        },
        TANK: {
            hp: 50,
            damage: 20,
            speed: 1,
            radius: 20,
            color: '#8e24aa', // Purple
            xp: 30,
            goldChance: 0.3
        },
        BOSS: {
            hp: 500,
            damage: 30,
            speed: 1.5,
            radius: 40,
            color: '#d32f2f', // Dark Red
            xp: 200,
            goldChance: 1.0
        }
    },

    WEAPONS: {
        PISTOL: {
            name: 'Blaster',
            type: 'projectile',
            damage: 10,
            cooldown: 500, // ms
            speed: 8,
            range: 220, // Reduced from 400
            color: '#ffff00',
            spread: 0,
            count: 1,
            pierce: 0
        },
        SHOTGUN: {
            name: 'Scattergun',
            type: 'projectile',
            damage: 8,
            cooldown: 1000,
            speed: 7,
            range: 180, // Reduced from 300
            color: '#ffca28',
            spread: 0.5, // Radians
            count: 5,
            pierce: 1
        },
        MACHINE_GUN: {
            name: 'Rapid Fire',
            type: 'projectile',
            damage: 5,
            cooldown: 100,
            speed: 10,
            range: 300, // Reduced from 500
            color: '#4fc3f7',
            spread: 0.1,
            count: 1,
            pierce: 0
        },
        ORBITAL: {
            name: 'Orbital Shield',
            type: 'orbital',
            damage: 5, // DPS
            cooldown: 0, // Always active
            speed: 2, // Rotation speed
            range: 60, // Distance from player
            color: '#00e676',
            count: 1,
            size: 8
        },
        SNIPER: {
            name: 'Railgun',
            type: 'projectile',
            damage: 100, // One shot kills early
            cooldown: 1500,
            speed: 25, // Instant feel
            range: 600, // Reduced from 1000
            color: '#ff00ff', // Magenta
            spread: 0,
            count: 1,
            pierce: 10
        },
        ROCKET: {
            name: 'RPG',
            type: 'projectile',
            damage: 30,
            cooldown: 1200,
            speed: 6,
            range: 350, // Reduced from 500
            color: '#ff5722', // Deep Orange
            spread: 0,
            count: 1,
            pierce: 0,
            explosive: true,
            explosionRadius: 100
        }
    }
};
