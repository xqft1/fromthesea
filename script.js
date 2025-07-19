document.addEventListener("DOMContentLoaded", () => {
  // Firebase setup (keep your config unchanged)
  const firebaseConfig = {
    apiKey: "AIzaSyBhyDiExECoc6J1TqJu6XeQCxgySMP7K5Q",
    authDomain: "fromthesea-c967a.firebaseapp.com",
    databaseURL: "https://fromthesea-c967a-default-rtdb.firebaseio.com/",
    projectId: "fromthesea-c967a",
    storageBucket: "fromthesea-c967a.appspot.com",
    messagingSenderId: "921773077324",
    appId: "1:921773077324:web:d9e58bc48e9de742ff95e9"
  };
  firebase.initializeApp(firebaseConfig);
  const leaderboardRef = firebase.database().ref("leaderboard");

  // DOM elements
  const bird = document.getElementById("bird");
  const pipeTop = document.getElementById("pipe-top");
  const pipeBottom = document.getElementById("pipe-bottom");
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const scoreDisplay = document.getElementById("score");
  const leaderboardEl = document.getElementById("leaderboard");
  const startButton = document.getElementById("start-button");
  const usernameInput = document.getElementById("username");

  // Game state and constants
  let gravity = 0.4, jump = -8;
  let birdY = 0, velocity = 0, pipeX = 0, score = 0;
  let isGameOver = false, hasSavedScore = false;
  let username = "", gameLoopId = null;
  let lastTimestamp = 0;

  const audio = new Audio("https://soundimage.org/wp-content/uploads/2014/02/Blazing-Stars.mp3");
  audio.loop = true; audio.volume = 0.5;

  // Initial setup
  setupResponsiveUI();
  loadLeaderboard();

  startButton.addEventListener("click", startGame);
  gameContainer.addEventListener("touchstart", flap);  // mobile touch support

  function setupResponsiveUI() {
    const w = window.innerWidth;
    const birdSize = Math.min(15 * w / 100, 120);
    bird.style.width = bird.style.height = birdSize + "px";
    bird.style.imageRendering = "pixelated";
    bird.style.willChange = "transform";

    const pipeWidth = Math.min(8 * w / 100, 120);
    pipeTop.style.width = pipeBottom.style.width = pipeWidth + "px";
  }

  function startGame() {
    const name = usernameInput.value.trim();
    if (!name) return alert("Please enter your name.");
    username = name;

    isGameOver = false;
    hasSavedScore = false;
    score = 0; velocity = 0;
    birdY = window.innerHeight * 0.4;
    pipeX = window.innerWidth;
    bird.style.transform = `translateY(${birdY}px)`;
    scoreDisplay.textContent = score;

    startScreen.style.display = "none";
    gameContainer.style.display = "block";

    audio.play().catch(() => {});

    cancelAnimationFrame(gameLoopId);
    lastTimestamp = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
  }

  function gameLoop(ts) {
    if (isGameOver) return;
    const delta = ts - lastTimestamp;
    lastTimestamp = ts;

    // Physics
    velocity += gravity * (delta / 20);
    birdY += velocity * (delta / 20);

    // Update pipes
    pipeX -= window.innerWidth * 0.005 * (delta / 20);
    if (pipeX < -pipeTop.clientWidth) {
      pipeX = window.innerWidth;
      const gap = window.innerHeight * 0.4;
      const topH = Math.random() * (window.innerHeight * 0.4) + 50;
      const botH = window.innerHeight - topH - gap;
      pipeTop.style.height = topH + "px";
      pipeBottom.style.height = botH + "px";
      score++;
      scoreDisplay.textContent = score;
    }

    // Update UI
    bird.style.transform = `translateY(${birdY}px)`;
    pipeTop.style.left = pipeBottom.style.left = pipeX + "px";

    if (checkCollision()) return endGame();

    gameLoopId = requestAnimationFrame(gameLoop);
  }

  function flap() {
    if (isGameOver) return;
    velocity = jump;
  }

  document.addEventListener("keydown", e => {
    if (e.code === "Space") flap();
  });

  function checkCollision() {
    const b = bird.getBoundingClientRect();
    const t = pipeTop.getBoundingClientRect();
    const bot = pipeBottom.getBoundingClientRect();
    const height = window.innerHeight;

    if (b.top < 0 || b.bottom > height) return true;
    if (b.right > t.left && b.left < t.right &&
       (b.top < t.bottom || b.bottom > bot.top)) return true;

    return false;
  }

  function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    cancelAnimationFrame(gameLoopId);
    audio.pause();
    saveScoreOnce();

    setTimeout(() => {
      startScreen.style.display = "block";
      gameContainer.style.display = "none";
      loadLeaderboard();
    }, 800);
  }

  function saveScoreOnce() {
    if (hasSavedScore || !username || score <= 0) return;
    hasSavedScore = true;
    leaderboardRef.push({
      name: username,
      score: score,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => console.log("Saved score:", username, score))
      .catch(err => console.error("Save error:", err));
  }

  function loadLeaderboard() {
    leaderboardRef.orderByChild("score").limitToLast(5)
      .once("value", snap => {
        const arr = [];
        snap.forEach(c => arr.push(c.val()));
        const best = {};
        arr.forEach(e => {
          if (!best[e.name] || e.score > best[e.name].score) {
            best[e.name] = e;
          }
        });
        const top5 = Object.values(best)
          .sort((a,b) => b.score - a.score)
          .slice(0,5);

        leaderboardEl.innerHTML = top5
          .map(e => `<li>${e.name}: ${e.score}</li>`)
          .join("");
      }, err => console.error("Load error:", err));
  }
});
