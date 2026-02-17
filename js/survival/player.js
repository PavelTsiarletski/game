window.SURVIVAL = window.SURVIVAL || {};

(function() {
    const CONFIG = window.SURVIVAL.Config;
    const Utils = window.SURVIVAL.Utils;

    class Player {
        constructor() {
            this.reset();
            this.persistentStats = {
                damageMultiplier: 1,
                maxHpMultiplier: 1,
                speedMultiplier: 1,
                gold: 0
            };
            this.loadProfile();
        }

        reset() {
            this.x = CONFIG.CANVAS_WIDTH / 2;
            this.y = CONFIG.CANVAS_HEIGHT / 2;
            this.radius = 15;
            this.direction = { x: 0, y: 0 };
            
            // Use initial stats (will apply multipliers in start())
            this.stats = { ...CONFIG.PLAYER_DEFAULTS };
            this.currentHp = this.stats.hp;
            
            this.xp = 0;
            this.maxXp = 30;
            this.level = 1;

            this.isDead = false;
            this.invincibleUntil = 0;
        }

        applyUpgrades() {
            this.stats.hp = Math.floor(CONFIG.PLAYER_DEFAULTS.hp * this.persistentStats.maxHpMultiplier);
            this.currentHp = this.stats.hp; // Heal on start
            this.stats.speed = CONFIG.PLAYER_DEFAULTS.speed * this.persistentStats.speedMultiplier;
        }

        handleInput(keys) {
            this.direction.x = 0;
            this.direction.y = 0;

            if (keys['w'] || keys['ArrowUp']) this.direction.y = -1;
            if (keys['s'] || keys['ArrowDown']) this.direction.y = 1;
            if (keys['a'] || keys['ArrowLeft']) this.direction.x = -1;
            if (keys['d'] || keys['ArrowRight']) this.direction.x = 1;
        }

        update(dt) {
            if (this.isDead) return;

            // Normalize vector for consistent diagonal speed
            if (this.direction.x !== 0 || this.direction.y !== 0) {
                const length = Math.sqrt(this.direction.x**2 + this.direction.y**2);
                this.x += (this.direction.x / length) * this.stats.speed;
                this.y += (this.direction.y / length) * this.stats.speed;
            }

            Utils.checkBounds(this, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }

        draw(ctx) {
            if (this.isDead) return;

            ctx.fillStyle = CONFIG.COLORS.PLAYER;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Outline if invincible
            if (Date.now() < this.invincibleUntil) {
                 ctx.strokeStyle = '#fff';
                 ctx.lineWidth = 2;
                 ctx.stroke();
            }
        }

        takeDamage(amount) {
            if (this.isDead || Date.now() < this.invincibleUntil) return;

            this.currentHp -= amount;
            this.invincibleUntil = Date.now() + this.stats.invincibilityTime;
            
            // Trigger UI event or callback in Game loop
            if (this.currentHp <= 0) {
                this.currentHp = 0;
                this.isDead = true;
            }
        }

        gainXp(amount) {
            this.xp += amount;
            if (this.xp >= this.maxXp) {
                this.levelUp();
            }
        }

        levelUp() {
            this.level++;
            this.xp -= this.maxXp;
            this.maxXp = Math.floor(this.maxXp * 1.1);
            // Full Heal on level up? Maybe just a bit.
            this.currentHp = Math.min(this.currentHp + (this.stats.hp * 0.2), this.stats.hp);
            // Signal Game to show level up screen
        }

        gainGold(amount) {
            this.persistentStats.gold += amount;
            this.saveProfile();
        }

        saveProfile() {
            localStorage.setItem('cellSurvivalProfile', JSON.stringify(this.persistentStats));
        }

        loadProfile() {
            const data = localStorage.getItem('cellSurvivalProfile');
            if (data) {
                this.persistentStats = JSON.parse(data);
            }
        }
    }
    
    window.SURVIVAL.Player = Player;
})();
