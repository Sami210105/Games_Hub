document.addEventListener("DOMContentLoaded", () => {
  // Apply AI background from localStorage (ClipDrop)
  const settings = JSON.parse(localStorage.getItem("gameSettings"));
  if (settings?.backgroundImage) {
    document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
  }

  // Game configuration
  const config = {
    rows: 8,
    cols: 8,
    moves: 25,
    pointsPerMatch: 10,
    requiredMatches: 3,
    symbols: ['💎', '🔶', '🔷', '💠', '🔴', '🟢', '🔵', '🟡'],
    colors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#e84393']
  };

  // Game state
  const game = {
    score: 0,
    movesLeft: config.moves,
    selectedTile: null,
    board: [],
    isProcessing: false
  };

  // DOM elements
  const boardEl = document.getElementById('board');
  const scoreEl = document.getElementById('score');
  const movesEl = document.getElementById('moves');
  const gameOverEl = document.getElementById('game-over');
  const finalScoreEl = document.getElementById('final-score');
  const playAgainBtn = document.getElementById('play-again-btn');

  function initGame() {
    game.score = 0;
    game.movesLeft = config.moves;
    game.selectedTile = null;
    game.board = [];

    for (let row = 0; row < config.rows; row++) {
      game.board[row] = [];
      for (let col = 0; col < config.cols; col++) {
        game.board[row][col] = null;
      }
    }

    fillBoard();
    while (findMatches().length > 0) fillBoard();

    renderBoard();
    updateGameInfo();
    gameOverEl.style.display = 'none';
  }

  function fillBoard() {
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (game.board[row][col] === null) {
          game.board[row][col] = getRandomSymbol();
        }
      }
    }
  }

  function getRandomSymbol() {
    const i = Math.floor(Math.random() * config.symbols.length);
    return config.symbols[i];
  }

  function findMatches() {
    const matches = [];

    // horizontal
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols - (config.requiredMatches - 1); col++) {
        const symbol = game.board[row][col];
        if (!symbol) continue;
        let match = true;
        for (let i = 1; i < config.requiredMatches; i++) {
          if (game.board[row][col + i] !== symbol) {
            match = false;
            break;
          }
        }
        if (match) {
          const matched = [];
          for (let i = 0; i < config.requiredMatches; i++) {
            matched.push({ row, col: col + i });
          }
          matches.push(matched);
        }
      }
    }

    // vertical
    for (let col = 0; col < config.cols; col++) {
      for (let row = 0; row < config.rows - (config.requiredMatches - 1); row++) {
        const symbol = game.board[row][col];
        if (!symbol) continue;
        let match = true;
        for (let i = 1; i < config.requiredMatches; i++) {
          if (game.board[row + i][col] !== symbol) {
            match = false;
            break;
          }
        }
        if (match) {
          const matched = [];
          for (let i = 0; i < config.requiredMatches; i++) {
            matched.push({ row: row + i, col });
          }
          matches.push(matched);
        }
      }
    }

    return matches;
  }

  function clearMatches() {
    const matches = findMatches();
    if (matches.length === 0) return false;

    const toClear = new Set();
    matches.forEach(match => {
      match.forEach(tile => {
        toClear.add(`${tile.row},${tile.col}`);
      });
    });

    game.score += matches.length * config.pointsPerMatch;

    toClear.forEach(coord => {
      const [row, col] = coord.split(',').map(Number);
      const tile = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (tile) {
        tile.classList.add('matched');
        setTimeout(() => tile.classList.remove('matched'), 500);
      }
    });

    setTimeout(() => {
      toClear.forEach(coord => {
        const [row, col] = coord.split(',').map(Number);
        game.board[row][col] = null;
      });

      dropTiles();
      renderBoard();
      updateGameInfo();

      setTimeout(() => {
        if (findMatches().length > 0) {
          clearMatches();
        } else {
          game.isProcessing = false;
          checkGameOver();
        }
      }, 300);
    }, 500);

    return true;
  }

  function dropTiles() {
    for (let col = 0; col < config.cols; col++) {
      let empty = 0;
      for (let row = config.rows - 1; row >= 0; row--) {
        if (game.board[row][col] === null) {
          empty++;
        } else if (empty > 0) {
          game.board[row + empty][col] = game.board[row][col];
          game.board[row][col] = null;
        }
      }
      for (let i = 0; i < empty; i++) {
        game.board[i][col] = getRandomSymbol();
      }
    }
  }

  function swapTiles(tile1, tile2) {
    const rd = Math.abs(tile1.row - tile2.row);
    const cd = Math.abs(tile1.col - tile2.col);
    if ((rd === 1 && cd === 0) || (rd === 0 && cd === 1)) {
      [game.board[tile1.row][tile1.col], game.board[tile2.row][tile2.col]] =
        [game.board[tile2.row][tile2.col], game.board[tile1.row][tile1.col]];

      const match = findMatches();
      if (match.length > 0) {
        game.movesLeft--;
        game.isProcessing = true;
        return true;
      } else {
        [game.board[tile1.row][tile1.col], game.board[tile2.row][tile2.col]] =
          [game.board[tile2.row][tile2.col], game.board[tile1.row][tile1.col]];
        return false;
      }
    }
    return false;
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const el = document.createElement('div');
        el.className = 'tile';
        el.textContent = game.board[row][col];
        const idx = config.symbols.indexOf(game.board[row][col]);
        if (idx >= 0) el.style.backgroundColor = config.colors[idx];
        el.dataset.row = row;
        el.dataset.col = col;
        el.addEventListener('click', () => handleTileClick(row, col));
        boardEl.appendChild(el);
      }
    }
  }

  function handleTileClick(row, col) {
    if (game.isProcessing || game.movesLeft <= 0) return;

    const tile = { row, col };

    if (!game.selectedTile) {
      game.selectedTile = tile;
      highlight(tile, true);
    } else if (game.selectedTile.row === row && game.selectedTile.col === col) {
      highlight(tile, false);
      game.selectedTile = null;
    } else {
      highlight(game.selectedTile, false);
      if (swapTiles(game.selectedTile, tile)) {
        renderBoard();
        updateGameInfo();
        setTimeout(() => clearMatches(), 300);
      }
      game.selectedTile = null;
    }
  }

  function highlight(tile, on) {
    const el = boardEl.querySelector(`[data-row="${tile.row}"][data-col="${tile.col}"]`);
    if (el) el.classList.toggle('selected', on);
  }

  function updateGameInfo() {
    scoreEl.textContent = game.score;
    movesEl.textContent = game.movesLeft;
  }

  function checkGameOver() {
    if (game.movesLeft <= 0) showGameOver();
  }

  function showGameOver() {
    finalScoreEl.textContent = game.score;
    gameOverEl.style.display = 'flex';
  }

  playAgainBtn.addEventListener('click', initGame);

  // Start!
  console.log("🎮 Match-3 Game Initialized");
  initGame();
});

// === EXPORT GAME BUTTON ===
document.addEventListener("DOMContentLoaded", () => {
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

    // HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Gemstone Match-3</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="game-container">
    <div class="game-header">
      <div>Score: <span id="score">0</span></div>
      <div>Moves: <span id="moves">25</span></div>
    </div>
    <div class="game-board" id="board"></div>
  </div>
  <div class="game-over" id="game-over">
    <div class="game-over-content">
      <h2>Game Over!</h2>
      <p>Your final score:</p>
      <div class="final-score" id="final-score">0</div>
      <button id="play-again-btn">Play Again</button>
    </div>
  </div>
  <script src="script.js"></script>
  <script>
    document.body.style.backgroundImage = "url('${bgImage}')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
  </script>
</body>
</html>
    `.trim();

    // Save files
    zip.file("index.html", html);
    zip.file("style.css", document.querySelector("style")?.textContent || "body { background: #222; }");
    zip.file("script.js", "// Insert your game logic here manually if needed");

    if (bgImage.startsWith("data:image")) {
      const ext = bgImage.includes("png") ? "png" : "jpg";
      const base64 = bgImage.split(",")[1];
      zip.file(`background.${ext}`, base64, { base64: true });
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "match3-export.zip";
    a.click();
  });
});
