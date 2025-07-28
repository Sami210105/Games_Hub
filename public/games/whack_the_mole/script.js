document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const holes = document.querySelectorAll('.hole');
    const scoreDisplay = document.getElementById('score');
    const timeDisplay = document.getElementById('time');
    const startBtn = document.getElementById('startBtn');
    const hammer = document.getElementById('hammer');
    const gameContainer = document.querySelector('.game-container');
    
    // Game variables
    let score = 0;
    let time = 30;
    let gameInterval;
    let moleInterval;
    let timerInterval;
    let isPlaying = false;
    let lastHole = 0;
    
    // Enter fullscreen automatically
    function enterFullscreen() {
        if (!document.fullscreenElement) {
            gameContainer.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        }
    }
    
    // Try to enter fullscreen when the page loads
    enterFullscreen();
    
    // Hammer follow cursor
    document.addEventListener('mousemove', (e) => {
        if (!isPlaying) return;
        
        hammer.style.display = 'block';
        hammer.style.left = `${e.pageX - 50}px`;
        hammer.style.top = `${e.pageY - 50}px`;
    });
    
    // Hammer click animation
    document.addEventListener('mousedown', () => {
        if (!isPlaying) return;
        
        hammer.classList.add('active');
    });
    
    document.addEventListener('mouseup', () => {
        hammer.classList.remove('active');
    });
    
    // Start game
    startBtn.addEventListener('click', () => {
        if (isPlaying) {
            resetGame();
        } else {
            startGame();
        }
    });
    
    // Game functions
    function startGame() {
        isPlaying = true;
        score = 0;
        time = 30;
        scoreDisplay.textContent = score;
        timeDisplay.textContent = time;
        startBtn.textContent = 'Reset Game';
        
        // Start mole popping up
        moleInterval = setInterval(popUpRandomMole, 1200);
        
        // Start timer
        timerInterval = setInterval(() => {
            time--;
            timeDisplay.textContent = time;
            
            if (time <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    function resetGame() {
        clearInterval(moleInterval);
        clearInterval(timerInterval);
        holes.forEach(hole => {
            if (hole.querySelector('.mole')) {
                hole.removeChild(hole.querySelector('.mole'));
            }
        });
        startGame();
    }
    
    function endGame() {
        isPlaying = false;
        clearInterval(moleInterval);
        clearInterval(timerInterval);
        startBtn.textContent = 'Start Game';
        setTimeout(() => {
            alert(`Game Over! Your final score is ${score}`);
        }, 100);
    }
    
    function popUpRandomMole() {
        if (!isPlaying) return;
        
        // Remove any existing moles
        holes.forEach(hole => {
            if (hole.querySelector('.mole')) {
                hole.removeChild(hole.querySelector('.mole'));
            }
        });
        
        // Get a random hole that's not the same as last time
        let randomHole;
        do {
            randomHole = Math.floor(Math.random() * holes.length);
        } while (randomHole === lastHole);
        
        lastHole = randomHole;
        
        // Create mole
        const mole = document.createElement('div');
        mole.classList.add('mole');
        holes[randomHole].appendChild(mole);
        
        // Whack the mole
        mole.addEventListener('click', (e) => {
            if (!isPlaying) return;
            
            e.stopPropagation();
            score++;
            scoreDisplay.textContent = score;
            
            // Add hit animation
            mole.style.transform = 'translateX(-50%) scale(0.9)';
            mole.style.filter = 'brightness(1.5) drop-shadow(0 0 5px rgba(255,255,255,0.7))';
            
            setTimeout(() => {
                mole.remove();
            }, 100);
            
            // Hammer hit effect
            hammer.classList.add('active');
            setTimeout(() => {
                hammer.classList.remove('active');
            }, 100);
        });
        
        // Mole disappears after a while
        setTimeout(() => {
            if (mole.parentNode) {
                mole.remove();
            }
        }, 1200);
    }
    
    // Sound effects
    function playSound() {
        const sounds = [
            'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...',
            'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...',
            'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'
        ];
        const sound = new Audio(sounds[Math.floor(Math.random() * sounds.length)]);
        sound.volume = 0.3;
        sound.play().catch(e => console.log("Audio play failed:", e));
    }
});
// ✅ EXPORT GAME FEATURE
document.getElementById('exportBtn').addEventListener('click', () => {
  const zip = new JSZip();

  // HTML
  fetch('index.html')
    .then(res => res.text())
    .then(html => {
      zip.file("index.html", html);

      // CSS
      return fetch('style.css');
    })
    .then(res => res.text())
    .then(css => {
      zip.file("style.css", css);

      // JavaScript
      return fetch('script.js');
    })
    .then(res => res.text())
    .then(js => {
      zip.file("script.js", js);

      // Add background image data if available
      const settings = JSON.parse(localStorage.getItem("gameSettings"));
      if (settings?.backgroundImage) {
        zip.file("background.txt", settings.backgroundImage);
        if (settings.prompt) zip.file("prompt.txt", settings.prompt);
      }

      // Create and download the zip
      zip.generateAsync({ type: "blob" }).then(content => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "whack-a-mole-export.zip";
        link.click();
      });
    })
    .catch(err => {
      console.error("Export failed:", err);
      alert("Export failed. Check console for details.");
    });
});
