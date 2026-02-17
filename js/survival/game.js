window.SURVIVAL = window.SURVIVAL || {};

(function() {
    
    const CONFIG = window.SURVIVAL.Config;
    const Player = window.SURVIVAL.Player;
    const UIManager = window.SURVIVAL.UIManager;
    const WeaponController = window.SURVIVAL.WeaponController;
    const EnemyController = window.SURVIVAL.EnemyController;
    const Pickup = window.SURVIVAL.Pickup;
    const Utils = window.SURVIVAL.Utils;

    class Game {
        constructor() {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            
            this.canvas.width = CONFIG.CANVAS_WIDTH;
            this.canvas.height = CONFIG.CANVAS_HEIGHT;

            this.player = new Player();
            this.weapons = new WeaponController();
            this.enemies = new EnemyController();
            this.ui = new UIManager(this);

            this.lastTime = 0;
            this.gameState = 'MENU'; // MENU, PLAYING, PAUSED, LEVEL_UP, GAME_OVER
            this.gameTime = 0;
            this.kills = 0;
            this.goldGainedInRun = 0;
            this.lastLevel = 1;

            this.keys = {};
            this.bindInputs();
            
            // Start loop
            requestAnimationFrame((t) => this.loop(t));

            window.addEventListener('resize', () => this.handleResize());
            this.handleResize();
        }

        handleResize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            CONFIG.CANVAS_WIDTH = window.innerWidth;
            CONFIG.CANVAS_HEIGHT = window.innerHeight;
        }

        bindInputs() {
            window.addEventListener('keydown', (e) => {
                this.keys[e.key] = true;
                if (e.key === 'Escape') {
                    if (this.gameState === 'PLAYING') this.togglePause();
                    else if (this.gameState === 'PAUSED') this.togglePause();
                }
            });
            window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        }

        startGame() {
            this.player.reset();
            this.player.applyUpgrades();
            this.enemies.reset();
            
            // Reset Controller but give default weapon
            this.weapons = new WeaponController();
            this.weapons.addWeapon(CONFIG.WEAPONS.PISTOL);
            
            this.gameTime = 0;
            this.kills = 0;
            this.goldGainedInRun = 0;
            this.lastLevel = 1;
            
            this.gameState = 'PLAYING';
            this.ui.showHUD();
            this.lastTime = performance.now();
        }
        
        togglePause() {
            if (this.gameState === 'PLAYING') {
                this.gameState = 'PAUSED';
                this.ui.togglePause(true);
            } else if (this.gameState === 'PAUSED') {
                this.gameState = 'PLAYING';
                this.ui.togglePause(false);
                this.lastTime = performance.now(); // Prevent dt jump
            }
        }

        loop(timestamp) {
            const dt = timestamp - this.lastTime;
            this.lastTime = timestamp;

            if (this.gameState === 'PLAYING') {
                this.update(dt);
                this.draw();
            } else if (this.gameState === 'GAME_OVER' || this.gameState === 'PAUSED' || this.gameState === 'LEVEL_UP') {
                // Still draw to keep background visible
                this.draw(); 
            }

            requestAnimationFrame((t) => this.loop(t));
        }

        update(dt) {
            this.gameTime += dt / 1000;
            
            this.player.handleInput(this.keys);
            this.player.update(dt);
            this.weapons.update(performance.now(), this.player, this.enemies.enemies);
            this.enemies.update(this.player);

            this.checkCollisions();
            this.ui.updateHUD(this.player, Utils.formatTime(this.gameTime), this.kills);

            if (this.player.isDead) {
                this.endGame();
            }
            
            // Check Level Up
            if (this.player.level > this.lastLevel) {
                this.lastLevel = this.player.level;
                this.triggerLevelUp();
            }
        }
        
        checkCollisions() {
            // Projectiles vs Enemies
            this.weapons.projectiles.forEach(proj => {
                // Check if explosive should detenonate at max range (if missed everything)
                // For now, only detonate on impact

                this.enemies.enemies.forEach(enemy => {
                    if (Utils.checkCircleCollision(proj, enemy) && !proj.hitList.includes(enemy)) {
                        // Impact Logic
                        
                        if (proj.explosive) {
                            // EXPLOSION LOGIC
                            this.createExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage * (this.player.persistentStats.damageMultiplier || 1));
                            proj.markedForDeletion = true;
                        } else {
                            // Standard Projectile Logic
                            const damage = proj.damage * (this.player.persistentStats.damageMultiplier || 1);
                            
                            // Knockback vector
                            const angle = Utils.getAngle(proj.x, proj.y, enemy.x, enemy.y);
                            const kForce = 2; 
                            
                            enemy.takeDamage(damage, Math.cos(angle)*kForce, Math.sin(angle)*kForce);
                            this.ui.spawnFloatingText(enemy.x, enemy.y, Math.floor(damage), CONFIG.COLORS.TEXT_DAMAGE);
                            
                            if (proj.pierce > 0) {
                                proj.pierce--;
                                proj.hitList.push(enemy);
                            } else {
                                proj.markedForDeletion = true;
                            }
                            
                            if (enemy.hp <= 0 && !enemy.alreadyDead) {
                                this.killEnemy(enemy);
                            }
                        }
                    }
                });
            });

            // Player vs Enemies
            this.enemies.enemies.forEach(enemy => {
                 if (Utils.checkCircleCollision(this.player, enemy)) {
                     this.player.takeDamage(enemy.damage);
                 }
            });

            // Player vs Pickups
            this.enemies.pickups.forEach(pickup => {
                if (Utils.checkCircleCollision(this.player, pickup)) {
                    if (pickup.type === 'xp') {
                         this.player.gainXp(pickup.value);
                    } else {
                         this.player.gainGold(pickup.value);
                         this.goldGainedInRun += pickup.value;
                    }
                    pickup.markedForDeletion = true; 
                }
            });
            
            // Clean up pickups in controller
            this.enemies.pickups = this.enemies.pickups.filter(p => !p.markedForDeletion);
        }

        createExplosion(x, y, radius, damage) {
            // visual effect (simple circle for now)
            // TODO: Add visual manager for explosions
            
            // Damage area
            this.enemies.enemies.forEach(enemy => {
                const dist = Utils.getDistance(x, y, enemy.x, enemy.y);
                if (dist <= radius) {
                    // Falloff damage? No, full damage for satisfying explosions
                    const angle = Utils.getAngle(x, y, enemy.x, enemy.y);
                    const kForce = 5; // Big knockback for explosions
                    
                    enemy.takeDamage(damage, Math.cos(angle)*kForce, Math.sin(angle)*kForce);
                    this.ui.spawnFloatingText(enemy.x, enemy.y, Math.floor(damage), '#ff5722'); // Orange text
                    
                    if (enemy.hp <= 0 && !enemy.alreadyDead) {
                        this.killEnemy(enemy);
                    }
                }
            });
        }

        killEnemy(enemy) {
            enemy.alreadyDead = true; 
            this.kills++;
            // Drop XP / Gold
            this.enemies.pickups.push(new Pickup(enemy.x, enemy.y, 'xp', enemy.xp));
            if (Math.random() < enemy.goldChance) {
                 this.enemies.pickups.push(new Pickup(enemy.x + 5, enemy.y + 5, 'gold', 10));
            }
        }

        draw() {
            this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw Grid for reference
            this.ctx.strokeStyle = '#222';
            this.ctx.lineWidth = 1;
            for(let i=0; i<this.canvas.width; i+=50) {
                this.ctx.beginPath(); this.ctx.moveTo(i,0); this.ctx.lineTo(i,this.canvas.height); this.ctx.stroke();
            }
            for(let i=0; i<this.canvas.height; i+=50) {
                this.ctx.beginPath(); this.ctx.moveTo(0,i); this.ctx.lineTo(this.canvas.width,i); this.ctx.stroke();
            }

            this.enemies.draw(this.ctx);
            this.weapons.draw(this.ctx);
            this.player.draw(this.ctx);
        }

        triggerLevelUp() {
            this.gameState = 'LEVEL_UP';
            
            // Generate random options
            const options = [];
            const weaponKeys = Object.keys(CONFIG.WEAPONS);
            
            for(let i=0; i<3; i++) {
                const isNewWeapon = Math.random() > 0.5;
                // Always allow getting new weapons if we don't have them all?
                // Simplified logic for prototype:
                
                if (isNewWeapon) {
                    const key = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
                    const wConfig = CONFIG.WEAPONS[key];
                    options.push({
                        type: 'new_weapon',
                        name: `New: ${wConfig.name}`,
                        description: `Add ${wConfig.name} to your arsenal.`,
                        data: wConfig
                    });
                } else {
                    // Upgrade current weapon (if any)
                    if (this.weapons.weapons.length > 0) {
                        const w = this.weapons.weapons[Math.floor(Math.random() * this.weapons.weapons.length)];
                        options.push({
                            type: 'upgrade_weapon',
                            name: `Upgrade: ${w.name}`,
                            description: `Stats UP! Level: ${w.level + 1}`,
                            data: w
                        });
                    } else {
                        // Fallback to new weapon if no weapons to upgrade
                         const key = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
                         const wConfig = CONFIG.WEAPONS[key];
                         options.push({
                            type: 'new_weapon',
                            name: `New: ${wConfig.name}`,
                            description: `Add ${wConfig.name} to your arsenal.`,
                            data: wConfig
                         });
                    }
                }
            }
            
            this.ui.showLevelUp(options);
        }

        selectUpgrade(option) {
            if (option.type === 'new_weapon') {
                this.weapons.addWeapon(option.data);
            } else if (option.type === 'upgrade_weapon') {
                // option.data is the weapon instance itself
                option.data.upgrade();
            }
            
            this.gameState = 'PLAYING';
            this.lastTime = performance.now();
        }

        endGame() {
            this.gameState = 'GAME_OVER';
            this.ui.showGameOver({
                time: Utils.formatTime(this.gameTime),
                gold: this.goldGainedInRun
            });
        }
    }
    
    // Initialize on Page Load
    window.addEventListener('load', () => {
        const game = new Game();
        window.SURVIVAL.gameInstance = game;
    });

})();
