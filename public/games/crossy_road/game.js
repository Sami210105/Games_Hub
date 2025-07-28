// Game Constants (now let for difficulty adjustment)
let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;
const CELL_SIZE = 60;
const ROAD_HEIGHT = CELL_SIZE;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
let VEHICLE_MIN_SPEED = 2; // Will be adjusted by difficulty
let VEHICLE_MAX_SPEED = 4; // Will be adjusted by difficulty
let VEHICLE_SPAWN_RATE = 1000; // Will be adjusted by difficulty
const ROAD_SPAWN_RATE = 2000;
const GRASS_SPAWN_RATE = 2000;
const MAX_VEHICLES = 10;
const ROAD_COUNT = 5;
const GRASS_COUNT = 5;

// Game Variables
let canvas, ctx;
let gameRunning = false;
let score = 0;
let lastVehicleSpawn = 0;
let lastRoadSpawn = 0;
let lastGrassSpawn = 0;
let scrollOffset = 0;
let player;
let vehicles = [];
let roads = [];
let grassPatches = [];
let animationId;
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// DOM Elements
let startScreen, difficultyScreen, gameOverScreen, startButton, restartButton;
let scoreDisplay, finalScoreDisplay;

// Initialize the game
function init() {
    // Get DOM elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    startScreen = document.getElementById('start-screen');
    difficultyScreen = document.getElementById('difficulty-screen');
    gameOverScreen = document.getElementById('game-over-screen');
    startButton = document.getElementById('start-button');
    restartButton = document.getElementById('restart-button');
    scoreDisplay = document.getElementById('score-display');
    finalScoreDisplay = document.getElementById('final-score');
    
    // Set up difficulty buttons
    document.querySelectorAll('.difficulty-button').forEach(button => {
        button.addEventListener('click', function() {
            setDifficulty(this.getAttribute('data-difficulty'));
            difficultyScreen.style.display = 'none';
            startGame();
        });
    });
    
    // Set canvas size
    resizeCanvas();
    
    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    startButton.addEventListener('click', function() {
        startScreen.style.display = 'none';
        difficultyScreen.style.display = 'flex';
    });
    
    restartButton.addEventListener('click', restartGame);
    
    // Initial game state
    resetGame();
}

// Set difficulty level
function setDifficulty(difficulty) {
    switch(difficulty) {
        case 'easy':
            VEHICLE_MIN_SPEED = 1.5;
            VEHICLE_MAX_SPEED = 3;
            VEHICLE_SPAWN_RATE = 1500;
            break;
        case 'medium':
            VEHICLE_MIN_SPEED = 2;
            VEHICLE_MAX_SPEED = 4;
            VEHICLE_SPAWN_RATE = 1000;
            break;
        case 'hard':
            VEHICLE_MIN_SPEED = 2.5;
            VEHICLE_MAX_SPEED = 5;
            VEHICLE_SPAWN_RATE = 800;
            break;
    }
}

// Resize canvas to fit window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (gameRunning) {
        player.x = Math.min(player.x, canvas.width - PLAYER_WIDTH);
    }
}

// Reset game state
function resetGame() {
    score = 0;
    scrollOffset = 0;
    vehicles = [];
    roads = [];
    grassPatches = [];
    
    // Create initial roads and grass patches
    for (let i = 0; i < ROAD_COUNT; i++) {
        spawnRoad(-i * ROAD_HEIGHT);
    }
    
    for (let i = 0; i < GRASS_COUNT; i++) {
        spawnGrass(-i * CELL_SIZE);
    }
    
    // Create player
    player = {
        x: canvas.width / 2 - PLAYER_WIDTH / 2,
        y: canvas.height - PLAYER_HEIGHT - 20,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        moving: false,
        direction: null
    };
    
    updateScoreDisplay();
}

// Start the game
function startGame() {
    resetGame();
    gameRunning = true;
    gameOverScreen.style.display = 'none';
    lastVehicleSpawn = Date.now();
    lastRoadSpawn = Date.now();
    lastGrassSpawn = Date.now();
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    gameLoop();
}

// Game over
function gameOver() {
    gameRunning = false;
    gameOverScreen.style.display = 'flex';
    finalScoreDisplay.textContent = score;
    cancelAnimationFrame(animationId);
}

// Restart game
function restartGame() {
    gameOverScreen.style.display = 'none';
    difficultyScreen.style.display = 'flex';
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    updatePlayer();
    updateVehicles();
    updateRoads();
    updateGrassPatches();
    checkCollisions();
    
    // Spawn new elements
    const now = Date.now();
    if (now - lastVehicleSpawn > VEHICLE_SPAWN_RATE && vehicles.length < MAX_VEHICLES) {
        spawnVehicle();
        lastVehicleSpawn = now;
    }
    
    if (now - lastRoadSpawn > ROAD_SPAWN_RATE) {
        spawnRoad(getLowestRoad() - ROAD_HEIGHT);
        lastRoadSpawn = now;
    }
    
    if (now - lastGrassSpawn > GRASS_SPAWN_RATE) {
        spawnGrass(getLowestGrass() - CELL_SIZE);
        lastGrassSpawn = now;
    }
    
    // Draw everything
    drawGrassPatches();
    drawRoads();
    drawVehicles();
    drawPlayer();
    
    animationId = requestAnimationFrame(gameLoop);
}

// [ALL YOUR EXISTING GAME FUNCTIONS REMAIN EXACTLY THE SAME FROM HERE]
// updatePlayer(), updateVehicles(), updateRoads(), updateGrassPatches(), 
// checkCollisions(), spawnVehicle(), spawnRoad(), spawnGrass(), 
// getRandomRoadY(), getLowestRoad(), getLowestGrass(), drawPlayer(), 
// drawVehicles(), getVehicleColor(), drawRoads(), drawGrassPatches(), 
// drawGrassBlade(), updateScoreDisplay(), handleKeyDown(), handleKeyUp()

// Update player position
function updatePlayer() {
    if (player.moving) {
        const moveSpeed = 5;
        let moved = false;
        
        if (player.direction === 'up' && player.y > 0) {
            player.y -= moveSpeed;
            moved = true;
            // Scoring - 1 point per upward move
            score++;
            updateScoreDisplay();
        } else if (player.direction === 'down' && player.y < canvas.height - player.height) {
            player.y += moveSpeed;
            moved = true;
        } else if (player.direction === 'left' && player.x > 0) {
            player.x -= moveSpeed;
            moved = true;
        } else if (player.direction === 'right' && player.x < canvas.width - player.width) {
            player.x += moveSpeed;
            moved = true;
        }
        
        const targetX = Math.round(player.x / CELL_SIZE) * CELL_SIZE;
        const targetY = Math.round(player.y / CELL_SIZE) * CELL_SIZE;
        
        if (Math.abs(player.x - targetX) < moveSpeed && Math.abs(player.y - targetY) < moveSpeed) {
            player.x = targetX;
            player.y = targetY;
            player.moving = false;
            player.direction = null;
        }
        
        if (moved && player.y < canvas.height / 3) {
            const scrollAmount = canvas.height / 3 - player.y;
            scrollOffset += scrollAmount;
            player.y = canvas.height / 3;
            
            vehicles.forEach(v => v.y += scrollAmount);
            roads.forEach(r => r.y += scrollAmount);
            grassPatches.forEach(g => g.y += scrollAmount);
        }
    }
}

// Update vehicles
function updateVehicles() {
    for (let i = vehicles.length - 1; i >= 0; i--) {
        const vehicle = vehicles[i];
        
        if (vehicle.direction === 'left') {
            vehicle.x -= vehicle.speed;
            if (vehicle.x + vehicle.width < 0) vehicles.splice(i, 1);
        } else {
            vehicle.x += vehicle.speed;
            if (vehicle.x > canvas.width) vehicles.splice(i, 1);
        }
    }
}

// Update roads
function updateRoads() {
    for (let i = roads.length - 1; i >= 0; i--) {
        if (roads[i].y > canvas.height) roads.splice(i, 1);
    }
}

// Update grass patches
function updateGrassPatches() {
    for (let i = grassPatches.length - 1; i >= 0; i--) {
        if (grassPatches[i].y > canvas.height) grassPatches.splice(i, 1);
    }
}

// Check for collisions
function checkCollisions() {
    // Vehicle collisions
    for (const vehicle of vehicles) {
        if (player.x < vehicle.x + vehicle.width &&
            player.x + player.width > vehicle.x &&
            player.y < vehicle.y + vehicle.height &&
            player.y + player.height > vehicle.y) {
            gameOver();
            return;
        }
    }
    
    // Fell off bottom
    if (player.y + player.height > canvas.height) {
        gameOver();
    }
}

// Spawn a new vehicle
function spawnVehicle() {
    const types = ['car', 'truck', 'bike'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width, height;
    
    switch (type) {
        case 'car': width = 80; height = 40; break;
        case 'truck': width = 120; height = 50; break;
        case 'bike': width = 50; height = 30; break;
        default: width = 80; height = 40;
    }
    
    const direction = Math.random() > 0.5 ? 'right' : 'left';
    const x = direction === 'right' ? -width : canvas.width;
    const y = getRandomRoadY() + (ROAD_HEIGHT - height) / 2;
    const speed = VEHICLE_MIN_SPEED + Math.random() * (VEHICLE_MAX_SPEED - VEHICLE_MIN_SPEED);
    
    vehicles.push({ x, y, width, height, speed, direction, type });
}

// Spawn a new road
function spawnRoad(y) {
    roads.push({ y, height: ROAD_HEIGHT });
}

// Spawn a new grass patch
function spawnGrass(y) {
    grassPatches.push({ y, height: CELL_SIZE });
}

// Get Y position of a random road
function getRandomRoadY() {
    return roads.length ? roads[Math.floor(Math.random() * roads.length)].y : 0;
}

// Get Y position of the lowest road
function getLowestRoad() {
    return roads.length ? Math.min(...roads.map(r => r.y)) : 0;
}

// Get Y position of the lowest grass patch
function getLowestGrass() {
    return grassPatches.length ? Math.min(...grassPatches.map(g => g.y)) : 0;
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Head
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + 15, 10, 0, Math.PI*2);
    ctx.fill();
    
    // Body
    ctx.fillStyle = '#4682B4';
    ctx.fillRect(player.x + 5, player.y + 25, player.width - 10, player.height - 30);
}

// Draw vehicles
function drawVehicles() {
    vehicles.forEach(v => {
        // Body
        ctx.fillStyle = getVehicleColor(v.type);
        ctx.fillRect(v.x, v.y, v.width, v.height);
        
        // Windows
        ctx.fillStyle = '#ADD8E6';
        const winW = v.type === 'truck' ? 25 : 20;
        const winH = 15;
        const winY = v.y + 5;
        
        if (v.type === 'truck') {
            ctx.fillRect(v.x + 10, winY, winW, winH);
            ctx.fillRect(v.x + 45, winY, winW, winH);
            ctx.fillRect(v.x + 80, winY, winW, winH);
        } else {
            ctx.fillRect(v.x + 10, winY, winW, winH);
            if (v.type === 'car') ctx.fillRect(v.x + v.width - 30, winY, winW, winH);
        }
        
        // Wheels
        ctx.fillStyle = '#000';
        const wheelY = v.y + v.height - 5;
        ctx.beginPath();
        ctx.arc(v.x + (v.direction === 'right' ? 15 : v.width - 15), wheelY, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(v.x + (v.direction === 'right' ? v.width - 15 : 15), wheelY, 8, 0, Math.PI*2);
        ctx.fill();
    });
}

function getVehicleColor(type) {
    switch(type) {
        case 'car': return '#4682B4';
        case 'truck': return '#8B4513';
        case 'bike': return '#FF4500';
        default: return '#4682B4';
    }
}

// Draw roads
function drawRoads() {
    roads.forEach(r => {
        // Road surface
        ctx.fillStyle = '#333';
        ctx.fillRect(0, r.y, canvas.width, r.height);
        
        // Lane markings
        ctx.fillStyle = '#FFD700';
        for (let x = 20; x < canvas.width; x += 60) {
            ctx.fillRect(x, r.y + (r.height - 5)/2, 30, 5);
        }
    });
}

// Draw grass patches
function drawGrassPatches() {
    grassPatches.forEach(g => {
        // Grass base
        ctx.fillStyle = '#7CFC00';
        ctx.fillRect(0, g.y, canvas.width, g.height);
        
        // Grass details
        ctx.fillStyle = '#228B22';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = g.y + Math.random() * g.height;
            drawGrassBlade(x, y, 3, 15 + Math.random() * 10);
        }
    });
}

// Draw a single grass blade
function drawGrassBlade(x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w/2, y - h/2, x, y - h);
    ctx.quadraticCurveTo(x - w/2, y - h/2, x, y);
    ctx.fill();
}

// Update score display
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}

// Handle keyboard input
function handleKeyDown(e) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!gameRunning || player.moving) return;
        
        switch(e.key) {
            case 'ArrowUp': player.direction = 'up'; break;
            case 'ArrowDown': player.direction = 'down'; break;
            case 'ArrowLeft': player.direction = 'left'; break;
            case 'ArrowRight': player.direction = 'right'; break;
        }
        player.moving = true;
        keys[e.key] = true;
    }
}

function handleKeyUp(e) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        keys[e.key] = false;
    }
}

// Start the game when the page loads
window.addEventListener('load', init);