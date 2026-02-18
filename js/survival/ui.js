window.SURVIVAL = window.SURVIVAL || {};

(function() {
    const CONFIG = window.SURVIVAL.Config;

    class UIManager {
        constructor(game) {
            this.game = game;
            this.elements = {
                mainMenu: document.getElementById('main-menu'),
                shopScreen: document.getElementById('shop-screen'),
                hud: document.getElementById('hud'),
                levelUpScreen: document.getElementById('level-up-screen'),
                gameOverScreen: document.getElementById('game-over-screen'),
                pauseScreen: document.getElementById('pause-screen'),
                
                // HUD
                xpBar: document.getElementById('xp-bar-fill'),
                levelDisplay: document.getElementById('level-display'),
                timer: document.getElementById('game-timer'),
                kills: document.getElementById('kills'),
                healthBar: document.getElementById('health-bar-fill'),
                healthText: document.getElementById('health-text'),
                weaponsList: document.getElementById('weapons-list'), // New container needs to be created dynamically if not exists or assume user adds it? 
                // Wait, I can't edit HTML file. I should create this element dynamically in the HUD.

                
                // Containers
                cardsContainer: document.getElementById('cards-container'),
                upgradesContainer: document.getElementById('upgrades-container'),
                shopGold: document.getElementById('shop-gold'),
                
                // Game Over
                finalTime: document.getElementById('final-time'),
                goldEarned: document.getElementById('gold-earned'),
            };

            this.floatingTexts = [];
            this.ensureUIElements();
            this.bindEvents();
        }

        ensureUIElements() {
             // Create weapons list container if missing
             if (!document.getElementById('weapons-list')) {
                 const list = document.createElement('div');
                 list.id = 'weapons-list';
                 list.style.position = 'absolute';
                 list.style.bottom = '80px'; 
                 list.style.left = '20px';
                 list.style.display = 'flex';
                 list.style.gap = '10px';
                 list.style.pointerEvents = 'none'; // Don't block clicks
                 this.elements.hud.appendChild(list);
                 this.elements.weaponsList = list;
             }
        }

        bindEvents() {
            const getEl = (id) => document.getElementById(id);
            
            // Check if elements exist before adding listeners to avoid null errors
            if(getEl('start-btn')) getEl('start-btn').addEventListener('click', () => this.game.startGame());
            if(getEl('shop-btn')) getEl('shop-btn').addEventListener('click', () => this.showShop());
            if(getEl('back-btn')) getEl('back-btn').addEventListener('click', () => this.showMenu()); // Back from shop
            if(getEl('restart-btn')) getEl('restart-btn').addEventListener('click', () => this.game.startGame());
            if(getEl('menu-btn')) getEl('menu-btn').addEventListener('click', () => this.showMenu());
            if(getEl('resume-btn')) getEl('resume-btn').addEventListener('click', () => this.game.togglePause()); // Resume
            if(getEl('quit-btn')) getEl('quit-btn').addEventListener('click', () => this.showMenu());
            
            // Global Back Button
            if(getEl('global-back-btn')) {
                getEl('global-back-btn').addEventListener('click', () => {
                    if (this.game.gameState === 'MENU') {
                        // If in Main Menu, go to Index
                        window.location.href = 'index.html';
                    } else if (this.game.gameState === 'PLAYING') {
                        // If successfully playing, Toggle Pause
                        this.game.togglePause();
                    } else if (this.game.gameState === 'PAUSED') {
                        // Already paused? maybe go to menu? Or just Resume?
                        // "Exit from round to menu" -> showMenu
                        // Let's make it intuitive: "Back" usually means "Back to Menu"
                        // But clicking it twice (Pause -> Menu) is safer.
                        // Let's just toggle pause if paused (resume) or show menu?
                        // User request: "button to menu".
                        // If I click "Menu" button while playing, it should probably PAUSE and show "Quit to Menu".
                        this.game.togglePause(); // Will unpause if paused
                    } else {
                        // Game Over or Level Up
                        this.showMenu();
                    }
                });
            }
        }

        showMenu() {
            this.hideAll();
            this.elements.mainMenu.classList.remove('hidden');
            if(document.getElementById('global-back-btn')) document.getElementById('global-back-btn').textContent = '← EXIT';
        }

        showShop() {
            this.hideAll();
            this.elements.shopScreen.classList.remove('hidden');
            this.renderShop();
        }
        
        showHUD() {
            this.hideAll();
            this.elements.hud.classList.remove('hidden');
            if(document.getElementById('global-back-btn')) document.getElementById('global-back-btn').textContent = 'II MENU';
        }

        showLevelUp(options) {
            this.elements.levelUpScreen.classList.remove('hidden');
            this.elements.cardsContainer.innerHTML = '';
            
            options.forEach(opt => {
                const card = document.createElement('div');
                card.className = 'upgrade-card';
                card.innerHTML = `
                    <h3>${opt.name}</h3>
                    <p>${opt.description}</p>
                    <div class="type">${opt.type}</div>
                `;
                card.addEventListener('click', () => {
                    this.game.selectUpgrade(opt);
                    this.elements.levelUpScreen.classList.add('hidden');
                });
                this.elements.cardsContainer.appendChild(card);
            });
        }

        showGameOver(stats) {
            this.elements.gameOverScreen.classList.remove('hidden');
            this.elements.hud.classList.add('hidden');
            this.elements.finalTime.textContent = stats.time;
            this.elements.goldEarned.textContent = stats.gold;
        }
        
        togglePause(isPaused) {
            if (isPaused) {
                this.elements.pauseScreen.classList.remove('hidden');
            } else {
                this.elements.pauseScreen.classList.add('hidden');
            }
        }

        hideAll() {
            document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
            this.elements.hud.classList.add('hidden');
        }

        updateHUD(player, time, kills, weapons) {
            // XP
            const xpPercent = (player.xp / player.maxXp) * 100;
            this.elements.xpBar.style.width = `${xpPercent}%`;
            this.elements.levelDisplay.textContent = `LVL ${player.level}`;
            
            // HP
            const hpPercent = (player.currentHp / player.stats.hp) * 100;
            this.elements.healthBar.style.width = `${hpPercent}%`;
            this.elements.healthText.textContent = `${Math.ceil(player.currentHp)} / ${player.stats.hp}`;

            // Stats
            this.elements.timer.textContent = time;
            this.elements.kills.textContent = kills;
            
            // Update Weapons List
            if (this.elements.weaponsList && weapons) {
                // simple render: Clear and redraw? Or optimize?
                // For now, redraw matches simple style
                this.elements.weaponsList.innerHTML = '';
                weapons.forEach(w => {
                    const el = document.createElement('div');
                    el.className = 'weapon-icon';
                    el.style.background = 'rgba(0,0,0,0.5)';
                    el.style.border = `2px solid ${CONFIG.COLORS.PLAYER}`;
                    el.style.borderRadius = '5px';
                    el.style.padding = '5px';
                    el.style.color = '#fff';
                    el.style.fontSize = '12px';
                    el.style.display = 'flex';
                    el.style.flexDirection = 'column';
                    el.style.alignItems = 'center';
                    
                    el.innerHTML = `
                        <span style="font-weight:bold">${w.name}</span>
                        <span>Lvl ${w.level}</span>
                    `;
                    this.elements.weaponsList.appendChild(el);
                });
            }
        }

        renderShop() {
            // Needs access to persistent stats via game/player
            const stats = this.game.player.persistentStats;
            this.elements.shopGold.textContent = stats.gold;
            this.elements.upgradesContainer.innerHTML = '';

            const upgrades = [
                { 
                    id: 'damage', 
                    name: 'Damage', 
                    cost: 10, 
                    key: 'damageMultiplier', 
                    inc: 0.1,
                    desc: "Increases damage of all weapons.",
                    format: (v) => `Multiplier: ${Math.round(v * 100)}%` 
                },
                { 
                    id: 'health', 
                    name: 'Max Health', 
                    cost: 10, 
                    key: 'maxHpMultiplier', 
                    inc: 0.1,
                    desc: "Increases your maximum Hit Points.",
                    format: (v) => `Multiplier: ${Math.round(v * 100)}%`
                },

                { 
                    id: 'range', 
                    name: 'Attack Zone', 
                    cost: 15, 
                    key: 'rangeMultiplier', 
                    inc: 0.15,
                    desc: "Increases the effective range of your weapons.",
                    format: (v) => `Range: ${Math.round(v * 100)}%`
                },
                { 
                    id: 'amount', 
                    name: 'Ammo Stock', 
                    cost: 100, 
                    key: 'amountBonus', 
                    inc: 1,
                    desc: "Adds more projectiles to every shot.",
                    format: (v) => `Bonus Proj: +${v}`
                },
                { 
                    id: 'pierce', 
                    name: 'Piercing Rounds', 
                    cost: 80, 
                    key: 'penetrationBonus', 
                    inc: 1,
                    desc: "Projectiles pass through more enemies.",
                    format: (v) => `Pierce: +${v}`
                },
                { 
                    id: 'knockback', 
                    name: 'Heavy Impact', 
                    cost: 50, 
                    key: 'knockbackMultiplier', 
                    inc: 0.2,
                    desc: "Pushes enemies back further when hit.",
                    format: (v) => `Force: ${Math.round(v * 100)}%`
                },
            ];

            upgrades.forEach(upg => {
                const currentVal = stats[upg.key] !== undefined ? stats[upg.key] : (upg.key.includes('Multiplier') ? 1 : 0);
                // Fix for bonus stats that start at 0 but might be undefined in old saves
                // Actually persistence check handles defaulting to 0/1 in player.js logic? 
                // Let's assume stats object has correct values or we default them here for display.
                
                // Scale cost based on current multiplier level
                // (currentVal - base) / inc
                const baseVal = upg.key.includes('Multiplier') ? 1 : 0;
                const upgradesBought = Math.max(0, Math.round((currentVal - baseVal) / upg.inc));
                // Linear cost scaling: Base + (Bought * Base * 0.5)
                const currentCost = Math.floor(upg.cost + (upgradesBought * upg.cost * 0.5)); 

                const item = document.createElement('div');
                item.className = 'shop-item';
                item.innerHTML = `
                    <h3>${upg.name}</h3>
                    <p style="font-size:0.8rem; color:#aaa; margin-bottom:5px;">${upg.desc}</p>
                    <p style="color:#fff; font-weight:bold;">${upg.format(currentVal)}</p>
                    <p style="color:#ffd700; margin-top:5px;">Cost: ${currentCost} G</p>
                    <button class="btn" ${stats.gold < currentCost ? 'disabled' : ''}>BUY</button>
                `;
                
                const btn = item.querySelector('button');
                if (stats.gold < currentCost) {
                    btn.style.opacity = 0.5;
                    btn.style.cursor = 'not-allowed';
                }

                btn.addEventListener('click', () => {
                    if (stats.gold >= currentCost) {
                        this.game.player.persistentStats.gold -= currentCost;
                        
                        // Increment
                        let val = this.game.player.persistentStats[upg.key];
                        if (val === undefined) val = baseVal;
                        this.game.player.persistentStats[upg.key] = val + upg.inc;
                        
                        this.game.player.saveProfile();
                        this.renderShop(); // Refresh
                    }
                });

                this.elements.upgradesContainer.appendChild(item);
            });
        }

        // Floating Text System
        spawnFloatingText(x, y, text, color) {
            const el = document.createElement('div');
            el.className = 'floating-text';
            el.textContent = text;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.color = color;
            
            // Append to container (game container) to position relatively
            document.getElementById('game-container').appendChild(el);

            // Remove after animation
            setTimeout(() => el.remove(), 800);
        }
    }
    
    window.SURVIVAL.UIManager = UIManager;
})();
