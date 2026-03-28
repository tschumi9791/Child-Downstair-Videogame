/**
 * Downstairs Dash - Core Game Logic
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('final-score');
const menuOverlay = document.getElementById('menu');
const hudOverlay = document.getElementById('hud');
const gameoverOverlay = document.getElementById('gameover');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game Constants
const GAME_WIDTH = 600;
const GAME_HEIGHT = 800;
const PLAYER_SIZE = 40;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const SPEED = 6;
const FRICTION = 0.8;
const PLATFORM_HEIGHT = 20;
const PLATFORM_GAP_MIN = 80;
const PLATFORM_GAP_MAX = 150;
const INITIAL_SCROLL_SPEED = 2;
const SCROLL_ACCELERATION = 0.0005;

// Platform Types
const PLATFORM_TYPES = {
    NORMAL: { color: '#475569', friction: 0.8, jumpMult: 1 },
    BOUNCY: { color: '#10b981', friction: 0.8, jumpMult: 1.6 },
    SLIPPERY: { color: '#f59e0b', friction: 0.98, jumpMult: 1 }
};

// Game State
let state = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let level = 1;
let scrollSpeed = INITIAL_SCROLL_SPEED;
let platforms = [];
let keys = {};
let lastTime = 0;

// Resize canvas
function resize() {
    const container = document.getElementById('game-container');
    const ratio = GAME_WIDTH / GAME_HEIGHT;
    let w = container.clientWidth;
    let h = container.clientHeight;

    if (w / h > ratio) {
        w = h * ratio;
    } else {
        h = w / ratio;
    }

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
}

window.addEventListener('resize', resize);
resize();

// Player Class
class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT / 2;
        this.vx = 0;
        this.vy = 0;
        this.color = '#3b82f6';
        this.onGround = false;
        this.squish = 1;
        this.targetSquish = 1;
        this.currentFriction = FRICTION;
        this.currentJumpMult = 1;
    }

    update() {
        // Horizontal Movement
        const accel = this.onGround ? (this.currentFriction > 0.9 ? 0.5 : 1) : 0.8;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.vx -= accel;
            if (this.vx < -SPEED) this.vx = -SPEED;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.vx += accel;
            if (this.vx > SPEED) this.vx = SPEED;
        } else {
            this.vx *= this.currentFriction;
        }

        this.x += this.vx;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > GAME_WIDTH) this.x = GAME_WIDTH - this.width;

        // Vertical Movement (Gravity)
        this.vy += GRAVITY;
        this.y += this.vy;

        // Jump
        if (this.onGround && (keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' '])) {
            this.vy = JUMP_FORCE * this.currentJumpMult;
            this.onGround = false;
            this.squish = 1.4; // Stretch on jump
        }

        // Reset for next frame - will be set in checkCollisions if on ground
        this.onGround = false;
        this.currentFriction = FRICTION;
        this.currentJumpMult = 1;

        // Squish logic
        this.squish += (this.targetSquish - this.squish) * 0.2;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height);
        ctx.scale(1 / this.squish, this.squish);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        // Draw relative to bottom center
        ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
        ctx.restore();
    }
}

// Platform Class
class Platform {
    constructor(y, isInitial = false) {
        this.y = y;
        this.height = PLATFORM_HEIGHT;
        
        // Randomly pick a type
        const rand = Math.random();
        if (isInitial || rand < 0.7) {
            this.type = 'NORMAL';
        } else if (rand < 0.85) {
            this.type = 'BOUNCY';
        } else {
            this.type = 'SLIPPERY';
        }
        
        this.color = PLATFORM_TYPES[this.type].color;
        
        // Create a gap
        const gapWidth = Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN) + PLATFORM_GAP_MIN + 20;
        const gapX = Math.random() * (GAME_WIDTH - gapWidth);

        this.rects = [
            { x: 0, width: gapX },
            { x: gapX + gapWidth, width: GAME_WIDTH - (gapX + gapWidth) }
        ];
    }

    update(speed) {
        this.y -= speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        this.rects.forEach(rect => {
            if (rect.width > 0) {
                ctx.fillRect(rect.x, this.y, rect.width, this.height);
            }
        });
    }
}

const player = new Player();

function initGame() {
    score = 0;
    level = 1;
    scrollSpeed = INITIAL_SCROLL_SPEED;
    platforms = [];
    player.reset();
    updateHUD();

    // Create initial platforms
    for (let i = 0; i < 6; i++) {
        platforms.push(new Platform(GAME_HEIGHT - i * 150, true));
    }
    
    // Ensure player starts on a platform
    const startPlatform = platforms[0];
    player.y = startPlatform.y - player.height - 10;
    player.x = (startPlatform.rects[0].width > 0) ? startPlatform.rects[0].width / 2 : GAME_WIDTH - 50;
}

function spawnPlatforms() {
    if (platforms.length === 0 || platforms[platforms.length - 1].y < GAME_HEIGHT - 150) {
        platforms.push(new Platform(GAME_HEIGHT));
    }
}

function checkCollisions() {
    platforms.forEach(platform => {
        platform.rects.forEach(rect => {
            if (rect.width <= 0) return;

            // Player bottom hit platform top
            if (player.vy >= 0 &&
                player.x + player.width > rect.x &&
                player.x < rect.x + rect.width &&
                player.y + player.height > platform.y &&
                player.y + player.height < platform.y + platform.height + player.vy) {
                
                if (!player.onGround) {
                    player.squish = 0.6; // Squish on land
                }
                player.y = platform.y - player.height;
                player.vy = -scrollSpeed; // Match platform speed
                player.onGround = true;
                player.currentFriction = PLATFORM_TYPES[platform.type].friction;
                player.currentJumpMult = PLATFORM_TYPES[platform.type].jumpMult;
            }
        });
    });

    // Death conditions
    if (player.y + player.height < 0 || player.y > GAME_HEIGHT) {
        gameOver();
    }
}

function gameOver() {
    state = 'GAMEOVER';
    finalScoreElement.innerText = Math.floor(score);
    gameoverOverlay.classList.remove('hidden');
    hudOverlay.classList.add('hidden');
}

function start() {
    state = 'PLAYING';
    initGame();
    menuOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    hudOverlay.classList.remove('hidden');
}

function updateHUD() {
    scoreElement.innerText = Math.floor(score);
    levelElement.innerText = level;
}

// Input Handling
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

startBtn.addEventListener('click', start);
restartBtn.addEventListener('click', start);

function update(time) {
    const dt = time - lastTime;
    lastTime = time;

    if (state === 'PLAYING') {
        player.update();
        
        scrollSpeed += SCROLL_ACCELERATION;
        score += scrollSpeed * 0.05;
        
        // Level logic
        const newLevel = Math.floor(score / 500) + 1;
        if (newLevel > level) {
            level = newLevel;
        }
        
        updateHUD();

        platforms.forEach(p => p.update(scrollSpeed));
        platforms = platforms.filter(p => p.y + p.height > 0);

        spawnPlatforms();
        checkCollisions();
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (state === 'PLAYING' || state === 'GAMEOVER') {
        platforms.forEach(p => p.draw());
        player.draw();
    }
}

requestAnimationFrame(update);
