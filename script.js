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
  console.log("Firebase initialized");
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

  let gameWidth = window.innerWidth;
  let gameHeight = window.innerHeight;
  let pipeWidth = gameWidth * 0.08;
  let pipeSpeed = gameWidth * 0.005;
  let birdSize = gameWidth * 0.08;
  let pipeGap = gameHeight * 0.4;

  let birdY = gameHeight * 0.8;
  let velocity = 0;
  let gravity = 0.4;
  let jump = -8;
  let pipeX = gameWidth;
  let score = 0;
  let username = '';
  let gameInterval;
  let gameStarted = false;
  let isGameOver = false;
  let isSavingScore = false;

  const audio = new Audio('https://soundimage.org/wp-content/uploads/2014/02/Blazing-Stars.mp3');
  audio.loop = true;
  audio.volume = 0.5;

  pipeTop.style.width = pipeWidth + "px";
  pipeBottom.style.width = pipeWidth + "px";
  bird.style.width = birdSize + "px";
  bird.style.height = birdSize + "px";
  bird.style.left = gameWidth * 0.15 + "px";
  bird.style.top = birdY + "px";

  function loadLeaderboard() {
    console.log("Loading leaderboard...");
    leaderboardRef.orderByChild("score").limitToLast(5).on("value", (snapshot) => {
      const leaderboard = [];
      snapshot.forEach((child) => {
        leaderboard.push(child.val());
      });
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboardEl.innerHTML = leaderboard
        .map(entry => `<li>${entry.name}: ${entry.score}</li>`)
        .join('');
      console.log("Leaderboard updated:", leaderboard);
    }, (error) => {
      console.error("Error loading leaderboard:", error);
    });
  }

  function saveScore(name, score) {
  if (isSavingScore) {
    console.log("Score already saving or saved, skipping");
    return;
  }

  isSavingScore = true;
  console.log(`Saving score for ${name}: ${score}`);

  leaderboardRef.push({
    name: name,
    score: score,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    console.log("Score saved successfully");
  }).catch((error) => {
    console.error("Error saving score:", error);
  });
}


  function checkCollision() {
    if (isGameOver) {
      console.log("Collision check skipped due to game over");
      return { collision: false, reason: "game over" };
    }
    const birdRect = bird.getBoundingClientRect();
    const topRect = pipeTop.getBoundingClientRect();
    const bottomRect = pipeBottom.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    if (birdRect.bottom > containerRect.bottom) {
      console.log("Collision detected: bottom");
      return { collision: true, reason: "bottom" };
    }
    if (birdRect.top < containerRect.top) {
      console.log("Collision detected: top");
      return { collision: true, reason: "top" };
    }
    if (
      birdRect.right > topRect.left &&
      birdRect.left < topRect.right &&
      (birdRect.top < topRect.bottom || birdRect.bottom > bottomRect.top)
    ) {
      console.log("Collision detected: pipe");
      return { collision: true, reason: "pipe" };
    }
    return { collision: false, reason: "none" };
  }

  function updateGame() {
    if (isGameOver) {
      console.log("Game loop stopped due to game over");
      return;
    }
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
      console.log(`Stopping game loop due to ${reason} collision`);
      clearInterval(gameInterval);
      document.removeEventListener("keydown", flapHandler);
      document.removeEventListener("click", flap);
      gameOver();
    }

    scoreDisplay.innerText = score;
  }

 function gameOver() {
  if (isGameOver) {
    console.log("Game over already handled, skipping");
    return;
  }

  isGameOver = true;
  console.log("Game over triggered");

  clearInterval(gameInterval);
  audio.pause();
  document.removeEventListener("keydown", flapHandler);
  document.removeEventListener("click", flap);

  saveScore(username, score);

  setTimeout(() => {
    console.log("Returning to main page");
    startScreen.style.display = "block";
    gameContainer.style.display = "none";
    isGameOver = false;
    isSavingScore = false;
    gameStarted = false;
    usernameInput.value = '';
    scoreDisplay.innerText = '0';
  }, 1000);
}


  function flap() {
    if (isGameOver) {
      console.log("Flap ignored during game over");
      return;
    }
    velocity = jump;
  }

  document.removeEventListener("keydown", flapHandler);
  document.removeEventListener("click", flap);
  function flapHandler(e) {
    if (e.code === "Space") flap();
  }
  document.addEventListener("keydown", flapHandler);
  document.addEventListener("click", flap);

  startButton.addEventListener("click", () => {
    console.log("Start button clicked");
    const input = usernameInput.value.trim();
    console.log("Username input:", input);
    if (input === "") {
      console.log("Empty username, alerting user");
      alert("Please enter your name!");
      return;
    }
    console.log("Starting game with username:", input);
    username = input;
    startScreen.style.display = "none";
    gameContainer.style.display = "block";

    pipeX = gameWidth;
    birdY = gameHeight * 0.4;
    bird.style.top = birdY + "px";
    velocity = 0;
    score = 0;
    isGameOver = false;
    isSavingScore = false;
    gameStarted = true;

    document.removeEventListener("keydown", flapHandler);
    document.removeEventListener("click", flap);
    document.addEventListener("keydown", flapHandler);
    document.addEventListener("click", flap);
    audio.play().catch(error => console.log('Autoplay blocked:', error));
    gameInterval = setInterval(updateGame, 20);
    console.log("Game loop started");
  });

  loadLeaderboard();
});
