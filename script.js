// Full corrected script.js

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4BNnqvJAnhnwHcfvK5c7clxZ9cCfnjj0",
  authDomain: "fromthesea-game.firebaseapp.com",
  databaseURL: "https://fromthesea-game-default-rtdb.firebaseio.com",
  projectId: "fromthesea-game",
  storageBucket: "fromthesea-game.appspot.com",
  messagingSenderId: "186139031476",
  appId: "1:186139031476:web:2c9e7b5c7d6db1587dfe3e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const leaderboardRef = database.ref("leaderboard");

const gameContainer = document.getElementById("gameContainer");
const bird = document.getElementById("bird");
const obstacleContainer = document.getElementById("obstacleContainer");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const usernameInput = document.getElementById("username");
const scoreDisplay = document.getElementById("score");
const leaderboardEl = document.getElementById("leaderboard");

let birdY = 200;
let velocity = 0;
let gravity = 0.7;
let isJumping = false;
let obstacles = [];
let score = 0;
let gameInterval;
let username = "";
let gameStarted = false;
let isGameOver = false;
let scoreSaved = false;

const audio = new Audio("theme.mp3");
audio.loop = true;

document.addEventListener("keydown", flapHandler);
document.addEventListener("click", flap);

startButton.addEventListener("click", () => {
  username = usernameInput.value;
  if (username.trim() === "") {
    alert("Please enter a name");
    return;
  }
  startGame();
});

function flapHandler(e) {
  if (e.code === "Space") {
    flap();
  }
}

function flap() {
  velocity = -10;
}

function startGame() {
  startScreen.style.display = "none";
  gameContainer.style.display = "block";
  birdY = 200;
  velocity = 0;
  isJumping = false;
  obstacles = [];
  score = 0;
  isGameOver = false;
  scoreSaved = false;
  gameStarted = true;
  scoreDisplay.innerText = score;
  obstacleContainer.innerHTML = "";
  audio.play();

  gameInterval = setInterval(updateGame, 20);
  generateObstacle();
}

function updateGame() {
  if (isGameOver) return;

  velocity += gravity;
  birdY += velocity;
  if (birdY < 0) birdY = 0;
  if (birdY > 460) birdY = 460;

  bird.style.top = birdY + "px";

  obstacles.forEach((obs, index) => {
    obs.x -= 2;
    obs.topEl.style.left = obs.x + "px";
    obs.bottomEl.style.left = obs.x + "px";

    if (obs.x + 50 < 0) {
      obstacleContainer.removeChild(obs.topEl);
      obstacleContainer.removeChild(obs.bottomEl);
      obstacles.splice(index, 1);
      score++;
      scoreDisplay.innerText = score;
    }
  });

  const { collision } = checkCollision();
  if (collision) {
    gameOver();
  }
}

function generateObstacle() {
  if (isGameOver) return;

  const gap = 150;
  const topHeight = Math.floor(Math.random() * 300);
  const bottomHeight = 500 - topHeight - gap;
  const x = 800;

  const topEl = document.createElement("div");
  topEl.className = "obstacle obstacleTop";
  topEl.style.height = topHeight + "px";
  topEl.style.left = x + "px";

  const bottomEl = document.createElement("div");
  bottomEl.className = "obstacle obstacleBottom";
  bottomEl.style.height = bottomHeight + "px";
  bottomEl.style.left = x + "px";

  obstacleContainer.appendChild(topEl);
  obstacleContainer.appendChild(bottomEl);

  obstacles.push({
    x,
    topEl,
    bottomEl,
    topHeight
  });

  setTimeout(generateObstacle, 2000);
}

function checkCollision() {
  const birdRect = bird.getBoundingClientRect();

  for (let obs of obstacles) {
    const topRect = obs.topEl.getBoundingClientRect();
    const bottomRect = obs.bottomEl.getBoundingClientRect();

    if (
      birdRect.right > topRect.left &&
      birdRect.left < topRect.right &&
      (birdRect.top < topRect.bottom || birdRect.bottom > bottomRect.top)
    ) {
      return { collision: true };
    }
  }

  return { collision: false };
}

function gameOver() {
  if (isGameOver || scoreSaved) {
    console.log("Game over already handled.");
    return;
  }
  console.log("Game over triggered.");
  isGameOver = true;
  scoreSaved = true;

  clearInterval(gameInterval);
  audio.pause();
  document.removeEventListener("keydown", flapHandler);
  document.removeEventListener("click", flap);

  saveScore(username, score);

  setTimeout(() => {
    startScreen.style.display = "block";
    gameContainer.style.display = "none";
    isGameOver = false;
    gameStarted = false;
    usernameInput.value = '';
    scoreDisplay.innerText = '0';
  }, 1000);
}

function saveScore(name, score) {
  if (scoreSaved) {
    console.log("Score already saved.");
    return;
  }
  scoreSaved = true;
  leaderboardRef.push({
    name: name,
    score: score,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    console.log("Score saved successfully.");
  }).catch((error) => {
    console.error("Failed to save score:", error);
    scoreSaved = false; // allow retry if failed
  });
}

function loadLeaderboard() {
  leaderboardRef.off();
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

loadLeaderboard();
