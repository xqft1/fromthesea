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

  firebase.initializeApp(firebaseConfig);
  const leaderboardRef = firebase.database().ref("leaderboard");

  // DOM Elements
  const bird = document.getElementById("bird");
  const pipeTop = document.getElementById("pipe-top");
  const pipeBottom = document.getElementById("pipe-bottom");
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const scoreDisplay = document.getElementById("score");
  const leaderboardList = document.getElementById("leaderboard");
  const startButton = document.getElementById("start-button");
  const usernameInput = document.getElementById("username");

  // Game variables
  const gravity = 0.5;
  const jump = -8;
  let birdY = 200;
  let velocity = 0;
  let pipeX = 500;
  let pipeWidth = 60;
  let pipeGap = 200;
  let score = 0;
  let isGameOver = false;
  let hasSavedScore = false;
  let username = "";
  let gameInterval;

  const audio = new Audio("https://soundimage.org/wp-content/uploads/2021/10/Funky-Gameplay-Loop.mp3");
  audio.loop = true;
  audio.volume = 0.4;

  function initGame() {
    // Set positions
    birdY = 200;
    velocity = 0;
    pipeX = 500;
    score = 0;
    isGameOver = false;
    hasSavedScore = false;

    bird.style.top = `${birdY}px`;
    pipeTop.style.left = `${pipeX}px`;
    pipeBottom.style.left = `${pipeX}px`;

    generatePipes();
    updateScore();
  }

  function generatePipes() {
    const topHeight = Math.random() * 200 + 50;
    const bottomHeight = 400 - topHeight - pipeGap;

    pipeTop.style.height = `${topHeight}px`;
    pipeBottom.style.height = `${bottomHeight}px`;
    pipeBottom.style.top = `${topHeight + pipeGap}px`;
  }

  function updateGame() {
    if (isGameOver) return;

    velocity += gravity;
    birdY += velocity;

    pipeX -= 4;

    if (pipeX < -pipeWidth) {
      pipeX = 500;
      generatePipes();
      score += 1;
      updateScore();
    }

    bird.style.top = `${birdY}px`;
    pipeTop.style.left = `${pipeX}px`;
    pipeBottom.style.left = `${pipeX}px`;

    if (checkCollision()) {
      endGame();
    }
  }

  function updateScore() {
    scoreDisplay.textContent = score;
  }

  function checkCollision() {
    const birdRect = bird.getBoundingClientRect();
    const pipeTopRect = pipeTop.getBoundingClientRect();
    const pipeBottomRect = pipeBottom.getBoundingClientRect();

    if (
      birdRect.top < 0 ||
      birdRect.bottom > window.innerHeight ||
      (birdRect.right > pipeTopRect.left &&
        birdRect.left < pipeTopRect.right &&
        (birdRect.top < pipeTopRect.bottom ||
          birdRect.bottom > pipeBottomRect.top))
    ) {
      return true;
    }

    return false;
  }

  function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    clearInterval(gameInterval);
    audio.pause();
    saveScoreOnce();
    setTimeout(() => {
      startScreen.style.display = "block";
      gameContainer.style.display = "none";
      loadLeaderboard();
    }, 1000);
  }

  function saveScoreOnce() {
    if (hasSavedScore) return;
    hasSavedScore = true;

    if (!username || score <= 0) return;

    leaderboardRef.push({
      name: username,
      score: score,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      console.log("Score saved once.");
    }).catch(err => {
      console.error("Error saving score:", err);
    });
  }

  function flap() {
    if (!isGameOver) {
      velocity = jump;
    }
  }

  document.addEventListener("keydown", e => {
    if (e.code === "Space") flap();
  });

  document.addEventListener("click", () => {
    flap();
  });

  startButton.addEventListener("click", () => {
    const name = usernameInput.value.trim();
    if (!name) {
      alert("Please enter a name.");
      return;
    }

    username = name;
    startScreen.style.display = "none";
    gameContainer.style.display = "block";

    initGame();
    audio.play().catch(() => {});
    gameInterval = setInterval(updateGame, 20);
  });

  function loadLeaderboard() {
    leaderboardRef
      .orderByChild("score")
      .limitToLast(5)
      .once("value", snapshot => {
        const scores = [];
        snapshot.forEach(child => {
          scores.push(child.val());
        });

        scores.sort((a, b) => b.score - a.score);

        leaderboardList.innerHTML = scores.map(score => `<li>${score.name}: ${score.score}</li>`).join("");
      });
  }

  loadLeaderboard();
});
