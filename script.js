document.addEventListener("DOMContentLoaded", () => {
  // Firebase config (your own keys)
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

  // Element references
  const bird = document.getElementById("bird");
  const pipeTop = document.getElementById("pipe-top");
  const pipeBottom = document.getElementById("pipe-bottom");
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const scoreDisplay = document.getElementById("score");
  const leaderboardEl = document.getElementById("leaderboard");
  const startButton = document.getElementById("start-button");
  const usernameInput = document.getElementById("username");

  // Game constants & state
  let gravity = 0.4, jump = -8;
  let birdY, velocity, pipeX, score;
  let isGameOver = false, hasSavedScore = false;
  let username = "", gameInterval;

  // Audio setup
  const audio = new Audio("https://soundimage.org/wp-content/uploads/2014/02/Blazing-Stars.mp3");
  audio.loop = true;
  audio.volume = 0.5;

  // Initial UI & leaderboard
  setupUI();
  loadLeaderboard();

  function setupUI() {
    const gameWidth = window.innerWidth;
    const birdSize = gameWidth * 0.08;
    const pipeWidth = gameWidth * 0.08;

    bird.style.width = bird.style.height = birdSize + "px";
    pipeTop.style.width = pipeBottom.style.width = pipeWidth + "px";
  }

  function startGame() {
    const name = usernameInput.value.trim();
    if (!name) return alert("Enter your name");
    username = name;

    // Reset game state
    isGameOver = false;
    hasSavedScore = false;
    score = 0;
    velocity = 0;
    birdY = window.innerHeight * 0.4;
    pipeX = window.innerWidth;
    updateUIPositions();

    startScreen.style.display = "none";
    gameContainer.style.display = "block";
    scoreDisplay.textContent = score;

    document.addEventListener("keydown", flapHandler);
    document.addEventListener("click", flapHandler);

    audio.play().catch(() => {});

    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, 20);
  }

  function updateGame() {
    if (isGameOver) return;
    velocity += gravity;
    birdY += velocity;

    pipeX -= window.innerWidth * 0.005;
    if (pipeX < -window.innerWidth * 0.08) {
      pipeX = window.innerWidth;
      const topHeight = Math.random() * (window.innerHeight * 0.4) + 50;
      const bottomHeight = window.innerHeight - topHeight - (window.innerHeight * 0.4);
      pipeTop.style.height = topHeight + "px";
      pipeBottom.style.height = bottomHeight + "px";
      score++;
      scoreDisplay.textContent = score;
    }

    updateUIPositions();

    if (checkCollision()) {
      endGame();
    }
  }

  function updateUIPositions() {
    bird.style.top = birdY + "px";
    pipeTop.style.left = pipeX + "px";
    pipeBottom.style.left = pipeX + "px";
    pipeBottom.style.bottom = "0";
  }

  function checkCollision() {
    const b = bird.getBoundingClientRect();
    const t = pipeTop.getBoundingClientRect();
    const bot = pipeBottom.getBoundingClientRect();

    if (b.top < 0 || b.bottom > window.innerHeight) return true;
    if (
      b.right > t.left &&
      b.left < t.right &&
      (b.top < t.bottom || b.bottom > bot.top)
    ) return true;

    return false;
  }

  function endGame() {
    if (isGameOver) return;
    isGameOver = true;

    clearInterval(gameInterval);
    audio.pause();
    document.removeEventListener("keydown", flapHandler);
    document.removeEventListener("click", flapHandler);

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
    }).then(() => {
      console.log("Saved score:", username, score);
    }).catch(err => console.error("Save error:", err));
  }

  function flapHandler(e) {
    if (e.type === "keydown" && e.code !== "Space") return;
    flap();
  }

  function flap() {
    if (isGameOver) return;
    velocity = jump;
  }

  function loadLeaderboard() {
    leaderboardRef.orderByChild("score").once("value", snap => {
      const entries = [];
      snap.forEach(child => entries.push(child.val()));

      const best = {};
      entries.forEach(e => {
        if (!best[e.name] || e.score > best[e.name].score) {
          best[e.name] = e;
        }
      });

      const sorted = Object.values(best)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      leaderboardEl.innerHTML = sorted
        .map(e => `<li>${e.name}: ${e.score}</li>`)
        .join("");
    }, err => console.error("Leaderboard load error:", err));
  }

  startButton.addEventListener("click", startGame);
});


