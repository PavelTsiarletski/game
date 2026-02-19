window.SURVIVAL = window.SURVIVAL || {};

(function() {
    const CONFIG = window.SURVIVAL.Config;
    const Utils = window.SURVIVAL.Utils;

    class Enemy {
        constructor(x, y, config) {
            this.x = x;
            this.y = y;
            this.radius = config.radius;
            this.speed = config.speed;
            this.hp = config.hp;
            this.maxHp = config.hp;
            this.damage = config.damage;
            this.color = config.color;
            this.xp = config.xp;
            this.goldChance = config.goldChance;
            this.markedForDeletion = false;
            
            // Knockback
            this.knockback = { x: 0, y: 0 };
        }

        update(player, dt) {
            if (this.markedForDeletion) return;
            
            // Calculate direction to player
            const angle = Utils.getAngle(this.x, this.y, player.x, player.y);
            
            // Base movement
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
            
            // Apply knockback decay
            this.x += this.knockback.x;
            this.y += this.knockback.y;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;

            // Simple separation with other enemies could be added here for performance cost
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // HP Bar if damaged
            if (this.hp < this.maxHp) {
                ctx.fillStyle = 'red';
                ctx.fillRect(this.x - 10, this.y - this.radius - 8, 20, 4);
                ctx.fillStyle = 'green';
                ctx.fillRect(this.x - 10, this.y - this.radius - 8, 20 * (this.hp / this.maxHp), 4);
            }
        }

        takeDamage(amount, knockbackX, knockbackY) {
            this.hp -= amount;
            this.knockback.x = knockbackX || 0;
            this.knockback.y = knockbackY || 0;
            if (this.hp <= 0) {
                this.markedForDeletion = true;
            }
        }
    }

    class Pickup {
        constructor(x, y, type, value) {
            this.x = x;
            this.y = y;
            this.type = type; // 'xp' or 'gold'
            this.value = value;
            this.radius = type === 'xp' ? 4 : 6;
            this.color = type === 'xp' ? CONFIG.COLORS.XP_GEM : CONFIG.COLORS.GOLD_COIN;
            this.magnetized = false;
            this.speed = 0;
        }

        update(player) {
            const dist = Utils.getDistance(this.x, this.y, player.x, player.y);
            
            if (dist < player.stats.pickupRange) {
                this.magnetized = true;
            }

            if (this.magnetized) {
                const angle = Utils.getAngle(this.x, this.y, player.x, player.y);
                this.speed += 0.5; // Accelerate towards player
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            }
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            if (this.type === 'xp') {
                // Diamond shape
                ctx.moveTo(this.x, this.y - this.radius);
                ctx.lineTo(this.x + this.radius, this.y);
                ctx.lineTo(this.x, this.y + this.radius);
                ctx.lineTo(this.x - this.radius, this.y);
                ctx.closePath();
            } else {
                 // Circle for gold
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            }
            ctx.fill();
        }
    }

    class EnemyController {
        constructor() {
            this.enemies = [];
            this.pickups = [];
            this.waveTimer = 0;
            this.difficultyMultiplier = 1;
            this.spawnRate = 120; // Frames between spawns
            this.spawnTimer = 0;
        }

        reset() {
            this.enemies = [];
            this.pickups = [];
            this.waveTimer = 0;
            this.difficultyMultiplier = 1;
            this.spawnRate = 120;
        }

        spawnEnemy(player, timeSec) {
            // Spawn off-screen randomly
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? -50 : CONFIG.CANVAS_WIDTH + 50;
                y = Math.random() * CONFIG.CANVAS_HEIGHT;
            } else {
                x = Math.random() * CONFIG.CANVAS_WIDTH;
                y = Math.random() < 0.5 ? -50 : CONFIG.CANVAS_HEIGHT + 50;
            }

            // Determine enemy type based on stage time
            let type = CONFIG.ENEMIES.BASIC;
            
            if (timeSec > 180) { // Stage 4+
                // Mix of everything
                const rand = Math.random();
                if (rand < 0.2) type = CONFIG.ENEMIES.TANK;
                else if (rand < 0.5) type = CONFIG.ENEMIES.FAST;
            } else if (timeSec > 120) { // Stage 3
                 if (Math.random() < 0.3) type = CONFIG.ENEMIES.TANK;
                 else if (Math.random() < 0.3) type = CONFIG.ENEMIES.FAST;
            } else if (timeSec > 60) { // Stage 2
                 if (Math.random() < 0.4) type = CONFIG.ENEMIES.FAST;
            }

            const enemy = new Enemy(x, y, type);
            // Scale with difficulty
            enemy.hp *= this.difficultyMultiplier;
            enemy.maxHp = enemy.hp;
            
            this.enemies.push(enemy);
        }

        update(player) {
            // Stage System Logic
            this.waveTimer++;
            
            // Define Stages
            // Stage 1: 0-60s (Basic)
            // Stage 2: 60-120s (Fast + Basic)
            // Stage 3: 120-180s (Tanks + Fast)
            // Stage 4: 180-240s (High Density)
            // Stage 5: 240-300s (Boss/Win)
            
            const timeSec = this.waveTimer / 60; // Assuming 60fps
            let spawnInterval = 120;
            let spawnAmount = 1;

            if (timeSec < 60) {
                // Stage 1
                this.difficultyMultiplier = 1;
                spawnInterval = 100;
            } else if (timeSec < 120) {
                // Stage 2
                this.difficultyMultiplier = 1.2;
                spawnInterval = 80;
            } else if (timeSec < 180) {
                // Stage 3
                this.difficultyMultiplier = 1.5;
                spawnInterval = 60;
                spawnAmount = 2;
            } else if (timeSec < 240) {
                // Stage 4
                this.difficultyMultiplier = 1.8;
                spawnInterval = 40;
                spawnAmount = 3;
            } else if (timeSec < 300) {
                // Stage 5: Victory Lap / Hard
                this.difficultyMultiplier = 2.5;
                spawnInterval = 30;
                spawnAmount = 4;
            } else {
                // WIN CONDITION
                // Signal Game WIN (handled in Game.js by checking time or event?)
                // For now, let's keep spawning but maybe trigger a win event?
                // Actually, let's trigger it in Game.update by checking time.
                // Or we can stop spawning here.
            }

            this.spawnTimer++;
            if (this.spawnTimer >= spawnInterval && timeSec < 300) {
                 for(let i=0; i<spawnAmount; i++) {
                     this.spawnEnemy(player, timeSec);
                 }
                 this.spawnTimer = 0;
            }

            this.enemies.forEach(e => e.update(player));
            this.pickups.forEach(p => p.update(player));

            // Cleanup
            this.enemies = this.enemies.filter(e => !e.markedForDeletion);
            // Note: Pickups are removed when collected by collision logic in Game class
        }

        draw(ctx) {
            this.pickups.forEach(p => p.draw(ctx));
            this.enemies.forEach(e => e.draw(ctx));
        }
    }
    
    window.SURVIVAL.EnemyController = EnemyController;
    window.SURVIVAL.Pickup = Pickup;
})();
