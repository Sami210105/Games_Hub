document.addEventListener('DOMContentLoaded', () => {
  const player = document.getElementById('player');
  const startButton = document.getElementById('start-button');
  const restartButton = document.getElementById('restart-button');
  const scoreDisplay = document.getElementById('score-display');
  const highScoreDisplay = document.getElementById('high-score-display');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScore = document.getElementById('final-score');
  const finalHighScore = document.getElementById('final-high-score');
  const gameArea = document.getElementById('game-area');

  let gameRunning = false;
  let score = 0;
  let highScore = localStorage.getItem('highScore') || 0;
  let playerY = 0;
  let playerX = 0;
  let playerVelocityY = 0;
  let isJumping = false;
  let gravity = 0.35;
  let speed = 5;
  let jumpPower = 12;
  let obstacles = [];
  let clouds = [];
  let lastObstacleX = -1000;
  let lastCloudX = -1000;

  const groundLevel = 20;
  const playerHeight = 150;

  function createCloud(xPosition) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.style.left = xPosition + 'px';
    cloud.style.top = Math.random() * 100 + 20 + 'px';

    const newCloud = {
      element: cloud,
      x: xPosition,
      speed: 0.5 + Math.random() * 1.5
    };

    gameArea.appendChild(cloud);
    clouds.push(newCloud);
    return newCloud;
  }

  function startGame() {
    gameRunning = true;
    score = 0;
    playerY = 0;
    playerX = 0;
    playerVelocityY = 0;
    isJumping = false;
    obstacles = [];
    clouds = [];
    lastObstacleX = -1000;
    lastCloudX = -1000;

    scoreDisplay.textContent = 'SCORE: 0';
    highScoreDisplay.textContent = `HI: ${highScore}`;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    player.style.left = '150px';
    player.style.bottom = `${groundLevel}px`;

    document.querySelectorAll('.obstacle, .cloud').forEach(el => el.remove());

    for (let i = 0; i < 5; i++) {
      createCloud(Math.random() * window.innerWidth);
    }

    function gameLoop() {
      if (!gameRunning) return;

      playerX += speed;

      if (isJumping) {
        playerY += playerVelocityY;
        playerVelocityY -= gravity;

        if (playerY <= 0) {
          playerY = 0;
          isJumping = false;
          playerVelocityY = 0;
        }

        player.style.bottom = `${groundLevel + playerY}px`;
      } else {
        player.style.bottom = `-10px`;
        playerY = 0;
      }

      if (playerX - lastObstacleX > 400 && Math.random() < 0.1) {
        createObstacle(playerX + window.innerWidth);
        lastObstacleX = playerX;
      }

      if (playerX - lastCloudX > 800 && Math.random() < 0.03) {
        createCloud(playerX + window.innerWidth);
        lastCloudX = playerX;
      }

      // ✅ Safe obstacle cleanup using .filter()
      obstacles = obstacles.filter(obs => {
        const screenX = obs.x - playerX + 150;
        obs.element.style.left = screenX + 'px';

        if (!obs.element.classList.contains('bird')) {
          obs.element.style.bottom = `${groundLevel}px`;
        }

        if (!obs.passed && obs.x < playerX + 50) {
          obs.passed = true;
          score++;
          scoreDisplay.textContent = `SCORE: ${score}`;
        }

        if (obs.x < playerX - 100) {
          obs.element.remove();
          return false;
        }

        return true;
      });

      clouds = clouds.filter((cloud) => {
        const screenX = cloud.x - playerX * (cloud.speed / 3) + 150;
        cloud.element.style.left = screenX + 'px';

        if (cloud.x < playerX - window.innerWidth) {
          cloud.element.remove();
          return false;
        }

        return true;
      });

      checkCollisions();
      requestAnimationFrame(gameLoop);
    }

    gameLoop();
  }

  function createObstacle(xPosition) {
    const obstacle = document.createElement('div');
    const isBird = Math.random() > 0.7;

    obstacle.className = 'obstacle ' + (isBird ? 'bird' : 'cactus');
    obstacle.style.left = '1000px';
    obstacle.style.bottom = isBird ? '160px' : `${groundLevel}px`;

    const newObstacle = {
      element: obstacle,
      x: xPosition,
      passed: false
    };

    gameArea.appendChild(obstacle);
    obstacles.push(newObstacle);
  }

  function checkCollisions() {
    const playerRect = player.getBoundingClientRect();
    const playerTop = playerRect.top + 20;
    const playerBottom = playerRect.bottom - 10;
    const playerLeft = playerRect.left + 25;
    const playerRight = playerRect.right - 25;

    obstacles.forEach(obs => {
      const obsRect = obs.element.getBoundingClientRect();
      const obsTop = obsRect.top + 10;
      const obsBottom = obsRect.bottom - 10;
      const obsLeft = obsRect.left + 5;
      const obsRight = obsRect.right - 5;

      const xOverlap = playerRight > obsLeft && playerLeft < obsRight;
      const yOverlap = playerBottom > obsTop && playerTop < obsBottom;

      if (xOverlap && yOverlap) {
        gameOver();
      }
    });
  }

  function gameOver() {
    gameRunning = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
    }
    finalScore.textContent = score;
    finalHighScore.textContent = highScore;
    gameOverScreen.classList.remove('hidden');
  }

  function jump() {
    if (!isJumping && gameRunning) {
      isJumping = true;
      playerVelocityY = jumpPower;
    }
  }

  startButton.addEventListener('click', startGame);
  restartButton.addEventListener('click', startGame);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
  });
  document.addEventListener('touchstart', jump);
});
  // EXPORT GAME BUTTON
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Game";
  exportBtn.id = "export-btn";
  Object.assign(exportBtn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "999",
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    fontFamily: "monospace",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "5px"
  });
  document.body.appendChild(exportBtn);

  exportBtn.addEventListener("click", async () => {
    const settings = JSON.parse(localStorage.getItem("gameSettings")) || {};
    const bgImage = settings.backgroundImage || "";

    const zip = new JSZip();

    // HTML content
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Speed Runner</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="game-container">
    <div id="game-area">
      <div id="ground"></div>
      <div id="score-display">SCORE: 0</div>
      <div id="high-score-display">HI: 0</div>
      <div id="player"></div>
      <div id="start-screen">
        <h1>SPEED RUNNER</h1>
        <p>Press SPACE to jump</p>
        <button id="start-button">START</button>
      </div>
      <div id="game-over-screen" class="hidden">
        <h1>GAME OVER</h1>
        <p>Your score: <span id="final-score">0</span></p>
        <p>High score: <span id="final-high-score">0</span></p>
        <button id="restart-button">PLAY AGAIN</button>
      </div>
    </div>
  </div>
  <script>
    const bg = "${bgImage}";
    if (bg) {
      const gameArea = document.getElementById("game-area");
      gameArea.style.backgroundImage = \`url(\${bg})\`;
      gameArea.style.backgroundSize = "cover";
      gameArea.style.backgroundPosition = "center";
      gameArea.style.backgroundRepeat = "no-repeat";
      gameArea.style.backgroundColor = "transparent";
    }
  </script>
  <script src="script.js"></script>
</body>
</html>
    `.trim();

    zip.file("index.html", html);
    zip.file("style.css", "/* Add your exported style.css content here */");
    zip.file("script.js", "// Add your exported script.js logic here");

    if (bgImage.startsWith("data:image")) {
      const ext = bgImage.includes("png") ? "png" : "jpg";
      const base64 = bgImage.split(",")[1];
      zip.file(`background.${ext}`, base64, { base64: true });
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "speed-runner-export.zip";
    link.click();
  });
document.getElementById("export-theme-btn")?.addEventListener("click", () => {
    const settings = localStorage.getItem("gameSettings");
    if (settings) {
        const blob = new Blob([settings], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = "theme-settings.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        alert("No theme or background to export!");
    }
});
