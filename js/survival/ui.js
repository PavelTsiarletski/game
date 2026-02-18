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
        }

        showMenu() {
            this.hideAll();
            this.elements.mainMenu.classList.remove('hidden');
        }

        showShop() {
            this.hideAll();
            this.elements.shopScreen.classList.remove('hidden');
            this.renderShop();
        }
        
        showHUD() {
            this.hideAll();
            this.elements.hud.classList.remove('hidden');
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
                { id: 'damage', name: 'Increase Damage', cost: 10, key: 'damageMultiplier', inc: 0.1 },
                { id: 'health', name: 'Max Health', cost: 10, key: 'maxHpMultiplier', inc: 0.1 },
                { id: 'speed', name: 'Movement Speed', cost: 20, key: 'speedMultiplier', inc: 0.05 },
                // New Upgrades
                { id: 'range', name: 'Attack Zone', cost: 15, key: 'rangeMultiplier', inc: 0.1 },
                { id: 'amount', name: 'Ammo Stock (+Count)', cost: 100, key: 'amountBonus', inc: 1 },
                { id: 'pierce', name: 'Piercing Rounds', cost: 80, key: 'penetrationBonus', inc: 1 },
                { id: 'knockback', name: 'Heavy Impact', cost: 50, key: 'knockbackMultiplier', inc: 0.2 },
            ];

            upgrades.forEach(upg => {
                const currentVal = stats[upg.key] || 1;
                // Scale cost based on current multiplier level
                // (currentVal - 1) / inc gives number of upgrades bought approximately
                const upgradesBought = Math.round((currentVal - 1) / upg.inc);
                // Linear cost scaling: Base + (Bought * Base * 0.5)
                const currentCost = Math.floor(upg.cost + (upgradesBought * upg.cost * 0.5)); 

                const item = document.createElement('div');
                item.className = 'shop-item';
                item.innerHTML = `
                    <h3>${upg.name}</h3>
                    <p>Current: ${(currentVal * 100).toFixed(0)}%</p>
                    <p>Cost: ${currentCost} G</p>
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
                        this.game.player.persistentStats[upg.key] += upg.inc;
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
