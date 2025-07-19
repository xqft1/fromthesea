// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded — initializing game");

  // 🔥 Config
  const firebaseConfig = {
    apiKey: "AIzaSyBhyDiExECoc6J1TqJu6XeQCxgySMP7K5Q",
    authDomain: "fromthesea-c967a.firebaseapp.com",
    databaseURL: "https://fromthesea-c967a-default-rtdb.firebaseio.com/",
    projectId: "fromthesea-c967a",
    storageBucket: "fromthesea-c967a.appspot.com",
    messagingSenderId: "921773077324",
    appId: "1:921773077324:web:d9e58bc48e9de742ff95e9",
  };
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const leaderboardRef = database.ref("leaderboard");

  // 🕹️ DOM elements
  const bird = document.getElementById("bird");
  const pipeTop = document.getElementById("pipe-top");
  const pipeBottom = document.getElementById("pipe-bottom");
  const scoreDisplay = document.getElementById("score");
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const startButton = document.getElementById("start-button");
  const usernameInput = document.getElementById("username");
  const leaderboardEl = document.getElementById("leaderboard");

  // 🚧 Game state
  let gameWidth = window.innerWidth;
  let gameHeight = window.innerHeight;
  let pipeWidth = gameWidth * 0.08;
  let pipeSpeed = gameWidth * 0.005;
  let birdSize = gameWidth * 0.08;
  let pipeGap = gameHeight * 0.4;

  let birdY = gameHeight * 0.8;
  let velocity = 0;
  const gravity = 0.4;
  const jump = -8;

  let pipeX = gameWidth;
  let score = 0;
  let username = "";
  let gameInterval = null;
  let isGameOver = false;
  let scoreSaved = false;

  const audio = new Audio(
    "https://soundimage.org/wp-content/uploads/2014/02/Blazing-Stars.mp3"
  );
  audio.loop = true;
  audio.volume = 0.5;

  // Init CSS sizes
  pipeTop.style.width = pipeBottom.style.width = pipeWidth + "px";
  bird.style.width = bird.style.height = birdSize + "px";
  bird.style.left = gameWidth * 0.15 + "px";
  bird.style.top = birdY + "px";

  // 🏆 Load leaderboard
  function loadLeaderboard() {
    leaderboardRef.off(); // clear previous listeners
    leaderboardRef
      .orderByChild("score")
      .limitToLast(5)
      .on("value", (snapshot) => {
        const arr = [];
        snapshot.forEach((c) => arr.push(c.val()));
        arr.sort((a, b) => b.score - a.score);
        leaderboardEl.innerHTML = arr
          .map((e) => `<li>${e.name}: ${e.score}</li>`)
          .join("");
      });
  }

  // 💾 Save score (only once per session)
  function saveScore(name, score) {
    if (scoreSaved) {
      console.log("Score already saved, ignoring further saves.");
      return;
    }
    scoreSaved = true;
    console.log(`Saving score for ${name}: ${score}`);
    leaderboardRef
      .push({
        name,
        score,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      })
      .then(() => console.log("Score saved!"))
      .catch((err) => {
        console.error("Error saving score:", err);
        scoreSaved = false; // allow retry on failure
      });
  }

  // 🛑 Detect collision
  function checkCollision() {
    if (isGameOver) return false;
    const b = bird.getBoundingClientRect(),
      t = pipeTop.getBoundingClientRect(),
      bt = pipeBottom.getBoundingClientRect(),
      c = gameContainer.getBoundingClientRect();

    return (
      b.bottom > c.bottom ||
      b.top < c.top ||
      (b.right > t.left &&
        b.left < t.right &&
        (b.top < t.bottom || b.bottom > bt.top))
    );
  }

  // 🎮 Game update logic
  function updateGame() {
    if (isGameOver) return;

    velocity += gravity;
    birdY += velocity;
    bird.style.top = birdY + "px";

    pipeX -= pipeSpeed;
    if (pipeX < -pipeWidth) {
      pipeX = gameWidth;
      const topH = Math.random() * (gameHeight * 0.4) + 50;
      pipeTop.style.height = topH + "px";
      pipeBottom.style.height =
        gameHeight - topH - pipeGap + "px";
      score++;
    }

    pipeTop.style.left = pipeBottom.style.left = pipeX + "px";
    scoreDisplay.innerText = score;

    if (checkCollision()) {
      console.log("Collision detected — game over!");
      clearInterval(gameInterval);
      gameInterval = null;
      gameOver();
    }
  }

  // 🛑 End the game & return home
  function gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    console.log("Running gameOver()");

    audio.pause();
    saveScore(username, score);

    setTimeout(() => {
      startScreen.style.display = "block";
      gameContainer.style.display = "none";
      usernameInput.value = "";
      scoreDisplay.innerText = "0";
      isGameOver = false;
      scoreSaved = false; // allow new session after home
      loadLeaderboard();
    }, 1000);
  }

  // 🕊️ Flap handler
  function flapHandler(e) {
    if (isGameOver) return;
    if (e.code === "Space" || e.type === "click") {
      velocity = jump;
    }
  }

  // 🚀 Start game logic
  startButton.addEventListener("click", () => {
    const input = usernameInput.value.trim();
    if (!input) return alert("Enter your name!");

    username = input;
    startScreen.style.display = "none";
    gameContainer.style.display = "block";

    birdY = gameHeight * 0.4;
    velocity = 0;
    pipeX = gameWidth;
    score = 0;
    isGameOver = false;
    scoreSaved = false;

    bird.style.top = birdY + "px";
    gameInterval = setInterval(updateGame, 20);
    audio.play().catch(console.log);
  });

  // ✍️ Input listeners
  document.addEventListener("keydown", flapHandler);
  document.addEventListener("click", flapHandler);

  loadLeaderboard(); // initial load
});

