window.SURVIVAL = window.SURVIVAL || {};

(function() {
    const CONFIG = window.SURVIVAL.Config;
    const Utils = window.SURVIVAL.Utils;

    class Projectile {
        constructor(x, y, angle, stats) {
            this.x = x;
            this.y = y;
            this.vx = Math.cos(angle) * stats.speed;
            this.vy = Math.sin(angle) * stats.speed;
            this.radius = 4;
            this.damage = stats.damage;
            this.pierce = stats.pierce;
            this.range = stats.range;
            this.distanceTraveled = 0;
            this.color = stats.color;
            this.markedForDeletion = false;
            this.hitList = []; // Track enemies hit to handle pierce
        }

        update(dt) {
            this.x += this.vx;
            this.y += this.vy;
            this.distanceTraveled += Math.sqrt(this.vx * this.vx + this.vy * this.vy);

            if (this.distanceTraveled >= this.range || 
                this.x < 0 || this.x > CONFIG.CANVAS_WIDTH ||
                this.y < 0 || this.y > CONFIG.CANVAS_HEIGHT) {
                this.markedForDeletion = true;
            }
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class Weapon {
        constructor(config) {
            this.name = config.name;
            this.config = { ...config }; // Copy config
            this.level = 1;
            this.lastFired = 0;
            
            // Dynamic Stats
            this.damage = config.damage;
            this.cooldown = config.cooldown;
            this.count = config.count;
        }

        upgrade() {
            this.level++;
            this.damage *= 1.2;
            this.config.damage = this.damage;
            // Simple upgrade logic: alternating upgrades
            if (this.level % 3 === 0) this.count++; 
            else this.cooldown *= 0.9;
        }
        
        // Returns array of projectiles if fired, null otherwise
        update(time, player, enemies) {
            if (time - this.lastFired >= this.cooldown) {
                const projectiles = this.fire(player, enemies);
                if (projectiles && projectiles.length > 0) {
                    this.lastFired = time;
                    return projectiles;
                }
            }
            return null;
        }

        fire(player, enemies) {
            // Find nearest enemy
            let nearest = null;
            let minDist = Infinity;

            for (const enemy of enemies) {
                const dist = Utils.getDistance(player.x, player.y, enemy.x, enemy.y);
                if (dist < this.config.range && dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            }

            if (nearest) {
                const angle = Utils.getAngle(player.x, player.y, nearest.x, nearest.y);
                const projectiles = [];
                
                // Handle multi-shot / spread
                const startAngle = angle - (this.config.spread / 2);
                const step = this.config.count > 1 ? this.config.spread / (this.config.count - 1) : 0;

                for (let i = 0; i < this.config.count; i++) {
                    const currentAngle = this.config.count > 1 ? startAngle + (step * i) : angle;
                    projectiles.push(new Projectile(player.x, player.y, currentAngle, this.config));
                }
                return projectiles;
            }
            return null;
        }
    }

    class WeaponController {
        constructor() {
            this.weapons = [];
            this.projectiles = [];
        }

        addWeapon(config) {
            // Check if player already has this weapon type, if so, upgrade it? 
            // For now, let's assume we can add new ones or upgrade existing manually.
            const existing = this.weapons.find(w => w.name === config.name);
            if (existing) {
                existing.upgrade();
            } else {
                this.weapons.push(new Weapon(config));
            }
        }

        update(time, player, enemies) {
            // Fire weapons
            for (const weapon of this.weapons) {
                const newProjectiles = weapon.update(time, player, enemies);
                if (newProjectiles) {
                    this.projectiles.push(...newProjectiles);
                }
            }

            // Update Projectiles
            this.projectiles.forEach(p => p.update());
            this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        }

        draw(ctx) {
            this.projectiles.forEach(p => p.draw(ctx));
        }
    }

    window.SURVIVAL.WeaponController = WeaponController;
    window.SURVIVAL.Weapon = Weapon; // Export if needed
})();
