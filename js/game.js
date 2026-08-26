/**
 * ITD Space Shooter - Main Game Engine
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Asset Manager
        this.assets = {
            bg: new Image(),
            player: new Image(),
            minion: new Image(),
            boss: new Image(),
            playerBullet: new Image(),
            enemyBullet: new Image()
        };

        this.assetsLoaded = 0;
        this.totalAssets = 6;
        
        // Game States
        this.state = 'START'; // START, PLAYING, PAUSED, GAME_OVER, VICTORY

        // Canvas Resolution & Resize
        this.width = 800;
        this.height = 900;
        this.scale = 1;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Controls State (X-Axis only)
        this.keys = { left: false, right: false, fire: false };
        this.mouseX = this.width / 2;
        this.isPointerDown = false;
        this.usingMouse = false;

        // Statistics
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('itd_shooter_highscore') || '0', 10);
        this.kills = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.bossDefeated = false;

        // Wave & Level Controller
        this.phase = 'MINIONS'; // MINIONS, BOSS_WARNING, BOSS, CLEAR
        this.minionsSpawned = 0;
        this.maxMinions = 25;
        this.minionsKilled = 0;
        this.spawnTimer = 0;

        // Dynamic Objects
        this.player = null;
        this.boss = null;
        this.minions = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.particles = [];
        this.floatingTexts = [];
        this.stars = [];

        // Scrolling BG
        this.bgScrollY = 0;
        this.bgSpeed = 1.5;

        // DOM UI Elements
        this.ui = {
            startScreen: document.getElementById('startScreen'),
            hud: document.getElementById('hud'),
            pauseScreen: document.getElementById('pauseScreen'),
            resultScreen: document.getElementById('resultScreen'),
            bossHpContainer: document.getElementById('bossHpContainer'),
            bossWarning: document.getElementById('bossWarning'),
            scoreText: document.getElementById('scoreText'),
            comboText: document.getElementById('comboText'),
            hpFill: document.getElementById('hpFill'),
            hpValue: document.getElementById('hpValue'),
            shieldFill: document.getElementById('shieldFill'),
            shieldValue: document.getElementById('shieldValue'),
            bossHpFill: document.getElementById('bossHpFill'),
            weaponName: document.getElementById('weaponName'),
            soundIcon: document.getElementById('soundIcon'),
            startHighScore: document.getElementById('startHighScore'),
            // Results
            resultBadge: document.getElementById('resultHeaderBadge'),
            resultTitle: document.getElementById('resultTitle'),
            resultSubtitle: document.getElementById('resultSubtitle'),
            rankValue: document.getElementById('rankValue'),
            resScore: document.getElementById('resScore'),
            resKills: document.getElementById('resKills'),
            resBossDefeated: document.getElementById('resBossDefeated'),
            resTime: document.getElementById('resTime'),
            resCombo: document.getElementById('resCombo'),
            resAccuracy: document.getElementById('resAccuracy')
        };

        this.initStars();
        this.bindEvents();
        this.loadAssets();
    }

    resize() {
        // Maintain aspect ratio while filling 75% viewport container
        const container = document.getElementById('game-viewport') || document.getElementById('app-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        const scaleX = containerWidth / this.width;
        const scaleY = containerHeight / this.height;
        this.scale = Math.min(scaleX, scaleY);
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 1,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
    }

    loadAssets() {
        const onLoad = () => {
            this.assetsLoaded++;
            if (this.assetsLoaded === this.totalAssets) {
                this.initUI();
                requestAnimationFrame((t) => this.loop(t));
            }
        };

        this.assets.bg.src = 'image/bg.png';
        this.assets.bg.onload = onLoad;

        this.assets.player.src = 'image/player.png';
        this.assets.player.onload = onLoad;

        this.assets.minion.src = 'image/level1.png';
        this.assets.minion.onload = onLoad;

        this.assets.boss.src = 'image/boss.png';
        this.assets.boss.onload = onLoad;

        this.assets.playerBullet.src = 'image/player_bullet.png';
        this.assets.playerBullet.onload = onLoad;

        this.assets.enemyBullet.src = 'image/enemy_bullet.png';
        this.assets.enemyBullet.onload = onLoad;
    }

    initUI() {
        this.ui.startHighScore.textContent = this.highScore.toLocaleString();

        document.getElementById('startGameBtn').onclick = () => this.startGame();
        document.getElementById('pauseBtn').onclick = () => this.togglePause();
        document.getElementById('resumeGameBtn').onclick = () => this.togglePause();
        document.getElementById('restartFromPauseBtn').onclick = () => {
            this.togglePause();
            this.startGame();
        };
        document.getElementById('playAgainBtn').onclick = () => this.startGame();
        document.getElementById('mainMenuBtn').onclick = () => this.showStartScreen();

        document.getElementById('soundToggleBtn').onclick = () => {
            const isMuted = audioManager.toggleMute();
            this.ui.soundIcon.innerHTML = isMuted 
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
        };
    }

    bindEvents() {
        // Keyboard controls (X-Axis only)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
            if (e.key === ' ') this.keys.fire = true;
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') this.togglePause();
            }
            this.usingMouse = false;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
            if (e.key === ' ') this.keys.fire = false;
        });

        // Mouse / Touch X-Axis Tracking
        const updatePointerPos = (clientX) => {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = (clientX - rect.left) * (this.width / rect.width);
            this.mouseX = canvasX;
            this.usingMouse = true;
        };

        this.canvas.addEventListener('mousemove', (e) => {
            updatePointerPos(e.clientX);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            updatePointerPos(e.clientX);
            this.isPointerDown = true;
        });

        window.addEventListener('mouseup', () => {
            this.isPointerDown = false;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                updatePointerPos(e.touches[0].clientX);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                updatePointerPos(e.touches[0].clientX);
                this.isPointerDown = true;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.isPointerDown = false;
        });
    }

    getAspectHeight(img, targetWidth, defaultRatio = 1) {
        if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
            return targetWidth * (img.naturalHeight / img.naturalWidth);
        }
        return targetWidth * defaultRatio;
    }

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.kills = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.startTime = Date.now();
        this.bossDefeated = false;

        this.phase = 'MINIONS';
        this.minionsSpawned = 0;
        this.minionsKilled = 0;
        this.spawnTimer = 0;

        // Player initial state with preserved aspect ratio
        const pWidth = 80;
        const pHeight = this.getAspectHeight(this.assets.player, pWidth, 1);

        this.player = {
            x: this.width / 2,
            y: this.height - 110,
            width: pWidth,
            height: pHeight,
            speed: 8,
            hp: 100,
            maxHp: 100,
            shield: 0,
            maxShield: 100,
            weaponType: 'NORMAL', // NORMAL, TRIPLE
            weaponTimer: 0,
            fireCooldown: 0,
            fireRate: 12, // frames between shots
            invulnerableTimer: 0
        };

        this.boss = null;
        this.minions = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.particles = [];
        this.floatingTexts = [];

        // UI Reset
        this.ui.startScreen.classList.add('hidden');
        this.ui.pauseScreen.classList.add('hidden');
        this.ui.resultScreen.classList.add('hidden');
        this.ui.bossHpContainer.classList.add('hidden');
        this.ui.bossWarning.classList.add('hidden');
        this.ui.hud.classList.remove('hidden');

        this.updateHUD();
    }

    showStartScreen() {
        this.state = 'START';
        this.ui.startScreen.classList.remove('hidden');
        this.ui.hud.classList.add('hidden');
        this.ui.resultScreen.classList.add('hidden');
        this.ui.pauseScreen.classList.add('hidden');
        this.ui.startHighScore.textContent = this.highScore.toLocaleString();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.ui.pauseScreen.classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.ui.pauseScreen.classList.add('hidden');
        }
    }

    // --- GAME LOOP ---
    loop(timestamp) {
        if (this.state === 'PLAYING') {
            this.update();
        }
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    // --- UPDATE LOGIC ---
    update() {
        // 1. Scroll Background
        this.bgScrollY = (this.bgScrollY + this.bgSpeed) % this.height;

        // Starfield
        for (let star of this.stars) {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        }

        // 2. Player Controls (X-Axis only)
        if (this.usingMouse) {
            // Smooth lerp to mouse X position
            this.player.x += (this.mouseX - this.player.x) * 0.2;
        } else {
            if (this.keys.left) this.player.x -= this.player.speed;
            if (this.keys.right) this.player.x += this.player.speed;
        }

        // Clamp player X to screen boundaries
        const halfW = this.player.width / 2;
        this.player.x = Math.max(halfW, Math.min(this.width - halfW, this.player.x));

        // Player Weapon Powerup Countdown
        if (this.player.weaponTimer > 0) {
            this.player.weaponTimer--;
            if (this.player.weaponTimer <= 0) {
                this.player.weaponType = 'NORMAL';
                this.ui.weaponName.textContent = 'NORMAL LASER';
            }
        }

        // Invulnerability countdown
        if (this.player.invulnerableTimer > 0) {
            this.player.invulnerableTimer--;
        }

        // 3. Player Shooting (Auto Fire or Button press)
        this.player.fireCooldown--;
        if (this.player.fireCooldown <= 0) {
            this.shootPlayerBullet();
            this.player.fireCooldown = this.player.weaponType === 'TRIPLE' ? 9 : this.player.fireRate;
        }

        // 4. Wave & Boss Controller
        if (this.phase === 'MINIONS') {
            this.spawnTimer++;
            if (this.spawnTimer > 60 && this.minionsSpawned < this.maxMinions) {
                this.spawnMinion();
                this.spawnTimer = 0;
            }

            // Check if minion phase complete
            if (this.minionsSpawned >= this.maxMinions && this.minions.length === 0) {
                this.triggerBossPhase();
            }
        } else if (this.phase === 'BOSS') {
            if (this.boss) {
                this.updateBoss();
            }
        }

        // 5. Update Minions
        for (let i = this.minions.length - 1; i >= 0; i--) {
            const m = this.minions[i];
            m.y += m.speedY;
            m.x += Math.sin(m.y * 0.03) * m.amplitude;

            // Minion Shooting
            m.fireCooldown--;
            if (m.fireCooldown <= 0 && m.y > 0 && m.y < this.height - 150) {
                this.spawnEnemyBullet(m.x, m.y + m.height / 2, 0, 4);
                m.fireCooldown = Math.floor(Math.random() * 80 + 70);
            }

            // Remove offscreen minions
            if (m.y > this.height + 50) {
                this.minions.splice(i, 1);
            }
        }

        // 6. Update Player Bullets
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            b.x += b.vx;
            b.y += b.vy;

            // Offscreen
            if (b.y < -30 || b.x < -30 || b.x > this.width + 30) {
                this.playerBullets.splice(i, 1);
                continue;
            }

            // Collision with Minions
            let hit = false;
            for (let j = this.minions.length - 1; j >= 0; j--) {
                const m = this.minions[j];
                if (this.checkCollision(b, m)) {
                    hit = true;
                    m.hp -= b.damage;
                    this.shotsHit++;
                    audioManager.playHit();
                    this.createHitParticles(b.x, b.y, '#00f0ff');

                    if (m.hp <= 0) {
                        this.destroyMinion(m, j);
                    }
                    break;
                }
            }

            // Collision with Boss
            if (!hit && this.boss && this.phase === 'BOSS') {
                if (this.checkCollision(b, this.boss)) {
                    hit = true;
                    this.boss.hp -= b.damage;
                    this.shotsHit++;
                    audioManager.playHit();
                    this.createHitParticles(b.x, b.y, '#ff0055');
                    this.updateBossHpBar();

                    if (this.boss.hp <= 0) {
                        this.destroyBoss();
                    }
                }
            }

            if (hit) {
                this.playerBullets.splice(i, 1);
            }
        }

        // 7. Update Enemy Bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.x += eb.vx;
            eb.y += eb.vy;

            // Offscreen
            if (eb.y > this.height + 30 || eb.x < -30 || eb.x > this.width + 30) {
                this.enemyBullets.splice(i, 1);
                continue;
            }

            // Collision with Player
            if (this.player.invulnerableTimer <= 0 && this.checkCollision(eb, this.player)) {
                this.enemyBullets.splice(i, 1);
                this.damagePlayer(eb.damage);
            }
        }

        // 8. Update Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y += 2;

            if (this.checkCollision(p, this.player)) {
                this.collectPowerup(p.type);
                this.powerups.splice(i, 1);
                continue;
            }

            if (p.y > this.height + 20) {
                this.powerups.splice(i, 1);
            }
        }

        // 9. Update Particles & Floating Texts
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life -= pt.decay;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 1;
            ft.life -= 0.02;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        this.updateHUD();
    }

    // --- SHOOTING & ENEMY SPAWNING ---
    shootPlayerBullet() {
        this.shotsFired++;
        audioManager.playShoot();

        const pX = this.player.x;
        const pY = this.player.y - 30;

        const bW = 16;
        const bH = this.getAspectHeight(this.assets.playerBullet, bW, 1.8);

        if (this.player.weaponType === 'TRIPLE') {
            this.playerBullets.push(
                { x: pX - 15, y: pY, vx: -1.5, vy: -12, width: bW, height: bH, damage: 25 },
                { x: pX, y: pY - 5, vx: 0, vy: -13, width: bW * 1.1, height: bH * 1.1, damage: 30 },
                { x: pX + 15, y: pY, vx: 1.5, vy: -12, width: bW, height: bH, damage: 25 }
            );
        } else {
            this.playerBullets.push({
                x: pX,
                y: pY,
                vx: 0,
                vy: -12,
                width: bW,
                height: bH,
                damage: 25
            });
        }
    }

    spawnMinion() {
        this.minionsSpawned++;
        const margin = 60;
        const x = Math.random() * (this.width - margin * 2) + margin;

        const mW = 65;
        const mH = this.getAspectHeight(this.assets.minion, mW, 0.9);

        this.minions.push({
            x: x,
            y: -mH,
            width: mW,
            height: mH,
            hp: 40,
            maxHp: 40,
            speedY: Math.random() * 1.5 + 1.8,
            amplitude: Math.random() * 2 + 1,
            fireCooldown: Math.floor(Math.random() * 60 + 40)
        });
    }

    spawnEnemyBullet(x, y, vx, vy) {
        const ebW = 18;
        const ebH = this.getAspectHeight(this.assets.enemyBullet, ebW, 1);

        this.enemyBullets.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            width: ebW,
            height: ebH,
            damage: 15
        });
    }

    triggerBossPhase() {
        this.phase = 'BOSS_WARNING';
        this.ui.bossWarning.classList.remove('hidden');
        audioManager.playBossAlert();

        setTimeout(() => {
            this.ui.bossWarning.classList.add('hidden');
            this.phase = 'BOSS';
            this.ui.bossHpContainer.classList.remove('hidden');

            const bW = 210;
            const bH = this.getAspectHeight(this.assets.boss, bW, 0.85);

            this.boss = {
                x: this.width / 2,
                y: -bH,
                targetY: 170,
                width: bW,
                height: bH,
                hp: 1500,
                maxHp: 1500,
                vx: 3,
                attackTimer: 0,
                attackPhase: 1
            };
            this.updateBossHpBar();
        }, 3000);
    }

    updateBoss() {
        const b = this.boss;

        // Descend to target position
        if (b.y < b.targetY) {
            b.y += 2;
            return;
        }

        // Horizontal hover movement
        b.x += b.vx;
        if (b.x < b.width / 2 + 20 || b.x > this.width - b.width / 2 - 20) {
            b.vx *= -1;
        }

        // Boss Attack Patterns based on HP percentage
        const hpRatio = b.hp / b.maxHp;
        b.attackTimer++;

        if (hpRatio > 0.6) {
            // Phase 1: Dual Cannon firing
            if (b.attackTimer % 45 === 0) {
                this.spawnEnemyBullet(b.x - 50, b.y + 40, 0, 5);
                this.spawnEnemyBullet(b.x + 50, b.y + 40, 0, 5);
            }
        } else if (hpRatio > 0.3) {
            // Phase 2: Spiral Shot + Rapid Volley
            if (b.attackTimer % 35 === 0) {
                const angle = (b.attackTimer * 0.1);
                this.spawnEnemyBullet(b.x, b.y + 40, Math.sin(angle) * 3, Math.cos(angle) * 3 + 2);
                this.spawnEnemyBullet(b.x - 60, b.y + 30, -1, 5);
                this.spawnEnemyBullet(b.x + 60, b.y + 30, 1, 5);
            }
        } else {
            // Phase 3 (Enraged): Ring Burst
            if (b.attackTimer % 50 === 0) {
                for (let i = 0; i < 8; i++) {
                    const ang = (i / 8) * Math.PI * 2;
                    this.spawnEnemyBullet(b.x, b.y + 40, Math.sin(ang) * 4, Math.cos(ang) * 4 + 1);
                }
            }
            if (b.attackTimer % 20 === 0) {
                const aimVx = (this.player.x - b.x) * 0.01;
                this.spawnEnemyBullet(b.x, b.y + 40, aimVx, 6);
            }
        }
    }

    destroyMinion(minion, index) {
        this.minions.splice(index, 1);
        this.kills++;
        this.minionsKilled++;
        this.score += 100;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        audioManager.playExplosion(false);
        this.createExplosion(minion.x, minion.y, '#ff5500', 18);
        this.addFloatingText(minion.x, minion.y, '+100', '#00f0ff');

        // Chance to drop powerup item (25%)
        if (Math.random() < 0.25) {
            const types = ['HEALTH', 'SHIELD', 'TRIPLE'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerups.push({
                x: minion.x,
                y: minion.y,
                width: 26,
                height: 26,
                type: type
            });
        }
    }

    destroyBoss() {
        this.bossDefeated = true;
        this.score += 3000;
        audioManager.playExplosion(true);
        this.createExplosion(this.boss.x, this.boss.y, '#ff0055', 60);

        this.boss = null;
        this.ui.bossHpContainer.classList.add('hidden');

        setTimeout(() => {
            this.endGame(true);
        }, 1500);
    }

    damagePlayer(amount) {
        audioManager.playHit();
        this.combo = 0; // reset combo on hit

        if (this.player.shield > 0) {
            this.player.shield -= amount;
            if (this.player.shield < 0) {
                this.player.hp += this.player.shield;
                this.player.shield = 0;
            }
        } else {
            this.player.hp -= amount;
        }

        this.player.invulnerableTimer = 20; // flash invulnerability
        this.createExplosion(this.player.x, this.player.y, '#ff0055', 10);

        if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.destroyPlayer();
        }
    }

    destroyPlayer() {
        audioManager.playExplosion(true);
        this.createExplosion(this.player.x, this.player.y, '#00f0ff', 40);

        setTimeout(() => {
            this.endGame(false);
        }, 1000);
    }

    collectPowerup(type) {
        audioManager.playPowerup();
        if (type === 'HEALTH') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
            this.addFloatingText(this.player.x, this.player.y, '+HP REPAIR', '#00ff88');
        } else if (type === 'SHIELD') {
            this.player.shield = Math.min(this.player.maxShield, this.player.shield + 50);
            this.addFloatingText(this.player.x, this.player.y, '+SHIELD', '#00f0ff');
        } else if (type === 'TRIPLE') {
            this.player.weaponType = 'TRIPLE';
            this.player.weaponTimer = 600; // 10 seconds at 60 FPS
            this.ui.weaponName.textContent = 'TRIPLE LASER';
            this.addFloatingText(this.player.x, this.player.y, 'TRIPLE LASER!', '#ffb700');
        }
    }

    endGame(victory) {
        this.state = victory ? 'VICTORY' : 'GAME_OVER';
        this.endTime = Date.now();

        // Update High score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('itd_shooter_highscore', this.highScore.toString());
        }

        // Calculate Stats
        const seconds = Math.floor((this.endTime - this.startTime) / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;

        // Calculate Rank Grade
        let rank = 'C';
        if (victory) {
            rank = this.score >= 5000 ? 'S' : 'A';
        } else {
            rank = this.minionsKilled >= 15 ? 'B' : 'C';
        }

        // Set UI Result Card
        this.ui.resultBadge.textContent = victory ? 'VICTORY' : 'DEFEAT';
        this.ui.resultBadge.className = `result-badge ${victory ? 'victory' : 'defeat'}`;
        this.ui.resultTitle.textContent = victory ? 'MISSION ACCOMPLISHED!' : 'SHIP DESTROYED';
        this.ui.resultSubtitle.textContent = victory 
            ? 'คุณสามารถกำจัดบอสและปกป้องจักรวาลได้สำเร็จ!' 
            : 'ยานของคุณถูกทำลาย! พยายามใหม่อีกครั้ง';

        this.ui.rankValue.textContent = rank;
        this.ui.rankValue.className = `rank-stamp rank-${rank.toLowerCase()}`;

        this.ui.resScore.textContent = this.score.toLocaleString();
        this.ui.resKills.textContent = this.kills;
        this.ui.resBossDefeated.textContent = this.bossDefeated ? 'YES' : 'NO';
        this.ui.resTime.textContent = timeStr;
        this.ui.resCombo.textContent = `x${this.maxCombo}`;
        this.ui.resAccuracy.textContent = `${accuracy}%`;

        this.ui.hud.classList.add('hidden');
        this.ui.resultScreen.classList.remove('hidden');
    }

    // --- UTILITIES & PARTICLES ---
    checkCollision(a, b) {
        return Math.abs(a.x - b.x) * 2 < (a.width + b.width) &&
               Math.abs(a.y - b.y) * 2 < (a.height + b.height);
    }

    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1.0,
                decay: Math.random() * 0.04 + 0.02
            });
        }
    }

    createHitParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 3 + 1,
                color: color,
                life: 1.0,
                decay: 0.08
            });
        }
    }

    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 1.0
        });
    }

    updateHUD() {
        this.ui.scoreText.textContent = this.score.toString().padStart(6, '0');
        this.ui.comboText.textContent = `x${this.combo}`;

        // Player HP
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        this.ui.hpFill.style.width = `${hpPercent}%`;
        this.ui.hpValue.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;

        // Player Shield
        const shieldPercent = (this.player.shield / this.player.maxShield) * 100;
        this.ui.shieldFill.style.width = `${shieldPercent}%`;
        this.ui.shieldValue.textContent = `${Math.ceil(this.player.shield)} / ${this.player.maxShield}`;
    }

    updateBossHpBar() {
        if (!this.boss) return;
        const percent = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
        this.ui.bossHpFill.style.width = `${percent}%`;
    }

    // --- RENDER LOGIC ---
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Scrolling Background Image
        this.ctx.drawImage(this.assets.bg, 0, this.bgScrollY - this.height, this.width, this.height);
        this.ctx.drawImage(this.assets.bg, 0, this.bgScrollY, this.width, this.height);

        // 2. Draw Stars
        this.ctx.fillStyle = '#ffffff';
        for (let star of this.stars) {
            this.ctx.globalAlpha = star.alpha;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        this.ctx.globalAlpha = 1.0;

        if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;

        // 3. Draw Player Thruster Particles
        if (Math.random() < 0.8) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * 15,
                y: this.player.y + 35,
                vx: (Math.random() - 0.5) * 1,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 4 + 2,
                color: '#00f0ff',
                life: 1.0,
                decay: 0.1
            });
        }

        // 4. Draw Player Ship (with hit flash)
        if (this.player.hp > 0) {
            this.ctx.save();
            if (this.player.invulnerableTimer % 4 > 2) {
                this.ctx.globalAlpha = 0.5;
            }
            this.ctx.drawImage(
                this.assets.player,
                this.player.x - this.player.width / 2,
                this.player.y - this.player.height / 2,
                this.player.width,
                this.player.height
            );
            this.ctx.restore();

            // Shield Aura
            if (this.player.shield > 0) {
                this.ctx.save();
                this.ctx.strokeStyle = '#00f0ff';
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#00f0ff';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.arc(this.player.x, this.player.y, this.player.width / 2 + 8, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            }
        }

        // 5. Draw Minions
        for (let m of this.minions) {
            this.ctx.drawImage(
                this.assets.minion,
                m.x - m.width / 2,
                m.y - m.height / 2,
                m.width,
                m.height
            );
        }

        // 6. Draw Boss
        if (this.boss && this.phase === 'BOSS') {
            this.ctx.drawImage(
                this.assets.boss,
                this.boss.x - this.boss.width / 2,
                this.boss.y - this.boss.height / 2,
                this.boss.width,
                this.boss.height
            );
        }

        // 7. Draw Player Bullets (player_bullet.png)
        for (let b of this.playerBullets) {
            this.ctx.save();
            this.ctx.shadowColor = '#00f0ff';
            this.ctx.shadowBlur = 10;
            this.ctx.drawImage(
                this.assets.playerBullet,
                b.x - b.width / 2,
                b.y - b.height / 2,
                b.width,
                b.height
            );
            this.ctx.restore();
        }

        // 8. Draw Enemy Bullets (enemy_bullet.png)
        for (let eb of this.enemyBullets) {
            this.ctx.save();
            this.ctx.shadowColor = '#ff0055';
            this.ctx.shadowBlur = 10;
            this.ctx.drawImage(
                this.assets.enemyBullet,
                eb.x - eb.width / 2,
                eb.y - eb.height / 2,
                eb.width,
                eb.height
            );
            this.ctx.restore();
        }

        // 9. Draw Powerups (Vector icons on canvas)
        for (let p of this.powerups) {
            this.ctx.save();
            let color = '#ffb700';
            if (p.type === 'HEALTH') color = '#00ff88';
            if (p.type === 'SHIELD') color = '#00f0ff';

            this.ctx.fillStyle = color;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 12;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
            this.ctx.fill();

            // Vector icons inside glowing orb
            this.ctx.strokeStyle = '#030712';
            this.ctx.fillStyle = '#030712';
            this.ctx.lineWidth = 2.5;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            if (p.type === 'HEALTH') {
                // Cross symbol (+)
                this.ctx.beginPath();
                this.ctx.moveTo(p.x - 6, p.y);
                this.ctx.lineTo(p.x + 6, p.y);
                this.ctx.moveTo(p.x, p.y - 6);
                this.ctx.lineTo(p.x, p.y + 6);
                this.ctx.stroke();
            } else if (p.type === 'SHIELD') {
                // Shield vector path
                this.ctx.beginPath();
                this.ctx.moveTo(p.x - 5, p.y - 5);
                this.ctx.lineTo(p.x + 5, p.y - 5);
                this.ctx.lineTo(p.x + 5, p.y);
                this.ctx.quadraticCurveTo(p.x + 5, p.y + 6, p.x, p.y + 8);
                this.ctx.quadraticCurveTo(p.x - 5, p.y + 6, p.x - 5, p.y);
                this.ctx.closePath();
                this.ctx.stroke();
            } else {
                // Lightning bolt vector path
                this.ctx.beginPath();
                this.ctx.moveTo(p.x + 1, p.y - 7);
                this.ctx.lineTo(p.x - 4, p.y + 1);
                this.ctx.lineTo(p.x, p.y + 1);
                this.ctx.lineTo(p.x - 1, p.y + 7);
                this.ctx.lineTo(p.x + 4, p.y - 1);
                this.ctx.lineTo(p.x, p.y - 1);
                this.ctx.closePath();
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        // 10. Draw Particles
        for (let pt of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = pt.life;
            this.ctx.fillStyle = pt.color;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 11. Draw Floating Text Popups
        for (let ft of this.floatingTexts) {
            this.ctx.save();
            this.ctx.globalAlpha = ft.life;
            this.ctx.font = '800 14px Orbitron';
            this.ctx.fillStyle = ft.color;
            this.ctx.shadowColor = ft.color;
            this.ctx.shadowBlur = 8;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }
    }
}

// Start Game instance when DOM ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
