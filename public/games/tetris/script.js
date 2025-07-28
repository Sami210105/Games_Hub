document.addEventListener('DOMContentLoaded', () => {
    // Screen elements
    const mainMenu = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over');
    const highscoresScreen = document.getElementById('highscores-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const helpScreen = document.getElementById('help-screen');
    const pauseScreen = document.getElementById('pause-screen');
    
    // Buttons
    const startBtn = document.getElementById('start-btn');
    const highscoresBtn = document.getElementById('highscores-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const helpBtn = document.getElementById('help-btn');
    const restartBtn = document.getElementById('restart-btn');
    const menuBtn = document.getElementById('menu-btn');
    const backBtn = document.getElementById('back-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const helpBackBtn = document.getElementById('help-back-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const quitBtn = document.getElementById('quit-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    // Game elements
    const canvas = document.getElementById('tetris-canvas');
    const nextCanvas = document.getElementById('next-canvas');
    const ctx = canvas.getContext('2d');
    const nextCtx = nextCanvas.getContext('2d');
    const scoreDisplay = document.getElementById('score-display');
    const levelDisplay = document.getElementById('level-display');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalLevelDisplay = document.getElementById('final-level');
    
    // Game constants
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30;
    const COLORS = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
    const NEON_COLORS = [null, '#ff3366', '#00f3ff', '#00ff99', '#cc33ff', '#ff9933', '#ffff33', '#3366ff'];
    
    // Game variables
    let score = 0;
    let level = 1;
    let lines = 0;
    let gameOver = false;
    let isPaused = false;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let animationId = null;
    let player = { pos: {x: 0, y: 0}, matrix: null, next: null, score: 0 };
    let arena = createMatrix(COLS, ROWS);
    let currentTheme = 'neon';
    
    // Initialize game
    function initGame() {
        showScreen(gameScreen);
        score = 0;
        level = 1;
        lines = 0;
        gameOver = false;
        isPaused = false;
        dropInterval = 1000;
        arena = createMatrix(COLS, ROWS);
        player.score = 0;
        player.next = createRandomPiece();
        playerReset();
        updateScore();
        updateLevel();
        update();
    }
    
    // Screen management
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        screen.classList.remove('hidden');
    }
    
    // Event listeners for navigation
    startBtn.addEventListener('click', initGame);
    highscoresBtn.addEventListener('click', () => showScreen(highscoresScreen));
    settingsBtn.addEventListener('click', () => showScreen(settingsScreen));
    helpBtn.addEventListener('click', () => showScreen(helpScreen));
    restartBtn.addEventListener('click', initGame);
    menuBtn.addEventListener('click', () => showScreen(mainMenu));
    backBtn.addEventListener('click', () => showScreen(mainMenu));
    helpBackBtn.addEventListener('click', () => showScreen(mainMenu));
    resumeBtn.addEventListener('click', resumeGame);
    quitBtn.addEventListener('click', () => showScreen(mainMenu));
    pauseBtn.addEventListener('click', togglePause);
    
    // Settings
    saveSettingsBtn.addEventListener('click', () => {
        currentTheme = document.getElementById('theme-select').value;
        showScreen(mainMenu);
    });
    
    // Game functions
    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }
    function createPiece(type) {
        if (type === 'I') return [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        if (type === 'L') return [
            [0, 0, 0],
            [2, 2, 2],
            [2, 0, 0]
        ];
        if (type === 'J') return [
            [0, 0, 0],
            [3, 3, 3],
            [0, 0, 3]
        ];
        if (type === 'O') return [
            [4, 4],
            [4, 4]
        ];
        if (type === 'Z') return [
            [5, 5, 0],
            [0, 5, 5]
        ];
        if (type === 'S') return [
            [0, 6, 6],
            [6, 6, 0]
        ];
        if (type === 'T') return [
            [0, 7, 0],
            [7, 7, 7]
        ];
    }
    
    function createRandomPiece() {
        const pieces = 'ILJOTSZ';
        return createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    }
    
    function drawMatrix(matrix, offset, ctx, isNext = false) {
        const colors = currentTheme === 'neon' ? NEON_COLORS : COLORS;

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const px = (x + offset.x) * BLOCK_SIZE;
                    const py = (y + offset.y) * BLOCK_SIZE;
                    
                    if (currentTheme === 'neon') {
                        ctx.fillStyle = colors[value];
                        ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = colors[value];
                    } else {
                        const gradient = ctx.createLinearGradient(px, py, px + BLOCK_SIZE, py + BLOCK_SIZE);
                        gradient.addColorStop(0, "#fff");
                        gradient.addColorStop(0.5, colors[value]);
                        gradient.addColorStop(1, "#000");
                        ctx.fillStyle = gradient;
                        ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.shadowBlur = 0;
                    }
                    
                    ctx.strokeStyle = '#444';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);

                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                }
            });
        });
    }
    
    function draw() {
        // Clear main canvas
        ctx.fillStyle = currentTheme === 'neon' ? 'rgba(0, 0, 0, 0.8)' : '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw arena
        drawMatrix(arena, {x: 0, y: 0}, ctx);
        
        // Draw current piece
        drawMatrix(player.matrix, player.pos, ctx);
        
        // Clear and draw next piece canvas
        nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        // Calculate position to center the next piece
        const nextPiece = player.next;
        const offsetX = (nextCanvas.width / BLOCK_SIZE - nextPiece[0].length) / 2;
        const offsetY = (nextCanvas.height / BLOCK_SIZE - nextPiece.length) / 2;
        
        drawMatrix(nextPiece, {x: offsetX, y: offsetY}, nextCtx, true);
    }
    
    function merge() {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    function collide() {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] === undefined || arena[y + o.y][x + o.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function rotate(matrix) {
        const N = matrix.length;
        const result = [];
        for (let i = 0; i < N; i++) {
            result.push([]);
            for (let j = 0; j < N; j++) {
                result[i][j] = matrix[N - j - 1][i];
            }
        }
        return result;
    }
    
    function playerMove(dir) {
        if (isPaused || gameOver) return;
        player.pos.x += dir;
        if (collide()) {
            player.pos.x -= dir;
        }
    }
    
    function playerRotate() {
        if (isPaused || gameOver) return;
        
        const pos = player.pos.x;
        const offset = 1;
        const originalMatrix = player.matrix;
        
        const matrixCopy = JSON.parse(JSON.stringify(player.matrix));
        
        if (matrixCopy.length === 2 && matrixCopy[0].length === 2) {
            return; // O piece doesn't rotate
        }
        
        const rotated = matrixCopy[0].map((_, i) => 
            matrixCopy.map(row => row[i]).reverse()
        );
        
        player.matrix = rotated;
        
        const kicks = [0, 1, -1, 2, -2];
        for (const kick of kicks) {
            player.pos.x += kick;
            if (!collide()) {
                return; 
            }
            player.pos.x -= kick; 
        }
        
        player.matrix = originalMatrix;
    }
    
    function playerDrop() {
        if (isPaused || gameOver) return;
        player.pos.y++;
        if (collide()) {
            player.pos.y--;
            merge();
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }
    
    function playerReset() {
        player.matrix = player.next;
        player.next = createRandomPiece();
        player.pos.y = 0;
        player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
        
        if (collide()) {
            showGameOver();
        }
    }
    
    function arenaSweep() {
        let linesCleared = 0;
        outer: for (let y = arena.length - 1; y >= 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) continue outer;
            }
            
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            y++;
            linesCleared++;
        }
        
        if (linesCleared > 0) {
            // Update score based on lines cleared
            const points = [0, 100, 300, 500, 800][linesCleared] * level;
            player.score += points;
            lines += linesCleared;
            
            // Level up every 10 lines
            if (Math.floor(lines / 10) > level - 1) {
                level = Math.floor(lines / 10) + 1;
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
                updateLevel();
            }
            
            updateScore();
        }
    }
    
    function updateScore() {
        scoreDisplay.textContent = `SCORE: ${player.score.toString().padStart(5, '0')}`;
    }
    
    function updateLevel() {
        levelDisplay.textContent = `LEVEL: ${level.toString().padStart(2, '0')}`;
    }
    
    function showGameOver() {
        gameOver = true;
        cancelAnimationFrame(animationId);
        finalScoreDisplay.textContent = player.score.toString().padStart(5, '0');
        finalLevelDisplay.textContent = level.toString().padStart(2, '0');
        showScreen(gameOverScreen);
    }
    
    function togglePause() {
        if (gameOver) return;
        
        isPaused = !isPaused;
        if (isPaused) {
            cancelAnimationFrame(animationId);
            showScreen(pauseScreen);
        } else {
            lastTime = performance.now();
            update();
        }
    }
    
    function resumeGame() {
        isPaused = false;
        lastTime = performance.now();
        showScreen(gameScreen);
        update();
    }
    
    function update(time = 0) {
        if (gameOver || isPaused) return;
        
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        draw();
        animationId = requestAnimationFrame(update);
    }
    
    // Keyboard controls
    document.addEventListener('keydown', event => {
        if (gameOver) return;
        
        switch (event.keyCode) {
            case 37: playerMove(-1); break; // Left
            case 39: playerMove(1); break;  // Right
            case 40: playerDrop(); break;   // Down
            case 38: playerRotate(); break; // Up
            case 32:                       // Space
                while (!collide()) player.pos.y++;
                player.pos.y--;
                merge();
                playerReset();
                arenaSweep();
                updateScore();
                break;
            case 80: togglePause(); break;  // P
        }
    });
    
    // On-screen button controls
    document.getElementById('left-btn').addEventListener('click', () => playerMove(-1));
    document.getElementById('right-btn').addEventListener('click', () => playerMove(1));
    document.getElementById('rotate-btn').addEventListener('click', playerRotate);
    document.getElementById('drop-btn').addEventListener('click', playerDrop);
    
    // Initialize canvas sizes
    function resizeCanvas() {
        canvas.width = COLS * BLOCK_SIZE;
        canvas.height = ROWS * BLOCK_SIZE;
        nextCanvas.width = 4 * BLOCK_SIZE;
        nextCanvas.height = 4 * BLOCK_SIZE;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Show main menu initially
    showScreen(mainMenu);
});
// EXPORT GAME BUTTON HANDLER
document.getElementById("export-btn").addEventListener("click", () => {
  const zip = new JSZip();

  // HTML
  const html = document.documentElement.outerHTML;
  zip.file("index.html", html);

  // CSS
  fetch("style.css")
    .then(res => res.text())
    .then(css => {
      zip.file("style.css", css);

      // Add background from localStorage if present
      const settings = JSON.parse(localStorage.getItem("gameSettings"));
      if (settings?.backgroundImage) {
        zip.file("background.txt", settings.backgroundImage);
        zip.file("prompt.txt", settings.prompt || "");
      }

      // JS
      fetch("script.js")
        .then(res => res.text())
        .then(js => {
          zip.file("script.js", js);

          // Generate zip
          zip.generateAsync({ type: "blob" }).then(content => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = "neon-tetris-export.zip";
            a.click();
          });
        });
    });
});
