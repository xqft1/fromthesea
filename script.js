// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, attaching startButton listener");

  const firebaseConfig = {
    apiKey: "AIzaSyBhyDiExECoc6J1TqJu6XeQCxgySMP7K5Q",
    authDomain: "fromthesea-c967a.firebaseapp.com",
    databaseURL: "https://fromthesea-c967a-default-rtdb.firebaseio.com/",
    projectId: "fromthesea-c967a",
    storageBucket: "fromthesea-c967a.appspot.com",
    messagingSenderId: "921773077324",
    appId: "1:921773077324:web:d9e58bc48e9de742ff95e9",
  };

  // Initialize Firebase only once
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized");
  }
  const database = firebase.database();
  const leaderboardRef = database.ref("leaderboard");

  const bird = document.getElementById("bird");
  const pipeTop = document.getElementById("pipe-top");
  const pipeBottom = document.getElementById("pipe-bottom");
  const scoreDisplay = document.getElementById("score");
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const startButton = document.getElementById("start-button");
  const usernameInput = document.getElementById("username");
  const leaderboardEl = document.getElementById("leaderboard");

  // Game settings
  let gameWidth = window.innerWidth;
  let gameHeight = window.innerHeight;
  let pipeWidth = gameWidth * 0.08;
  let pipeSpeed = gameWidth * 0.005;
  let birdSize = gameWidth * 0.08;
  let pipeGap = gameHeight * 0.4;

  // Game state variables
  let birdY = gameHeight * 0.8;
  let velocity = 0;
  let gravity = 0.4;
  let jump = -8;
  let pipeX = gameWidth;
  let score = 0;
  let username = '';
  let gameInterval = null;
  let gameStarted = false;
  let isGameOver = false;
  let hasSavedScore = false;  // FLAG: ensure one score save only

  const audio = new Audio('https://soundimage.org/wp-content/uploads/2014/02/Blazing-Stars.mp3');
  audio.loop = true;
  audio.volume = 0.5;

  // Setup sizes
  pipeTop.style.width = pipeWidth + "px";
  pipeBottom.style.width = pipeWidth + "px";
  bird.style.width = birdSize + "px";
  bird.style.height = birdSize + "px";
  bird.style.left = gameWidth * 0.15 + "px";
  bird.style.top = birdY + "px";

  // Load leaderboard top 5 scores
  function loadLeaderboard() {
    console.log("Loading leaderboard...");
    leaderboardRef
      .orderByChild("score")
      .limitToLast(5)
      .once("value")
      .then(snapshot => {
        const leaderboard = [];
        snapshot.forEach(child => {
          leaderboard.push(child.val());
        });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboardEl.innerHTML = leaderboard
          .map(entry => `<li>${entry.name}: ${entry.score}</li>`)
          .join('');
        console.log("Leaderboard updated:", leaderboard);
      })
      .catch(error => {
        console.error("Error loading leaderboard:", error);
      });
  }

  // Save score only once per game session
  function saveScoreOnce(name, score) {
    if (hasSavedScore) {
      console.log("Score already saved, skipping.");
      return;
    }
    hasSavedScore = true;

    leaderboardRef.push({
      name: name,
      score: score,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      console.log("Score saved once.");
      loadLeaderboard(); // Refresh leaderboard after save
    }).catch(err => {
      console.error("Error saving score:", err);
    });
  }

  // Collision detection
  function checkCollision() {
    if (isGameOver) {
      return { collision: false, reason: "game over" };
    }
    const birdRect = bird.getBoundingClientRect();
    const topRect = pipeTop.getBoundingClientRect();
    const bottomRect = pipeBottom.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    if (birdRect.bottom > containerRect.bottom) {
      return { collision: true, reason: "bottom" };
    }
    if (birdRect.top < containerRect.top) {
      return { collision: true, reason: "top" };
    }
    if (
      birdRect.right > topRect.left &&
      birdRect.left < topRect.right &&
      (birdRect.top < topRect.bottom || birdRect.bottom > bottomRect.top)
    ) {
      return { collision: true, reason: "pipe" };
    }
    return { collision: false, reason: "none" };
  }

  // Update game frame
  function updateGame() {
    if (isGameOver) return;

    velocity += gravity;
    birdY += velocity;
    bird.style.top = birdY + "px";

    pipeX -= pipeSpeed;

    if (pipeX < -pipeWidth) {
      pipeX = gameWidth;
      let topHeight = Math.floor(Math.random() * (gameHeight * 0.4)) + 50;
      pipeTop.style.height = topHeight + "px";
      pipeBottom.style.height = (gameHeight - topHeight - pipeGap) + "px";
      score++;
    }

    pipeTop.style.left = pipeX + "px";
    pipeBottom.style.left = pipeX + "px";

    const { collision, reason } = checkCollision();
    if (collision) {
      clearInterval(gameInterval);
      document.removeEventListener("keydown", flapHandler);
      document.removeEventListener("click", flap);
      gameOver();
      return;
    }

    scoreDisplay.innerText = score;
  }

  // Game over logic
  function gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    console.log("Game over triggered");

    audio.pause();
    saveScoreOnce(username, score);

    setTimeout(() => {
      startScreen.style.display = "block";
      gameContainer.style.display = "none";

      // Reset game state
      isGameOver = false;
      hasSavedScore = false;
      gameStarted = false;
      usernameInput.value = '';
      scoreDisplay.innerText = '0';

      loadLeaderboard();
    }, 1000);
  }

  // Flap bird
  function flap() {
    if (isGameOver) return;
    velocity = jump;
  }

  // Flap keyboard handler
  function flapHandler(e) {
    if (e.code === "Space") flap();
  }

  // Remove any duplicate event listeners before adding
  function setupEventListeners() {
    document.removeEventListener("keydown", flapHandler);
    document.removeEventListener("click", flap);
    document.addEventListener("keydown", flapHandler);
    document.addEventListener("click", flap);
  }

  // Start game handler
  startButton.addEventListener("click", () => {
    const input = usernameInput.value.trim();
    if (input === "") {
      alert("Please enter your name!");
      return;
    }
    username = input;

    // Show game, hide start screen
    startScreen.style.display = "none";
    gameContainer.style.display = "block";

    // Reset positions and states
    pipeX = gameWidth;
    birdY = gameHeight * 0.4;
    bird.style.top = birdY + "px";
    velocity = 0;
    score = 0;
    isGameOver = false;
    hasSavedScore = false;
    gameStarted = true;

    setupEventListeners();

    audio.play().catch(e => console.log('Audio play failed:', e));

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, 20);

    scoreDisplay.innerText = score;
    console.log("Game loop started");
  });

  // Initial leaderboard load on page ready
  loadLeaderboard();
});
