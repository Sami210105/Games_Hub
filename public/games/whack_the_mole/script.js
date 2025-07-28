document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const holes = document.querySelectorAll('.hole');
    const scoreDisplay = document.getElementById('score');
    const timeDisplay = document.getElementById('time');
    const startBtn = document.getElementById('startBtn');
    const hammer = document.getElementById('hammer');
    const gameContainer = document.querySelector('.game-container');
    const difficultySelect = document.getElementById('difficultySelect');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');

    // Game variables
    let score = 0;
    let time = 30;
    let moleInterval;
    let timerInterval;
    let isPlaying = false;
    let isPaused = false;
    let lastHole = 0;

    // Difficulty configurations
    const difficultySettings = {
        easy: {
            molePopInterval: 1500,
            moleVisibleDuration: 1500,
            gameDuration: 30
        },
        moderate: {
            molePopInterval: 1000,
            moleVisibleDuration: 1200,
            gameDuration: 30
        },
        difficult: {
            molePopInterval: 600,
            moleVisibleDuration: 900,
            gameDuration: 30
        }
    };

    // Load persisted difficulty
    function loadDifficulty() {
        const savedDifficulty = localStorage.getItem('whackDifficulty');
        if (savedDifficulty && difficultySettings[savedDifficulty]) {
            difficultySelect.value = savedDifficulty;
        }
    }
    loadDifficulty();

    // Save difficulty on change to localStorage
    difficultySelect.addEventListener('change', () => {
        localStorage.setItem('whackDifficulty', difficultySelect.value);
    });



    // Enter fullscreen automatically on load
    function enterFullscreen() {
        if (!document.fullscreenElement) {
            gameContainer.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        }
    }
    enterFullscreen();

    // Hammer follows cursor only when playing
    document.addEventListener('mousemove', (e) => {
        if (!isPlaying) return;

        hammer.style.display = 'block';
        hammer.style.left = `${e.pageX - hammer.offsetWidth / 2}px`;
        hammer.style.top = `${e.pageY - hammer.offsetHeight / 2}px`;
    });

    // Hammer click animation
    document.addEventListener('mousedown', () => {
        if (!isPlaying) return;

        hammer.classList.add('active');
    });
    document.addEventListener('mouseup', () => {
        hammer.classList.remove('active');
    });

    // Start or reset game on button click
    startBtn.addEventListener('click', () => {
        if (isPlaying) {
            resetGame();
        } else {
            startGame();
        }
    });

    startBtn.addEventListener('click', () => {
        if (isPlaying) {
            resetGame();
        } else {
            startGame();
        }
    });

    // Pause button click toggles pause/resume
    pauseBtn.addEventListener('click', () => {
        if (!isPlaying) return;

        if (!isPaused) {
            pauseGame();
        } else {
            resumeGame();
        }
    });

    // Restart button restarts game anytime during play
    restartBtn.addEventListener('click', () => {
        if (isPlaying) {
            resetGame();
        }
    });

    // Start the game
    function startGame() {
        isPlaying = true;
        isPaused = false;
        score = 0;

        // Show pause and restart buttons, hide start button
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
        restartBtn.style.display = 'inline-block';
        pauseBtn.textContent = 'Pause';

        // Get difficulty config
        const difficulty = difficultySelect.value;
        const settings = difficultySettings[difficulty];

        time = settings.gameDuration;
        scoreDisplay.textContent = score;
        timeDisplay.textContent = time;
        startBtn.textContent = 'Reset Game';

        moleInterval = setInterval(popUpRandomMole, settings.molePopInterval);

        timerInterval = setInterval(() => {
            time--;
            timeDisplay.textContent = time;

            if (time <= 0) {
                endGame();
            }
        }, 1000);
    }

    function pauseGame() {
        isPaused = true;
        pauseBtn.textContent = 'Resume';
        clearInterval(moleInterval); // stop popping moles
    }

    function resumeGame() {
        isPaused = false;
        pauseBtn.textContent = 'Pause';

        // Resume mole popping with current difficulty interval
        const difficulty = difficultySelect.value;
        const settings = difficultySettings[difficulty];
        moleInterval = setInterval(popUpRandomMole, settings.molePopInterval);
    }

    // Reset game
    function resetGame() {
        clearInterval(moleInterval);
        clearInterval(timerInterval);
        removeAllMoles();

        // Reset buttons
        isPlaying = false;
        isPaused = false;
        pauseBtn.style.display = 'none';
        restartBtn.style.display = 'none';
        startBtn.style.display = 'inline-block';
        startBtn.textContent = 'Start Game';
        startGame();
    }

    // End game
    function endGame() {
        isPlaying = false;
        isPaused = false;
        clearInterval(moleInterval);
        clearInterval(timerInterval);
        removeAllMoles();
        // Reset buttons
        pauseBtn.style.display = 'none';
        restartBtn.style.display = 'none';
        startBtn.style.display = 'inline-block';
        startBtn.textContent = 'Start Game';

        setTimeout(() => {
            alert(`Game Over! Your final score is ${score}`);
        }, 100);
    }

    // Remove all current moles
    function removeAllMoles() {
        holes.forEach(hole => {
            const mole = hole.querySelector('.mole');
            if (mole) mole.remove();
        });
    }

    // Pop up a random mole
    function popUpRandomMole() {
        if (!isPlaying) return;

        // Remove any existing moles before showing new
        removeAllMoles();

        let randomHole;
        do {
            randomHole = Math.floor(Math.random() * holes.length);
        } while (randomHole === lastHole);
        lastHole = randomHole;

        // Create mole element
        const mole = document.createElement('div');
        mole.classList.add('mole');
        holes[randomHole].appendChild(mole);

        // Whack mole event
        mole.addEventListener('click', (e) => {
            if (!isPlaying) return;

            e.stopPropagation();
            score++;
            scoreDisplay.textContent = score;

            // Animate hit mole
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

        // Mole disappears after duration based on difficulty
        const moleVisibleDuration = difficultySettings[difficultySelect.value].moleVisibleDuration;
        setTimeout(() => {
            if (mole.parentNode) {
                mole.remove();
            }
        }, moleVisibleDuration);
    }

    // Sound effect function (can be expanded)
    function playSound() {
        // Implement sound effect logic here if desired
    }
});
