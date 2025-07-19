document.addEventListener("DOMContentLoaded", () => {
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

  const userId = firebase.auth().currentUser.uid;
leaderboardRef.child(userId).set({
  name: username,
  score: score,
  timestamp: firebase.database.ServerValue.TIMESTAMP,
});


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
  let isGameOver = false;
  let hasSavedScore = false;

  const audio = new Audio('https://soundimage.org/wp-content/uploads/2014/02/Blazing-Stars.mp3');
  audio.loop = true;
  audio.volume = 0.5;

  function setupStyles() {
    pipeTop.style.width = pipeWidth + "px";
    pipeBottom.style.width = pipeWidth + "px";
    bird.style.width = birdSize + "px";
    bird.style.height = birdSize + "px";
    bird.style.left = gameWidth * 0.15 + "px";
    bird.style.top = birdY + "px";
  }

  function loadLeaderboard() {
    leaderboardRef.orderByChild("score").limitToLast(5).on("value", (snapshot) => {
      const leaderboard = [];
      snapshot.forEach((child) => {
        leaderboard.push(child.val());
      });
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboardEl.innerHTML = leaderboard
        .map(entry => `<li>${entry.name}: ${entry.score}</li>`)
        .join('');
    });
  }

  function saveScoreOnce(name, score) {
    if (hasSavedScore) return;
    hasSavedScore = true;

    leaderboardRef.push({
      name: name,
      score: score,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      console.log("Score saved once.");
    }).catch(err => console.error("Error saving score:", err));
  }

  function checkCollision() {
    const birdRect = bird.getBoundingClientRect();
    const topRect = pipeTop.getBoundingClientRect();
    const bottomRect = pipeBottom.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    if (birdRect.bottom > containerRect.bottom || birdRect.top < containerRect.top) {
      return true;
    }

    if (
      birdRect.right > topRect.left &&
      birdRect.left < topRect.right &&
      (birdRect.top < topRect.bottom || birdRect.bottom > bottomRect.top)
    ) {
      return true;
    }

    return false;
  }

  function updateGame() {
    if (isGameOver) return;

    velocity += gravity;
    birdY += velocity;
    bird.style.top = birdY + "px";

    pipeX -= pipeSpeed;

    if (pipeX < -pipeWidth) {
      pipeX = gameWidth;
      const topHeight = Math.floor(Math.random() * (gameHeight * 0.4)) + 50;
      pipeTop.style.height = topHeight + "px";
      pipeBottom.style.height = (gameHeight - topHeight - pipeGap) + "px";
      score++;
    }

    pipeTop.style.left = pipeX + "px";
    pipeBottom.style.left = pipeX + "px";

    scoreDisplay.innerText = score;

    if (checkCollision()) {
      gameOver();
    }
  }

  function gameOver() {
    if (isGameOver) return;
    isGameOver = true;

    clearInterval(gameInterval);
    document.removeEventListener("keydown", flapHandler);
    document.removeEventListener("click", flap);
    audio.pause();

    saveScoreOnce(username, score);

    setTimeout(() => {
      startScreen.style.display = "block";
      gameContainer.style.display = "none";
      usernameInput.value = '';
      scoreDisplay.innerText = '0';
    }, 1000);
  }

  function flap() {
    if (!isGameOver) {
      velocity = jump;
    }
  }

  function flapHandler(e) {
    if (e.code === "Space") flap();
  }

  function startGame() {
    const input = usernameInput.value.trim();
    if (!input) {
      alert("Please enter your name!");
      return;
    }

    username = input;
    birdY = gameHeight * 0.4;
    velocity = 0;
    pipeX = gameWidth;
    score = 0;
    isGameOver = false;
    hasSavedScore = false;

    startScreen.style.display = "none";
    gameContainer.style.display = "block";

    setupStyles();
    document.addEventListener("keydown", flapHandler);
    document.addEventListener("click", flap);
    audio.play().catch(() => console.warn("Audio blocked"));

    gameInterval = setInterval(updateGame, 20);
  }

  startButton.addEventListener("click", startGame);
  setupStyles();
  loadLeaderboard();
});
