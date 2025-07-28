document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const startScreen = document.getElementById("start-screen");
  const mainContent = document.getElementById("main-content");
  const starContainer = document.querySelector(".star-container");
  const form = document.querySelector(".game-prompt-form");
  const input = document.querySelector(".prompt-input");
  let selectedGame = null;

  // Set background color
  document.body.style.backgroundColor = "#0d0d0d";

  // Start screen transition
  startBtn.addEventListener("click", () => {
    startScreen.style.opacity = "0";
    setTimeout(() => {
      startScreen.style.display = "none";
      mainContent.style.display = "block";
      mainContent.classList.add("visible");
    }, 600);
  });

  // Starfield animation
  const totalStars = 60;
  const starArray = [];

  for (let i = 0; i < totalStars; i++) {
    const star = document.createElement("div");
    star.classList.add("star");
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const speed = Math.random() * 0.5 + 0.2;
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    starContainer.appendChild(star);
    starArray.push({ el: star, initialY: y, speed });
  }

  const specialStar = document.createElement("div");
  specialStar.classList.add("star", "special");
  starContainer.appendChild(specialStar);

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    starArray.forEach(({ el, initialY, speed }) => {
      const newY = initialY + scrollY * speed;
      el.style.top = `${newY}px`;
      if (newY > window.innerHeight + 100) {
        el.style.opacity = 0;
      }
    });
  });

  // Game card selection
  document.querySelectorAll(".card-cover").forEach(card => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".card-cover").forEach(c => c.classList.remove("selected-game"));
      const link = card.closest("a");
      selectedGame = link.getAttribute("href");
      card.classList.add("selected-game");
      document.querySelector(".game-ai-section-glow").scrollIntoView({ behavior: "smooth" });
    });
  });

  // Dynamic API base for local + deployed
  const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://games-hub-380n.onrender.com";

  // Handle AI sprite + background generation
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const promptText = input.value.trim();
    const [spritePrompt, backgroundPrompt] = promptText.split(",").map(p => p.trim());

    if (!selectedGame) {
      alert("Please select a game first!");
      return;
    }
    if (!spritePrompt || !backgroundPrompt) {
      alert("Please provide both sprite and background prompts, separated by a comma.");
      return;
    }

    const btn = form.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Generating...";

    try {
      const [spriteRes, bgRes] = await Promise.all([
        fetch(`${API_BASE}/api/generate-sprite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: spritePrompt })
        }),
        fetch(`${API_BASE}/api/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: backgroundPrompt })
        })
      ]);

      const spriteData = await spriteRes.json();
      const bgData = await bgRes.json();

      if (spriteData?.image && bgData?.image) {
        localStorage.setItem("gameSettings", JSON.stringify({
          characterImage: spriteData.image,
          backgroundImage: bgData.image,
          prompt: promptText
        }));
        window.location.href = selectedGame;
      } else {
        alert("Something went wrong. Please try again.");
      }

    } catch (err) {
      console.error("❌ Image Generation Failed:", err);
      alert("There was an error generating images.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate";
    }
  });

  // Gradient background animation
  let angle = 0;
  function animateGradient() {
    angle += 0.003;
    const x = 50 + Math.sin(angle) * 10;
    const y = 50 + Math.cos(angle) * 10;
    document.body.style.background = `radial-gradient(circle at ${x}% ${y}%, #2d0d48, rgba(0, 0, 0, 1) 40%)`;
    requestAnimationFrame(animateGradient);
  }
  animateGradient();
});
