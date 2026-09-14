/**
 * =============================================================================
 * CONFIGURAÇÃO DO CAMPO DE VISÃO (FOV) DOS FANTASMAS
 * =============================================================================
 * Altere a constante abaixo para true ou false para exibir ou ocultar o FOV:
 */
const SHOW_GHOST_FOV = false; // <-- [true = EXIBIR FOV | false = OCULTAR FOV]

const FOV_CONFIG = {
    radius: 110,              // Alcance da visão em pixels (~7 blocos)
    angle: Math.PI * 0.75,    // Ângulo do cone de visão frontal (135 graus)
    closeRadius: 36,          // Detecção 360° em proximidade (~2.2 blocos)
    chaseCooldown: 3600       // Tempo (ms) de perseguição após perder o Pac-Man de vista
};

// --- Áudio Sintetizador (Web Audio API) ---
class PacmanAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.munchToggle = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', gainVal = 0.1) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    playMunch() {
        if (this.muted || !this.ctx) return;
        this.munchToggle = !this.munchToggle;
        const freq = this.munchToggle ? 300 : 450;
        this.playTone(freq, 0.08, 'triangle', 0.12);
    }

    playPowerPellet() {
        if (this.muted || !this.ctx) return;
        this.playTone(180, 0.15, 'sawtooth', 0.08);
    }

    playGhostEaten() {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(now + 0.35);
        } catch (e) {}
    }

    playDeath() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            for (let i = 0; i < 10; i++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                const startTime = now + i * 0.08;
                const freq = 600 - i * 45;
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.07);
            }
        } catch (e) {}
    }

    playIntro() {
        if (this.muted || !this.ctx) return;
        const notes = [
            { f: 493.88, d: 0.12 }, { f: 987.77, d: 0.12 }, { f: 739.99, d: 0.12 }, { f: 622.25, d: 0.12 },
            { f: 987.77, d: 0.08 }, { f: 739.99, d: 0.16 }, { f: 622.25, d: 0.20 },
            { f: 523.25, d: 0.12 }, { f: 1046.50, d: 0.12 }, { f: 783.99, d: 0.12 }, { f: 659.25, d: 0.12 },
            { f: 1046.50, d: 0.08 }, { f: 783.99, d: 0.16 }, { f: 659.25, d: 0.20 }
        ];

        let timeOffset = this.ctx.currentTime;
        notes.forEach(n => {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(n.f, timeOffset);

                gain.gain.setValueAtTime(0.08, timeOffset);
                gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + n.d);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(timeOffset);
                osc.stop(timeOffset + n.d);
            } catch (e) {}
            timeOffset += n.d;
        });
    }

    playFruit() {
        this.playTone(880, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.15), 100);
    }
}

// --- Mapa Clássico Namco (28x31) ---
const MAZE_MAP = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#.####.#####.##.#####.####.#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.##### ## #####.######",
    "     #.##### ## #####.#     ",
    "     #.##          ##.#     ",
    "     #.## ###--### ##.#     ",
    "######.## #GGGGGG# ##.######",
    "      .   #GGGGGG#   .      ",
    "######.## #GGGGGG# ##.######",
    "     #.## ######## ##.#     ",
    "     #.##          ##.#     ",
    "     #.## ######## ##.#     ",
    "######.## ######## ##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#.####.#####.##.#####.####.#",
    "#o..##................##..o#",
    "###.##.##.########.##.##.###",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################"
];

const TILE_SIZE = 16;
const COLS = 28;
const ROWS = 31;
const CANVAS_WIDTH = COLS * TILE_SIZE;  // 448
const CANVAS_HEIGHT = ROWS * TILE_SIZE; // 496

// Direções
const DIR = {
    NONE:  { x:  0, y:  0, angle: 0 },
    LEFT:  { x: -1, y:  0, angle: Math.PI },
    RIGHT: { x:  1, y:  0, angle: 0 },
    UP:    { x:  0, y: -1, angle: -Math.PI / 2 },
    DOWN:  { x:  0, y:  1, angle: Math.PI / 2 }
};

// Modos dos Fantasmas
const GHOST_MODE = {
    IN_HOUSE: 'IN_HOUSE',
    EXITING_HOUSE: 'EXITING_HOUSE',
    WANDERING: 'WANDERING',
    CHASE: 'CHASE',
    FRIGHTENED: 'FRIGHTENED',
    EATEN: 'EATEN'
};

// Estados do Jogo
const GAME_STATE = {
    START_SCREEN: 'START_SCREEN',
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    DYING: 'DYING',
    LEVEL_CLEARED: 'LEVEL_CLEARED',
    GAME_OVER: 'GAME_OVER'
};

// --- Motor do Jogo ---
class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new PacmanAudio();

        // Configuração do FOV (exclusiva no código)
        this.showFov = SHOW_GHOST_FOV;

        // Elementos da UI
        this.scoreValEl = document.getElementById('score-val');
        this.highScoreValEl = document.getElementById('high-score-val');
        this.livesDisplayEl = document.getElementById('lives-display');
        this.fruitDisplayEl = document.getElementById('fruit-display');
        this.pauseBtn = document.getElementById('pause-btn');
        this.soundBtn = document.getElementById('sound-btn');

        // Estado do jogo
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pacman_high_score') || '10000', 10);
        this.level = 1;
        this.lives = 3;
        this.state = GAME_STATE.START_SCREEN;

        this.grid = [];
        this.totalPellets = 0;
        this.pelletsRemaining = 0;
        this.frightenedTimer = 0;
        this.frightenedDuration = 8000;
        this.ghostsEatenCombo = 0;

        // Fruta Bônus
        this.fruit = null;
        this.fruitSpawned70 = false;
        this.fruitSpawned170 = false;

        this.popups = [];
        this.pacman = null;
        this.ghosts = [];

        // Timers
        this.lastTime = 0;
        this.readyTimer = 0;
        this.deathTimer = 0;
        this.clearTimer = 0;

        this.initGrid();
        this.initEntities();
        this.initEventListeners();
        this.updateUI();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initGrid() {
        this.grid = [];
        this.totalPellets = 0;
        for (let r = 0; r < ROWS; r++) {
            const rowArr = [];
            for (let c = 0; c < COLS; c++) {
                const char = MAZE_MAP[r][c];
                rowArr.push(char);
                if (char === '.' || char === 'o') {
                    this.totalPellets++;
                }
            }
            this.grid.push(rowArr);
        }
        this.pelletsRemaining = this.totalPellets;
    }

    initEntities() {
        this.pacman = {
            x: 13.5 * TILE_SIZE,
            y: 23 * TILE_SIZE + 8,
            dir: DIR.NONE,
            nextDir: DIR.NONE,
            speed: 84,
            mouthAngle: 0.25,
            mouthSpeed: 6,
            radius: 7,
            alive: true,
            deathProgress: 0
        };

        this.ghosts = [
            {
                name: 'Blinky',
                color: '#ff0000',
                rgbaColor: 'rgba(255, 0, 0',
                x: 13 * TILE_SIZE + 8,
                y: 11 * TILE_SIZE + 8,
                mode: GHOST_MODE.WANDERING,
                dir: DIR.LEFT,
                speed: 74,
                exitDelay: 0,
                houseTimer: 0,
                curTileC: -1,
                curTileR: -1,
                detectedPacman: false,
                chaseTimer: 0,
                lastSeenTarget: null
            },
            {
                name: 'Pinky',
                color: '#ffb8ff',
                rgbaColor: 'rgba(255, 184, 255',
                x: 13.5 * TILE_SIZE,
                y: 14 * TILE_SIZE + 8,
                mode: GHOST_MODE.IN_HOUSE,
                dir: DIR.UP,
                speed: 72,
                exitDelay: 1500,
                houseTimer: 0,
                curTileC: -1,
                curTileR: -1,
                detectedPacman: false,
                chaseTimer: 0,
                lastSeenTarget: null
            },
            {
                name: 'Inky',
                color: '#00ffff',
                rgbaColor: 'rgba(0, 255, 255',
                x: 11.5 * TILE_SIZE,
                y: 14 * TILE_SIZE + 8,
                mode: GHOST_MODE.IN_HOUSE,
                dir: DIR.UP,
                speed: 70,
                exitDelay: 3500,
                houseTimer: 0,
                curTileC: -1,
                curTileR: -1,
                detectedPacman: false,
                chaseTimer: 0,
                lastSeenTarget: null
            },
            {
                name: 'Clyde',
                color: '#ffb852',
                rgbaColor: 'rgba(255, 184, 82',
                x: 15.5 * TILE_SIZE,
                y: 14 * TILE_SIZE + 8,
                mode: GHOST_MODE.IN_HOUSE,
                dir: DIR.UP,
                speed: 68,
                exitDelay: 5500,
                houseTimer: 0,
                curTileC: -1,
                curTileR: -1,
                detectedPacman: false,
                chaseTimer: 0,
                lastSeenTarget: null
            }
        ];

        this.ghosts.forEach(g => {
            g.eaten = false;
        });

        this.fruit = {
            c: 13.5,
            r: 17,
            x: 13.5 * TILE_SIZE,
            y: 17 * TILE_SIZE + 8,
            active: false,
            points: 100 * this.level,
            timer: 0
        };
    }

    resetPositions() {
        this.pacman.x = 13.5 * TILE_SIZE;
        this.pacman.y = 23 * TILE_SIZE + 8;
        this.pacman.dir = DIR.NONE;
        this.pacman.nextDir = DIR.NONE;
        this.pacman.alive = true;
        this.pacman.deathProgress = 0;

        this.ghosts[0].x = 13 * TILE_SIZE + 8;
        this.ghosts[0].y = 11 * TILE_SIZE + 8;
        this.ghosts[0].dir = DIR.LEFT;
        this.ghosts[0].mode = GHOST_MODE.WANDERING;
        this.ghosts[0].curTileC = -1;
        this.ghosts[0].curTileR = -1;
        this.ghosts[0].detectedPacman = false;
        this.ghosts[0].chaseTimer = 0;

        this.ghosts[1].x = 13.5 * TILE_SIZE;
        this.ghosts[1].y = 14 * TILE_SIZE + 8;
        this.ghosts[1].dir = DIR.UP;
        this.ghosts[1].mode = GHOST_MODE.IN_HOUSE;
        this.ghosts[1].houseTimer = 0;
        this.ghosts[1].curTileC = -1;
        this.ghosts[1].curTileR = -1;
        this.ghosts[1].detectedPacman = false;

        this.ghosts[2].x = 11.5 * TILE_SIZE;
        this.ghosts[2].y = 14 * TILE_SIZE + 8;
        this.ghosts[2].dir = DIR.UP;
        this.ghosts[2].mode = GHOST_MODE.IN_HOUSE;
        this.ghosts[2].houseTimer = 0;
        this.ghosts[2].curTileC = -1;
        this.ghosts[2].curTileR = -1;
        this.ghosts[2].detectedPacman = false;

        this.ghosts[3].x = 15.5 * TILE_SIZE;
        this.ghosts[3].y = 14 * TILE_SIZE + 8;
        this.ghosts[3].dir = DIR.UP;
        this.ghosts[3].mode = GHOST_MODE.IN_HOUSE;
        this.ghosts[3].houseTimer = 0;
        this.ghosts[3].curTileC = -1;
        this.ghosts[3].curTileR = -1;
        this.ghosts[3].detectedPacman = false;

        this.ghosts.forEach(g => {
            g.eaten = false;
        });

        this.frightenedTimer = 0;
    }

    startGame() {
        this.audio.init();
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.fruitSpawned70 = false;
        this.fruitSpawned170 = false;
        this.initGrid();
        this.initEntities();
        this.startReadyCountdown();
    }

    startReadyCountdown() {
        this.state = GAME_STATE.READY;
        this.readyTimer = 1800;
        this.resetPositions();
        this.audio.playIntro();
        this.updateUI();
    }

    nextLevel() {
        this.level++;
        this.fruitSpawned70 = false;
        this.fruitSpawned170 = false;
        this.initGrid();
        this.startReadyCountdown();
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.audio.init();

            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === GAME_STATE.START_SCREEN || this.state === GAME_STATE.GAME_OVER) {
                    this.startGame();
                } else {
                    this.togglePause();
                }
                return;
            }

            if (this.state === GAME_STATE.START_SCREEN || this.state === GAME_STATE.GAME_OVER) {
                this.startGame();
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.pacman.nextDir = DIR.LEFT;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.pacman.nextDir = DIR.RIGHT;
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.pacman.nextDir = DIR.UP;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.pacman.nextDir = DIR.DOWN;
                    break;
            }
        });

        // Clique no canvas inicia ou pausa
        this.canvas.addEventListener('click', () => {
            this.audio.init();
            if (this.state === GAME_STATE.START_SCREEN || this.state === GAME_STATE.GAME_OVER) {
                this.startGame();
            }
        });

        this.pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });

        this.soundBtn.addEventListener('click', () => {
            this.audio.init();
            this.audio.muted = !this.audio.muted;
            this.soundBtn.textContent = this.audio.muted ? '[ SOM: OFF ]' : '[ SOM: ON ]';
        });

        // Controles de Toque
        document.querySelectorAll('.dpad-btn').forEach(btn => {
            const handleTouch = (e) => {
                e.preventDefault();
                this.audio.init();
                const dir = btn.dataset.dir;
                this.handleDirInput(dir);
            };
            btn.addEventListener('touchstart', handleTouch, { passive: false });
            btn.addEventListener('click', handleTouch);
        });

        // Swipe no Canvas
        let touchStartX = 0;
        let touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            if (Math.hypot(dx, dy) > 20) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.handleDirInput(dx > 0 ? 'right' : 'left');
                } else {
                    this.handleDirInput(dy > 0 ? 'down' : 'up');
                }
            }
        }, { passive: true });
    }

    handleDirInput(dir) {
        if (this.state === GAME_STATE.START_SCREEN || this.state === GAME_STATE.GAME_OVER) {
            this.startGame();
            return;
        }
        if (dir === 'left') this.pacman.nextDir = DIR.LEFT;
        if (dir === 'right') this.pacman.nextDir = DIR.RIGHT;
        if (dir === 'up') this.pacman.nextDir = DIR.UP;
        if (dir === 'down') this.pacman.nextDir = DIR.DOWN;
    }

    togglePause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this.pauseBtn.textContent = '[ CONTINUAR ]';
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            this.pauseBtn.textContent = '[ PAUSAR ]';
        }
    }

    updateUI() {
        this.scoreValEl.textContent = this.score.toString().padStart(2, '0');
        this.highScoreValEl.textContent = this.highScore.toString();

        // Renderiza vidas clássicas (mini Pac-Man)
        this.livesDisplayEl.innerHTML = '';
        for (let i = 0; i < Math.max(0, this.lives); i++) {
            const lifeCanvas = document.createElement('canvas');
            lifeCanvas.width = 16;
            lifeCanvas.height = 16;
            const lctx = lifeCanvas.getContext('2d');
            lctx.fillStyle = '#ffff00';
            lctx.beginPath();
            lctx.arc(8, 8, 7, 0.25 * Math.PI, 1.75 * Math.PI);
            lctx.lineTo(8, 8);
            lctx.fill();
            this.livesDisplayEl.appendChild(lifeCanvas);
        }

        // Renderiza cereja na barra de status
        if (this.fruitDisplayEl) {
            this.fruitDisplayEl.innerHTML = '';
            const fCanvas = document.createElement('canvas');
            fCanvas.width = 16;
            fCanvas.height = 16;
            const fctx = fCanvas.getContext('2d');
            this.drawCherry(fctx, 8, 9);
            this.fruitDisplayEl.appendChild(fCanvas);
        }
    }

    drawCherry(ctx, x, y) {
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 1, y - 5);
        ctx.quadraticCurveTo(x - 1, y - 8, x - 3, y);
        ctx.moveTo(x + 1, y - 5);
        ctx.quadraticCurveTo(x + 3, y - 7, x + 3, y);
        ctx.stroke();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x - 3, y + 1, 3, 0, Math.PI * 2);
        ctx.arc(x + 3, y + 1, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 4, y, 1, 1);
        ctx.fillRect(x + 2, y, 1, 1);
    }

    isWall(c, r) {
        if (r < 0 || r >= ROWS) return false;
        if (r === 14 && (c < 0 || c >= COLS)) return false;
        if (c < 0 || c >= COLS) return true;
        return this.grid[r][c] === '#';
    }

    isHouseDoor(c, r) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
        return this.grid[r][c] === '-';
    }

    canMove(x, y, dir, isGhost = false, ghostMode = null) {
        if (dir === DIR.NONE) return true;

        const targetX = x + dir.x * 2;
        const targetY = y + dir.y * 2;

        const tileCol1 = Math.floor((targetX - 7) / TILE_SIZE);
        const tileCol2 = Math.floor((targetX + 7) / TILE_SIZE);
        const tileRow1 = Math.floor((targetY - 7) / TILE_SIZE);
        const tileRow2 = Math.floor((targetY + 7) / TILE_SIZE);

        for (let r = tileRow1; r <= tileRow2; r++) {
            for (let c = tileCol1; c <= tileCol2; c++) {
                if (this.isWall(c, r)) return false;
                if (!isGhost && (this.isHouseDoor(c, r) || (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.grid[r][c] === 'G'))) {
                    return false;
                }
                if (isGhost && this.isHouseDoor(c, r)) {
                    if (ghostMode !== GHOST_MODE.EXITING_HOUSE && ghostMode !== GHOST_MODE.EATEN) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    hasLineOfSight(x1, y1, x2, y2) {
        const dist = Math.hypot(x2 - x1, y2 - y1);
        const steps = Math.ceil(dist / 6);
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = x1 + (x2 - x1) * t;
            const checkY = y1 + (y2 - y1) * t;
            const col = Math.floor(checkX / TILE_SIZE);
            const row = Math.floor(checkY / TILE_SIZE);
            if (this.isWall(col, row)) return false;
        }
        return true;
    }

    isPacmanInGhostFov(g) {
        const p = this.pacman;
        if (!p || !p.alive) return false;

        const dist = Math.hypot(p.x - g.x, p.y - g.y);

        if (dist <= FOV_CONFIG.closeRadius) {
            return true;
        }
        if (dist > FOV_CONFIG.radius) {
            return false;
        }

        let ghostAngle = 0;
        if (g.dir === DIR.RIGHT) ghostAngle = 0;
        else if (g.dir === DIR.DOWN) ghostAngle = Math.PI / 2;
        else if (g.dir === DIR.LEFT) ghostAngle = Math.PI;
        else if (g.dir === DIR.UP) ghostAngle = -Math.PI / 2;

        const angleToPac = Math.atan2(p.y - g.y, p.x - g.x);
        let diffAngle = Math.abs(angleToPac - ghostAngle);
        while (diffAngle > Math.PI) {
            diffAngle = Math.abs(diffAngle - 2 * Math.PI);
        }

        if (diffAngle <= FOV_CONFIG.angle / 2) {
            return this.hasLineOfSight(g.x, g.y, p.x, p.y);
        }

        return false;
    }

    updatePacman(dt) {
        const p = this.pacman;
        if (!p.alive) return;

        if (p.nextDir !== DIR.NONE && p.nextDir !== p.dir) {
            if (p.nextDir.x === -p.dir.x && p.nextDir.y === -p.dir.y) {
                p.dir = p.nextDir;
            } else {
                const currentCenterCol = Math.floor(p.x / TILE_SIZE);
                const currentCenterRow = Math.floor(p.y / TILE_SIZE);
                const tileCenterX = currentCenterCol * TILE_SIZE + 8;
                const tileCenterY = currentCenterRow * TILE_SIZE + 8;

                const distToCenter = Math.hypot(p.x - tileCenterX, p.y - tileCenterY);
                if (distToCenter < 4) {
                    if (this.canMove(tileCenterX, tileCenterY, p.nextDir)) {
                        p.x = tileCenterX;
                        p.y = tileCenterY;
                        p.dir = p.nextDir;
                    }
                }
            }
        }

        if (p.dir !== DIR.NONE) {
            const moveDist = p.speed * dt;
            const newX = p.x + p.dir.x * moveDist;
            const newY = p.y + p.dir.y * moveDist;

            if (this.canMove(newX, newY, p.dir)) {
                p.x = newX;
                p.y = newY;
                p.mouthAngle += p.mouthSpeed * dt;
                if (p.mouthAngle > 0.35 || p.mouthAngle < 0.05) {
                    p.mouthSpeed = -p.mouthSpeed;
                }
            } else {
                const c = Math.floor(p.x / TILE_SIZE);
                const r = Math.floor(p.y / TILE_SIZE);
                p.x = c * TILE_SIZE + 8;
                p.y = r * TILE_SIZE + 8;
                p.mouthAngle = 0.2;
            }
        }

        if (p.x < -8) {
            p.x = CANVAS_WIDTH + 8;
        } else if (p.x > CANVAS_WIDTH + 8) {
            p.x = -8;
        }

        const currentC = Math.floor(p.x / TILE_SIZE);
        const currentR = Math.floor(p.y / TILE_SIZE);

        if (currentR >= 0 && currentR < ROWS && currentC >= 0 && currentC < COLS) {
            const cell = this.grid[currentR][currentC];
            if (cell === '.') {
                this.grid[currentR][currentC] = ' ';
                this.pelletsRemaining--;
                this.score += 10;
                this.audio.playMunch();
                this.checkFruitSpawn();
                this.updateUI();
                if (this.pelletsRemaining === 0) {
                    this.triggerLevelCleared();
                }
            } else if (cell === 'o') {
                this.grid[currentR][currentC] = ' ';
                this.pelletsRemaining--;
                this.score += 50;
                this.audio.playPowerPellet();
                this.triggerFrightenedMode();
                this.checkFruitSpawn();
                this.updateUI();
                if (this.pelletsRemaining === 0) {
                    this.triggerLevelCleared();
                }
            }
        }

        if (this.fruit && this.fruit.active) {
            const distFruit = Math.hypot(p.x - this.fruit.x, p.y - this.fruit.y);
            if (distFruit < 12) {
                this.score += this.fruit.points;
                this.fruit.active = false;
                this.audio.playFruit();
                this.addPopup(this.fruit.x, this.fruit.y, this.fruit.points.toString());
                this.updateUI();
            }
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacman_high_score', this.highScore.toString());
        }
    }

    checkFruitSpawn() {
        const eaten = this.totalPellets - this.pelletsRemaining;
        if (!this.fruitSpawned70 && eaten >= 70) {
            this.fruitSpawned70 = true;
            this.fruit.active = true;
            this.fruit.timer = 10000;
        } else if (!this.fruitSpawned170 && eaten >= 170) {
            this.fruitSpawned170 = true;
            this.fruit.active = true;
            this.fruit.timer = 10000;
        }
    }

    triggerFrightenedMode() {
        this.frightenedTimer = this.frightenedDuration;
        this.ghostsEatenCombo = 0;
        this.ghosts.forEach(g => {
            if (g.mode !== GHOST_MODE.IN_HOUSE && g.mode !== GHOST_MODE.EXITING_HOUSE && g.mode !== GHOST_MODE.EATEN) {
                g.mode = GHOST_MODE.FRIGHTENED;
                g.dir = { x: -g.dir.x, y: -g.dir.y, angle: g.dir.angle + Math.PI };
            }
        });
    }

    updateGhosts(dt) {
        if (this.frightenedTimer > 0) {
            this.frightenedTimer -= dt * 1000;
            if (this.frightenedTimer <= 0) {
                this.frightenedTimer = 0;
                this.ghosts.forEach(g => {
                    if (g.mode === GHOST_MODE.FRIGHTENED) {
                        g.mode = GHOST_MODE.WANDERING;
                    }
                });
            }
        }

        this.ghosts.forEach(g => {
            let currentSpeed = g.speed;
            if (g.mode === GHOST_MODE.FRIGHTENED) {
                currentSpeed *= 0.6;
            } else if (g.mode === GHOST_MODE.EATEN) {
                currentSpeed = 160;
            }

            if (g.mode === GHOST_MODE.IN_HOUSE) {
                g.houseTimer += dt * 1000;
                g.y += Math.sin(Date.now() / 200) * 0.3;
                if (g.houseTimer >= g.exitDelay) {
                    g.mode = GHOST_MODE.EXITING_HOUSE;
                }
                return;
            }

            if (g.mode === GHOST_MODE.EXITING_HOUSE) {
                const doorX = 13.5 * TILE_SIZE;
                const doorY = 11 * TILE_SIZE + 8;
                if (Math.abs(g.x - doorX) > 1) {
                    g.x += Math.sign(doorX - g.x) * currentSpeed * dt;
                } else {
                    g.x = doorX;
                    g.y -= currentSpeed * dt;
                    if (g.y <= doorY) {
                        g.y = doorY;
                        g.mode = (this.frightenedTimer > 0) ? GHOST_MODE.FRIGHTENED : GHOST_MODE.WANDERING;
                        g.dir = (Math.random() < 0.5) ? DIR.LEFT : DIR.RIGHT;
                        g.curTileC = Math.floor(g.x / TILE_SIZE);
                        g.curTileR = Math.floor(g.y / TILE_SIZE);
                    }
                }
                return;
            }

            if (g.mode === GHOST_MODE.EATEN) {
                const doorX = 13.5 * TILE_SIZE;
                const doorY = 11 * TILE_SIZE + 8;
                if (Math.hypot(g.x - doorX, g.y - doorY) < 6) {
                    g.x = doorX;
                    g.y = 14 * TILE_SIZE + 8;
                    g.mode = GHOST_MODE.EXITING_HOUSE;
                    g.eaten = false;
                    return;
                }
            }

            if (g.mode !== GHOST_MODE.FRIGHTENED && g.mode !== GHOST_MODE.EATEN) {
                const canSeePacman = this.isPacmanInGhostFov(g);
                if (canSeePacman) {
                    g.detectedPacman = true;
                    g.mode = GHOST_MODE.CHASE;
                    g.chaseTimer = FOV_CONFIG.chaseCooldown;
                    g.lastSeenTarget = {
                        c: Math.floor(this.pacman.x / TILE_SIZE),
                        r: Math.floor(this.pacman.y / TILE_SIZE)
                    };
                } else {
                    if (g.mode === GHOST_MODE.CHASE) {
                        g.chaseTimer -= dt * 1000;
                        if (g.chaseTimer <= 0) {
                            g.detectedPacman = false;
                            g.mode = GHOST_MODE.WANDERING;
                            g.lastSeenTarget = null;
                        }
                    } else {
                        g.detectedPacman = false;
                    }
                }
            } else {
                g.detectedPacman = false;
            }

            if (g.x < -8) {
                g.x = CANVAS_WIDTH + 8;
                g.curTileC = COLS;
            } else if (g.x > CANVAS_WIDTH + 8) {
                g.x = -8;
                g.curTileC = -1;
            }

            const tileC = Math.floor(g.x / TILE_SIZE);
            const tileR = Math.floor(g.y / TILE_SIZE);

            if (tileC !== g.curTileC || tileR !== g.curTileR) {
                g.curTileC = tileC;
                g.curTileR = tileR;

                if (g.dir.x !== 0) g.y = tileR * TILE_SIZE + 8;
                if (g.dir.y !== 0) g.x = tileC * TILE_SIZE + 8;

                const allDirs = [DIR.UP, DIR.LEFT, DIR.DOWN, DIR.RIGHT];
                let available = allDirs.filter(d => {
                    if (d.x === -g.dir.x && d.y === -g.dir.y) return false;
                    const nextC = tileC + d.x;
                    const nextR = tileR + d.y;
                    if (this.isWall(nextC, nextR)) return false;
                    if (this.isHouseDoor(nextC, nextR) && g.mode !== GHOST_MODE.EATEN && g.mode !== GHOST_MODE.EXITING_HOUSE) {
                        return false;
                    }
                    return true;
                });

                if (available.length === 0) {
                    available = [{ x: -g.dir.x, y: -g.dir.y, angle: g.dir.angle + Math.PI }];
                }

                const canContinue = available.some(d => d.x === g.dir.x && d.y === g.dir.y);
                if (!canContinue || available.length > 1) {
                    if (g.mode === GHOST_MODE.EATEN) {
                        const targetDoor = { c: 13, r: 11 };
                        g.dir = this.getBestDirToTarget(tileC, tileR, targetDoor, available);
                    } else if (g.mode === GHOST_MODE.CHASE && (g.detectedPacman || g.lastSeenTarget)) {
                        const target = g.detectedPacman ? {
                            c: Math.floor(this.pacman.x / TILE_SIZE),
                            r: Math.floor(this.pacman.y / TILE_SIZE)
                        } : g.lastSeenTarget;
                        g.dir = this.getBestDirToTarget(tileC, tileR, target, available);
                    } else {
                        const randomIdx = Math.floor(Math.random() * available.length);
                        g.dir = available[randomIdx];
                    }
                }
            }

            g.x += g.dir.x * currentSpeed * dt;
            g.y += g.dir.y * currentSpeed * dt;

            const p = this.pacman;
            if (p.alive) {
                const distPac = Math.hypot(g.x - p.x, g.y - p.y);
                if (distPac < 12) {
                    if (g.mode === GHOST_MODE.FRIGHTENED) {
                        g.mode = GHOST_MODE.EATEN;
                        g.eaten = true;
                        this.ghostsEatenCombo++;
                        const points = 200 * Math.pow(2, this.ghostsEatenCombo - 1);
                        this.score += points;
                        this.audio.playGhostEaten();
                        this.addPopup(g.x, g.y, points.toString());
                        this.updateUI();
                    } else if (g.mode !== GHOST_MODE.EATEN && g.mode !== GHOST_MODE.IN_HOUSE && g.mode !== GHOST_MODE.EXITING_HOUSE) {
                        this.triggerPacmanDeath();
                    }
                }
            }
        });
    }

    getBestDirToTarget(tileC, tileR, target, available) {
        let bestDir = available[0];
        let bestDist = Infinity;
        available.forEach(d => {
            const nextC = tileC + d.x;
            const nextR = tileR + d.y;
            const dist = Math.hypot(nextC - target.c, nextR - target.r);
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = d;
            }
        });
        return bestDir;
    }

    triggerPacmanDeath() {
        this.state = GAME_STATE.DYING;
        this.pacman.alive = false;
        this.deathTimer = 1600;
        this.audio.playDeath();
    }

    triggerLevelCleared() {
        this.state = GAME_STATE.LEVEL_CLEARED;
        this.clearTimer = 2200;
    }

    addPopup(x, y, text) {
        this.popups.push({
            x, y, text,
            alpha: 1.0,
            timer: 800
        });
    }

    updatePopups(dt) {
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            p.y -= 15 * dt;
            p.timer -= dt * 1000;
            p.alpha = Math.max(0, p.timer / 800);
            if (p.timer <= 0) {
                this.popups.splice(i, 1);
            }
        }
    }

    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        if (this.state === GAME_STATE.READY) {
            this.readyTimer -= dt * 1000;
            if (this.readyTimer <= 0) {
                this.state = GAME_STATE.PLAYING;
            }
        } else if (this.state === GAME_STATE.PLAYING) {
            this.updatePacman(dt);
            this.updateGhosts(dt);
            this.updatePopups(dt);

            if (this.fruit && this.fruit.active) {
                this.fruit.timer -= dt * 1000;
                if (this.fruit.timer <= 0) {
                    this.fruit.active = false;
                }
            }
        } else if (this.state === GAME_STATE.DYING) {
            this.pacman.deathProgress += dt * 0.7;
            this.deathTimer -= dt * 1000;
            if (this.deathTimer <= 0) {
                this.lives--;
                this.updateUI();
                if (this.lives > 0) {
                    this.startReadyCountdown();
                } else {
                    this.state = GAME_STATE.GAME_OVER;
                }
            }
        } else if (this.state === GAME_STATE.LEVEL_CLEARED) {
            this.clearTimer -= dt * 1000;
            if (this.clearTimer <= 0) {
                this.nextLevel();
            }
        }

        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.renderMaze(ctx);

        if (this.showFov && (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.READY)) {
            this.renderGhostFOVs(ctx);
        }

        // Fruta Bônus
        if (this.fruit && this.fruit.active) {
            this.drawCherry(ctx, this.fruit.x, this.fruit.y);
        }

        // Fantasmas
        if (this.state !== GAME_STATE.DYING || this.deathTimer > 1200) {
            this.ghosts.forEach(g => this.renderGhost(ctx, g));
        }

        // Pac-Man
        this.renderPacman(ctx);

        // Popups
        this.renderPopups(ctx);

        // --- Mensagens Clássicas de Arcade no Canvas ---
        if (this.state === GAME_STATE.START_SCREEN) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#00ffff';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('1 PLAYER ONLY', CANVAS_WIDTH / 2, 180);

            // Piscar "PRESS SPACE TO PLAY"
            if (Math.floor(Date.now() / 450) % 2 === 0) {
                ctx.fillStyle = '#ffff00';
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.fillText('PRESS SPACE TO PLAY', CANVAS_WIDTH / 2, 280);
            }

            ctx.fillStyle = '#ffb8ff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR PRESS ANY KEY', CANVAS_WIDTH / 2, 310);
        } else if (this.state === GAME_STATE.READY) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffff00';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('PLAYER ONE', CANVAS_WIDTH / 2, 180);

            ctx.fillStyle = '#ffff00';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('READY!', CANVAS_WIDTH / 2, 280);
        } else if (this.state === GAME_STATE.PAUSED) {
            ctx.textAlign = 'center';
            if (Math.floor(Date.now() / 400) % 2 === 0) {
                ctx.fillStyle = '#ffff00';
                ctx.font = '13px "Press Start 2P", monospace';
                ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 280);
            }
        } else if (this.state === GAME_STATE.GAME_OVER) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff0000';
            ctx.font = '13px "Press Start 2P", monospace';
            ctx.fillText('GAME  OVER', CANVAS_WIDTH / 2, 280);

            if (Math.floor(Date.now() / 450) % 2 === 0) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '9px "Press Start 2P", monospace';
                ctx.fillText('PRESS SPACE TO RESTART', CANVAS_WIDTH / 2, 315);
            }
        } else if (this.state === GAME_STATE.LEVEL_CLEARED) {
            if (Math.floor(Date.now() / 150) % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
        }
    }

    renderMaze(ctx) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = this.grid[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                if (cell === '#') {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                    ctx.strokeStyle = '#2121ff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                } else if (cell === '-') {
                    ctx.fillStyle = '#ffb8ff';
                    ctx.fillRect(x, y + 6, TILE_SIZE, 4);
                } else if (cell === '.') {
                    ctx.fillStyle = '#ffb8ae';
                    ctx.beginPath();
                    ctx.arc(x + 8, y + 8, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (cell === 'o') {
                    const pulse = 5 + Math.sin(Date.now() / 120) * 1.5;
                    ctx.fillStyle = '#ffb8ae';
                    ctx.beginPath();
                    ctx.arc(x + 8, y + 8, pulse, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    renderGhostFOVs(ctx) {
        this.ghosts.forEach(g => {
            if (g.mode === GHOST_MODE.IN_HOUSE || g.mode === GHOST_MODE.EXITING_HOUSE || g.mode === GHOST_MODE.EATEN) {
                return;
            }

            ctx.save();

            let ghostAngle = 0;
            if (g.dir === DIR.RIGHT) ghostAngle = 0;
            else if (g.dir === DIR.DOWN) ghostAngle = Math.PI / 2;
            else if (g.dir === DIR.LEFT) ghostAngle = Math.PI;
            else if (g.dir === DIR.UP) ghostAngle = -Math.PI / 2;

            const isAlert = (g.mode === GHOST_MODE.CHASE);
            const isFrightened = (g.mode === GHOST_MODE.FRIGHTENED);

            let coneFill, coneStroke;
            if (isFrightened) {
                coneFill = 'rgba(33, 33, 255, 0.08)';
                coneStroke = 'rgba(33, 33, 255, 0.25)';
            } else if (isAlert) {
                const pulse = 0.22 + Math.sin(Date.now() / 90) * 0.1;
                coneFill = `rgba(255, 0, 0, ${pulse})`;
                coneStroke = 'rgba(255, 0, 0, 0.85)';
            } else {
                coneFill = `${g.rgbaColor}, 0.10)`;
                coneStroke = `${g.rgbaColor}, 0.40)`;
            }

            // 1. Proximidade 360°
            ctx.beginPath();
            ctx.arc(g.x, g.y, FOV_CONFIG.closeRadius, 0, Math.PI * 2);
            ctx.fillStyle = coneFill;
            ctx.fill();
            ctx.strokeStyle = coneStroke;
            ctx.lineWidth = 1;
            ctx.stroke();

            // 2. Cone de visão frontal
            const startAngle = ghostAngle - FOV_CONFIG.angle / 2;
            const endAngle = ghostAngle + FOV_CONFIG.angle / 2;

            ctx.beginPath();
            ctx.moveTo(g.x, g.y);
            ctx.arc(g.x, g.y, FOV_CONFIG.radius, startAngle, endAngle, false);
            ctx.closePath();
            ctx.fillStyle = coneFill;
            ctx.fill();

            ctx.strokeStyle = coneStroke;
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = isAlert ? 1.5 : 1;
            ctx.stroke();
            ctx.setLineDash([]);

            // 3. Linha de rastreio direta se estiver perseguindo
            if (isAlert && this.pacman && this.pacman.alive) {
                ctx.beginPath();
                ctx.moveTo(g.x, g.y);
                ctx.lineTo(this.pacman.x, this.pacman.y);
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
                ctx.setLineDash([2, 3]);
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.restore();
        });
    }

    renderPacman(ctx) {
        const p = this.pacman;
        if (!p.alive && this.state !== GAME_STATE.DYING) return;

        ctx.save();
        ctx.translate(p.x, p.y);

        if (this.state === GAME_STATE.DYING) {
            const progress = Math.min(p.deathProgress, 1);
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            const startAngle = progress * Math.PI;
            const endAngle = (2 - progress) * Math.PI;
            ctx.arc(0, 0, Math.max(0, p.radius * (1 - progress * 0.3)), startAngle, endAngle);
            ctx.lineTo(0, 0);
            ctx.fill();
        } else {
            let rotation = 0;
            if (p.dir === DIR.LEFT) rotation = Math.PI;
            else if (p.dir === DIR.UP) rotation = -Math.PI / 2;
            else if (p.dir === DIR.DOWN) rotation = Math.PI / 2;

            ctx.rotate(rotation);
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            const angle = Math.abs(p.mouthAngle);
            ctx.arc(0, 0, p.radius, angle, Math.PI * 2 - angle);
            ctx.lineTo(0, 0);
            ctx.fill();
        }

        ctx.restore();
    }

    renderGhost(ctx, g) {
        ctx.save();
        ctx.translate(g.x, g.y);

        const r = 7;

        if (g.mode === GHOST_MODE.CHASE && this.showFov) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', 0, -r - 4);
        }

        if (g.mode === GHOST_MODE.EATEN) {
            this.renderGhostEyes(ctx, g);
            ctx.restore();
            return;
        }

        let bodyColor = g.color;
        if (g.mode === GHOST_MODE.FRIGHTENED) {
            if (this.frightenedTimer < 2000 && Math.floor(this.frightenedTimer / 200) % 2 === 0) {
                bodyColor = '#ffffff';
            } else {
                bodyColor = '#2121ff';
            }
        }

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, -1, r, Math.PI, 0, false);
        ctx.lineTo(r, r);

        const wave = Math.sin(Date.now() / 150) * 1.5;
        ctx.lineTo(r - 3, r - 2 + wave);
        ctx.lineTo(r - 7, r);
        ctx.lineTo(0, r - 2 - wave);
        ctx.lineTo(-r + 7, r);
        ctx.lineTo(-r + 3, r - 2 + wave);
        ctx.lineTo(-r, r);
        ctx.closePath();
        ctx.fill();

        if (g.mode === GHOST_MODE.FRIGHTENED) {
            ctx.fillStyle = (bodyColor === '#ffffff') ? '#ff0000' : '#ffb8ae';
            ctx.beginPath();
            ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
            ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-4, 3);
            ctx.lineTo(-2, 1);
            ctx.lineTo(0, 3);
            ctx.lineTo(2, 1);
            ctx.lineTo(4, 3);
            ctx.stroke();
        } else {
            this.renderGhostEyes(ctx, g);
        }

        ctx.restore();
    }

    renderGhostEyes(ctx, g) {
        const eyeOffset = { x: 0, y: 0 };
        if (g.dir === DIR.LEFT) eyeOffset.x = -2;
        if (g.dir === DIR.RIGHT) eyeOffset.x = 2;
        if (g.dir === DIR.UP) eyeOffset.y = -2;
        if (g.dir === DIR.DOWN) eyeOffset.y = 2;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-3 + eyeOffset.x * 0.5, -2 + eyeOffset.y * 0.5, 2.5, 0, Math.PI * 2);
        ctx.arc(3 + eyeOffset.x * 0.5, -2 + eyeOffset.y * 0.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0022ee';
        ctx.beginPath();
        ctx.arc(-3 + eyeOffset.x, -2 + eyeOffset.y, 1.3, 0, Math.PI * 2);
        ctx.arc(3 + eyeOffset.x, -2 + eyeOffset.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderPopups(ctx) {
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        this.popups.forEach(p => {
            ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
            ctx.fillText(p.text, p.x, p.y);
        });
    }
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    window.game = new PacmanGame();
});
