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
            
            // Explosive properties
            this.explosive = stats.explosive || false;
            this.explosionRadius = stats.explosionRadius || 0;
            this.knockback = stats.knockback || 0; // Default knockback
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
            // Dynamic Stats
            this.damage = config.damage;
            this.cooldown = config.cooldown;
            this.count = config.count;
            this.range = config.range;
            this.spread = config.spread;
            this.speed = config.speed;
            this.pierce = config.pierce;
            this.explosive = config.explosive;
            this.explosionRadius = config.explosionRadius;
            this.color = config.color;
        }

        upgrade() {
            this.level++;
            // Damage scaling
            this.damage *= 1.2; 
            
            // Logic for other stats based on level
            // Level 2, 5, 8...: +1 Count
            if (this.level % 3 === 2) {
                this.count++;
            }
            // Level 3, 6, 9...: Cooldown reduction
            if (this.level % 3 === 0) {
                this.cooldown *= 0.9;
            }
            // Level 4, 7, 10...: Pierce
            if (this.level % 3 === 1 && this.level > 1) {
                 this.pierce++;
            }
            // Every level: slight knockback increase? Or specific levels?
            // Let's add small knockback increase every level to satisfy "upgrade from level"
            this.knockback = (this.knockback || 2) * 1.05;
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
            // Apply Player Bonuses
            const pStats = player.stats || {};
            const finalRange = this.range * (pStats.rangeMultiplier || 1);
            const finalCount = this.count + (pStats.amountBonus || 0);
            const finalPierce = this.pierce + (pStats.penetrationBonus || 0);
            const finalKnockback = 2 * (pStats.knockbackMultiplier || 1); // Base knockback 2

            // Find nearest enemy
            let nearest = null;
            let minDist = Infinity;

            for (const enemy of enemies) {
                const dist = Utils.getDistance(player.x, player.y, enemy.x, enemy.y);
                if (dist < finalRange && dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            }

            if (nearest) {
                const angle = Utils.getAngle(player.x, player.y, nearest.x, nearest.y);
                const projectiles = [];
                
                // Handle firing modes: 
                // Spread > 0: Fan (Shotgun)
                // Spread == 0: Parallel (Pistol with multi-projectile upgrade)
                
                const isParallel = this.spread === 0;
                const spacing = 15; // Pixel spacing for parallel shots

                // Base stats for all projectiles
                const projStats = {
                    speed: this.speed,
                    damage: this.damage,
                    pierce: finalPierce,
                    range: finalRange,
                    color: this.color,
                    explosive: this.explosive,
                    explosionRadius: this.explosionRadius,
                    knockback: finalKnockback
                };

                for (let i = 0; i < finalCount; i++) {
                    let startX = player.x;
                    let startY = player.y;
                    let currentAngle = angle;

                    if (isParallel) {
                        // Calculate perpendicular offset
                        // Perpendicular to angle: angle + 90deg (PI/2)
                        const offset = (i - (finalCount - 1) / 2) * spacing;
                        const perpAngle = angle + Math.PI / 2;
                        
                        startX += Math.cos(perpAngle) * offset;
                        startY += Math.sin(perpAngle) * offset;
                        // Angle remains the same for parallel shots
                    } else {
                        // Fan logic
                        const startSpreadAngle = angle - (this.spread / 2);
                        const step = finalCount > 1 ? this.spread / (finalCount - 1) : 0;
                        currentAngle = finalCount > 1 ? startSpreadAngle + (step * i) : angle;
                    }

                    projectiles.push(new Projectile(startX, startY, currentAngle, projStats));
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
