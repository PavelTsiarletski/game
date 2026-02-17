import { CONFIG } from './config.js';

export class UIManager {
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
            
            // Containers
            cardsContainer: document.getElementById('cards-container'),
            upgradesContainer: document.getElementById('upgrades-container'),
            shopGold: document.getElementById('shop-gold'),
            
            // Game Over
            finalTime: document.getElementById('final-time'),
            goldEarned: document.getElementById('gold-earned'),
        };

        this.floatingTexts = [];
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.game.startGame());
        document.getElementById('shop-btn').addEventListener('click', () => this.showShop());
        document.getElementById('back-btn').addEventListener('click', () => this.showMenu()); // Back from shop
        document.getElementById('restart-btn').addEventListener('click', () => this.game.startGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('resume-btn').addEventListener('click', () => this.game.togglePause()); // Resume
        document.getElementById('quit-btn').addEventListener('click', () => this.showMenu());
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

    updateHUD(player, time, kills) {
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
    }

    renderShop() {
        // Needs access to persistent stats via game/player
        const stats = this.game.player.persistentStats;
        this.elements.shopGold.textContent = stats.gold;
        this.elements.upgradesContainer.innerHTML = '';

        const upgrades = [
            { id: 'damage', name: 'Increase Damage', cost: 100, key: 'damageMultiplier', inc: 0.1 },
            { id: 'health', name: 'Max Health', cost: 100, key: 'maxHpMultiplier', inc: 0.1 },
            { id: 'speed', name: 'Movement Speed', cost: 150, key: 'speedMultiplier', inc: 0.05 },
        ];

        upgrades.forEach(upg => {
            const currentVal = stats[upg.key] || 1;
            // Scale cost? 
            const currentCost = Math.floor(upg.cost * currentVal * 2); 

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
