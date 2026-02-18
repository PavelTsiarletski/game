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
            // Adaptive Mobile Design
            // Strategy: Maintain aspect ratio or fit width?
            // "Decrease to fit all content" -> Fit everything within view.
            
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            CONFIG.CANVAS_WIDTH = window.innerWidth;
            CONFIG.CANVAS_HEIGHT = window.innerHeight;

            // Optional: You could scale the context here if you wanted a fixed logic resolution
            // but for this game, simply resizing canvas works because entities are relative to pixels.
            // However, to make field "smaller" visually on mobile (so you see more area relative to player size?)
            // or "fit content"? 
            // The user said: "make adaptive mobile design for field (can reduce to fit all game content)"
            // Use CSS transform to fit? Or logic scale?
            // Let's rely on standard resizing but ensure UI scales.
            // The best way for "fit all content" is often to zoom out.
            // Let's add a scale factor if width is small.
            
            this.scale = 1;
            if (window.innerWidth < 600) {
                 this.scale = window.innerWidth / 600; // Zoom out to show at least 600px worth of width? 
                 // Actually, if we zoom out, everything gets smaller.
                 // User wants "Decrease to fit all content" -> simple resize usually handles this if camera follows player.
                 // But here there is no camera, it's a fixed screen?
                 // Player moves around the screen `this.x`, `this.y`.
                 // `Utils.checkBounds` uses CONFIG.CANVAS_WIDTH.
                 // So the field exits ONLY within the canvas.
                 // So "fit all content" just means the canvas IS the field. 
                 // Simple resize is sufficient for "fitting", but maybe things are too big?
                 // Let's leave as is for now, standard resize matches "field fits screen".
            }
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

            // Pickup Magnet Logic
            // Calculate effective range: Base pickup range OR Blaster range (Attack Zone)
            let blasterRange = 0;
            const blaster = this.weapons.weapons.find(w => w.name === 'Blaster');
            if (blaster) {
                blasterRange = blaster.range * (this.player.stats.rangeMultiplier || 1);
            }

            const basePickupRange = this.player.stats.pickupRange || 100;
            const effectiveRange = Math.max(basePickupRange, blasterRange);

            this.enemies.pickups.forEach(p => {
                const dist = Utils.getDistance(this.player.x, this.player.y, p.x, p.y);
                if (dist < effectiveRange) {
                    const angle = Utils.getAngle(p.x, p.y, this.player.x, this.player.y);
                    const speed = 6 + (this.player.level * 0.1); 
                    p.x += Math.cos(angle) * speed;
                    p.y += Math.sin(angle) * speed;
                }
            });

            this.checkCollisions();
            this.checkCollisions();
            this.ui.updateHUD(this.player, Utils.formatTime(this.gameTime), this.kills, this.weapons.weapons);

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
                            // Use projectile specific knockback or default high value for explosion
                            const kForce = proj.knockback ? proj.knockback * 2.5 : 5; 
                            this.createExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage * (this.player.persistentStats.damageMultiplier || 1), kForce);
                            proj.markedForDeletion = true;
                        } else {
                            // Standard Projectile Logic
                            const damage = proj.damage * (this.player.persistentStats.damageMultiplier || 1);
                            
                            // Knockback vector
                            const angle = Utils.getAngle(proj.x, proj.y, enemy.x, enemy.y);
                            const kForce = proj.knockback || 2; 
                            
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

        createExplosion(x, y, radius, damage, knockbackVal) {
            // visual effect (simple circle for now)
            // TODO: Add visual manager for explosions
            
            // Damage area
            this.enemies.enemies.forEach(enemy => {
                const dist = Utils.getDistance(x, y, enemy.x, enemy.y);
                if (dist <= radius) {
                    // Falloff damage? No, full damage for satisfying explosions
                    const angle = Utils.getAngle(x, y, enemy.x, enemy.y);
                    const kForce = knockbackVal || 5; // Big knockback for explosions
                    
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
            
            // Draw Attack Zone (Visual Indicator)
            // "show visually this zone" - implies the effective range of Blaster
            let blasterRange = 0;
            const blaster = this.weapons.weapons.find(w => w.name === 'Blaster');
            if (blaster) {
                blasterRange = blaster.range * (this.player.stats.rangeMultiplier || 1);
            }

            if (blasterRange > 0) {
                this.ctx.beginPath();
                this.ctx.arc(this.player.x, this.player.y, blasterRange, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([10, 10]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            this.weapons.draw(this.ctx);
            this.player.draw(this.ctx);
        }

        triggerLevelUp() {
            this.gameState = 'LEVEL_UP';
            
            const options = [];
            const ownedWeapons = this.weapons.weapons;
            const allWeaponKeys = Object.keys(CONFIG.WEAPONS);
            
            // 1. Identify possible upgrades (Existing weapons)
            const availableUpgrades = ownedWeapons.map(w => ({
                type: 'upgrade_weapon',
                name: `Upgrade: ${w.name}`,
                description: `Stats UP! Level: ${w.level + 1}`,
                data: w
            }));

            // 2. Identify possible new weapons (Not owned)
            const availableNew = allWeaponKeys
                .filter(key => !ownedWeapons.some(w => w.name === CONFIG.WEAPONS[key].name))
                .map(key => {
                    const wConfig = CONFIG.WEAPONS[key];
                    return {
                        type: 'new_weapon',
                        name: `New: ${wConfig.name}`,
                        description: `Add ${wConfig.name} to your arsenal.`,
                        data: wConfig
                    };
                });
            
            // 3. Selection Logic (Prioritize Upgrades)
            // Goal: Show 3 cards. 
            // If we have upgrades, fill mostly with upgrades.
            
            const pool = [];
            
            // Add all upgrades to the pool (maybe weighted higher?)
            // Actually, let's just pick 3 distinct options.
            // Requirement: "if we received a weapon... only its improvement"
            // Let's bias strictly: If we have upgrades, fill slots with them first.
            
            const slots = 3;
            
            // Helper to pick random from array without replacement
            const pickRandom = (arr) => {
                if (arr.length === 0) return null;
                const idx = Math.floor(Math.random() * arr.length);
                return arr.splice(idx, 1)[0];
            };

            // Copy arrays so we can splice
            const possibleUpgrades = [...availableUpgrades];
            const possibleNew = [...availableNew];

            for (let i = 0; i < slots; i++) {
                let choice = null;
                
                // Strong bias: 80% chance for upgrade if available, OR if no new weapons left
                const wantUpgrade = Math.random() < 0.8 || possibleNew.length === 0;
                
                if (wantUpgrade && possibleUpgrades.length > 0) {
                    choice = pickRandom(possibleUpgrades);
                } else if (possibleNew.length > 0) {
                    choice = pickRandom(possibleNew);
                } else if (possibleUpgrades.length > 0) {
                    // Fallback to upgrade if we wanted new but none left
                    choice = pickRandom(possibleUpgrades);
                }
                
                if (choice) {
                    options.push(choice);
                }
            }
            
            // Edge Case: If we didn't fill 3 slots (e.g. only 1 weapon owned and 0 new available),
            // We might just show 1 or 2 cards. That's fine.
            
            // If completely empty (maxed everything? impossible design-wise currently), generate fallback?
            if (options.length === 0) {
                // Should not happen with current logic unless config is broken
                options.push({
                   type: 'heal',
                   name: 'Full Heal',
                   description: 'Restore 100% HP',
                   data: null 
                });
            }

            this.ui.showLevelUp(options);
        }

        selectUpgrade(option) {
            if (option.type === 'new_weapon') {
                this.weapons.addWeapon(option.data);
            } else if (option.type === 'upgrade_weapon') {
                // option.data is the weapon instance itself
                option.data.upgrade();
            } else if (option.type === 'heal') {
                this.player.currentHp = this.player.stats.hp;
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
