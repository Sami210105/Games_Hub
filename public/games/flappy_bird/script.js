document.addEventListener("DOMContentLoaded", () => {
  // 🧠 Inject dynamic character image from localStorage
  const settings = JSON.parse(localStorage.getItem("gameSettings"));
  if (settings?.characterImage) {
    const bird = document.getElementById("bird");
    bird.src = settings.characterImage;
    bird.alt = settings.prompt || "Game Character";
  }

  // ----- Difficulty Settings -----
  const DIFFICULTY_LEVELS = {
    easy: { gravity: 0.5, jumpStrength: -10, pipeSpeed: 2.3, pipeInterval: 3600, gapHeight: 280 },
    medium: { gravity: 0.6, jumpStrength: -10.5, pipeSpeed: 3.0, pipeInterval: 3000, gapHeight: 230 },
    hard: { gravity: 0.8, jumpStrength: -11, pipeSpeed: 4.2, pipeInterval: 2300, gapHeight: 170 },
  };

  // Elements
  const gameContainer = document.getElementById("game-container");
  const bird = document.getElementById("bird");
  const scoreElement = document.getElementById("score");
  const gameOverScreen = document.getElementById("game-over");
  const finalScoreElement = document.getElementById("final-score");
  const finalHighScoreElement = document.getElementById("final-high-score");
  const gameOverRestartBtn = document.getElementById("gameover-restart-btn");
  const difficultyGameOverSelect = document.getElementById("difficulty-gameover");
  const difficultyMenuSelect = document.getElementById("difficulty-menu");
  const exportBtn = document.getElementById("export-btn");
  const menuOverlay = document.getElementById("menu-overlay");
  const startBtn = document.getElementById("start-btn");
  const gameControls = document.getElementById("game-controls");
  const pauseBtn = document.getElementById("pause-btn");
  const restartBtn = document.getElementById("restart-btn");

  let birdY, velocity, score, pipes, pipeTimer, animationFrame;
  let gravity, jumpStrength, pipeSpeed, pipeInterval, gapHeight;
  let gameState = "menu";
  let activeDifficulty = "medium";
  const HS_KEY = "flappyHighScore";
  let highScore = parseInt(localStorage.getItem(HS_KEY)) || 0;

  function saveHighScore(score) {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HS_KEY, highScore);
      updateHighScoreUI();
      return true;
    }
    return false;
  }

  function updateHighScoreUI() {
    document.querySelectorAll("#high-score, #final-high-score")
      .forEach(el => el.textContent = highScore);
  }

  function syncDifficultySelectors(value) {
    difficultyMenuSelect.value = value;
    difficultyGameOverSelect.value = value;
  }

  function applyDifficulty(levelName) {
    const settings = DIFFICULTY_LEVELS[levelName];
    gravity = settings.gravity;
    jumpStrength = settings.jumpStrength;
    pipeSpeed = settings.pipeSpeed;
    pipeInterval = settings.pipeInterval;
    gapHeight = settings.gapHeight;
  }

  function setDifficulty(level) {
    activeDifficulty = level;
    applyDifficulty(level);
    localStorage.setItem("flappyDifficulty", level);
    syncDifficultySelectors(level);
  }

  const lastDifficulty = localStorage.getItem("flappyDifficulty");
  if (lastDifficulty && DIFFICULTY_LEVELS[lastDifficulty]) {
    setDifficulty(lastDifficulty);
  } else {
    setDifficulty(difficultyMenuSelect.value);
  }

  difficultyMenuSelect.addEventListener("change", (e) => {
    setDifficulty(e.target.value);
    if (["running", "paused"].includes(gameState)) restartGame();
  });

  difficultyGameOverSelect.addEventListener("change", (e) => {
    setDifficulty(e.target.value);
    if (gameState === "gameover") restartGame();
  });

  function clearPipes() {
    if (pipes) pipes.forEach(p => p.element.remove());
    pipes = [];
  }

  function startGame() {
    birdY = 200;
    velocity = 0;
    score = 0;
    clearPipes();
    gameState = "running";
    scoreElement.textContent = score;
    gameOverScreen.classList.add("hidden");
    bird.style.top = `${birdY}px`;
    pipeTimer = Date.now();

    menuOverlay.classList.add("hidden");
    gameContainer.classList.remove("hidden");
    gameControls.classList.remove("hidden");

    pauseBtn.disabled = false;
    pauseBtn.textContent = "Pause";
    restartBtn.disabled = false;
    startBtn.disabled = true;

    generatePipe();
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (gameState !== "running") return;
    gameState = "paused";
    pauseBtn.textContent = "Resume";
    cancelAnimationFrame(animationFrame);
  }

  function resumeGame() {
    if (gameState !== "paused") return;
    gameState = "running";
    pauseBtn.textContent = "Pause";
    animationFrame = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    gameState = "gameover";
    cancelAnimationFrame(animationFrame);
    finalScoreElement.textContent = score;
    saveHighScore(score);
    finalHighScoreElement.textContent = highScore;
    gameOverScreen.classList.remove("hidden");
    pauseBtn.disabled = true;
    restartBtn.disabled = false;
    menuOverlay.classList.add("hidden");
  }

  function restartGame() {
    gameOverScreen.classList.add("hidden");
    startGame();
  }

  function jump() {
    if (gameState !== "running") return;
    velocity = jumpStrength;
  }

  function generatePipe() {
    const containerHeight = gameContainer.clientHeight;
    const pipeX = gameContainer.clientWidth;
    const topHeight = Math.random() * (containerHeight - gapHeight - 100) + 50;
    const bottomHeight = containerHeight - topHeight - gapHeight;

    const topPipe = document.createElement("div");
    topPipe.className = "pipe pipe-top";
    topPipe.style.left = `${pipeX}px`;
    topPipe.style.height = `${topHeight}px`;
    gameContainer.appendChild(topPipe);

    const bottomPipe = document.createElement("div");
    bottomPipe.className = "pipe pipe-bottom";
    bottomPipe.style.left = `${pipeX}px`;
    bottomPipe.style.height = `${bottomHeight}px`;
    gameContainer.appendChild(bottomPipe);

    pipes.push({ element: topPipe, x: pipeX, passed: false, isBottom: false });
    pipes.push({ element: bottomPipe, x: pipeX, passed: false, isBottom: true });
  }

  function gameLoop() {
    if (gameState !== "running") return;

    velocity += gravity;
    birdY += velocity;
    bird.style.top = `${birdY}px`;

    const birdRect = bird.getBoundingClientRect();

    if (birdY < 0 || birdY + bird.offsetHeight > gameContainer.clientHeight) {
      endGame();
      return;
    }

    const now = Date.now();
    if (now - pipeTimer > pipeInterval) {
      generatePipe();
      pipeTimer = now;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const pipe = pipes[i];
      pipe.x -= pipeSpeed;
      pipe.element.style.left = `${pipe.x}px`;

      if (!pipe.passed && pipe.isBottom && pipe.x + pipe.element.offsetWidth < bird.offsetLeft) {
        pipe.passed = true;
        score++;
        scoreElement.textContent = score;
      }

      const pipeRect = pipe.element.getBoundingClientRect();
      const collided =
        birdRect.right > pipeRect.left &&
        birdRect.left < pipeRect.right &&
        birdRect.top < pipeRect.bottom &&
        birdRect.bottom > pipeRect.top;

      if (collided) {
        endGame();
        return;
      }

      if (pipe.x + pipe.element.offsetWidth < 0) {
        pipe.element.remove();
        pipes.splice(i, 1);
      }
    }

    animationFrame = requestAnimationFrame(gameLoop);
  }

  // Input
  gameContainer.addEventListener("click", (e) => {
    if (e.target === gameContainer || e.target === bird) jump();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      jump();
    }
  });

  startBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", () =>
    gameState === "running" ? pauseGame() : resumeGame()
  );
  restartBtn.addEventListener("click", restartGame);
  gameOverRestartBtn.addEventListener("click", restartGame);

  function initializeUI() {
    menuOverlay.classList.remove("hidden");
    gameContainer.classList.add("hidden");
    gameControls.classList.add("hidden");
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    restartBtn.disabled = true;
    pauseBtn.textContent = "Pause";
    scoreElement.textContent = "0";
    gameOverScreen.classList.add("hidden");
    updateHighScoreUI();
    syncDifficultySelectors(activeDifficulty);
  }

  initializeUI();

  exportBtn.addEventListener("click", () => {
    alert("Export feature is not implemented in this demo.");
  });
});
