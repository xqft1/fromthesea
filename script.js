// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Replace with your own config from Firebase Console
  const firebaseConfig = {
    apiKey: "AIzaSyBhyDiExECoc6J1TqJu6XeQCxgySMP7K5Q",
    authDomain: "fromthesea-c967a.firebaseapp.com",
    databaseURL: "https://fromthesea-c967a-default-rtdb.firebaseio.com/",
    projectId: "fromthesea-c967a",
    storageBucket: "fromthesea-c967a.appspot.com",
    messagingSenderId: "921773077324",
    appId: "1:921773077324:web:d9e58bc48e9de742ff95e9",
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const leaderboardRef = database.ref("leaderboard");

  // Game elements
  const bird = document.getElementById("bird");
  const pipeTop = document.getElementById("pipe-top");
  const pipeBottom = document.getElementById("pipe-bottom");
  const scoreDisplay = document.getElementById("score");
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const startButton = document.getElementById("start-button");
  const usernameInput = document.getElementById("username");
  const leaderboardEl = document.getElementById("leaderboard");

  // Screen dimensions
  let gameWidth = window.innerWidth;
  let gameHeight = window.innerHeight;

  // Sizes
  let pipeWidth = gameWidth * 0.08;
  let pipeSpeed = gameWidth * 0.005;
  let birdSize = gameWidth * 0.08;
  let pipeGap = gameHeight * 0.4;

  // Game state
  let birdY = gameHeight * 0.8;
  let velocity = 0;
  let gravity = 0.4;
  let jump = -8;
  let pipeX = gameWidth;
  let score = 0;
  let username = '';
  let gameInterval;
  let gameStarted = false;
  let isGameOver = false; // New flag to prevent duplicate gameOver calls

  // Audio
  const audio = new Audio('https://soundimage.org/wp-content/uploads/2014/02/Blazing-Stars.mp3');
  audio.loop = true;
  audio.volume = 0.5;

  // Initialize positions and sizes
  pipeTop.style.width = pipeWidth + "px";
  pipeBottom.style.width = pipeWidth + "px";
  bird.style.width = birdSize + "px";
  bird.style.height = birdSize + "px";
  bird.style.left = gameWidth * 0.15 + "px";
  bird.style.top = birdY + "px";

  // Load leaderboard
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
    }, (error) => {
      console.error("Error loading leaderboard:", error);
    });
  }

  // Save score
  function saveScore(name, score) {
    console.log(`Saving score for ${name}: ${score}`); // Debug log
    const newScoreRef = leaderboardRef.push();
    newScoreRef.set({
      name: name,
      score: score,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).catch((error) => {
      console.error("Error saving score:", error);
    });
  }

  // Game loop
  function updateGame() {
    if (isGameOver) return; // Stop updates if game is over
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

    const birdRect = bird.getBoundingClientRect();
    const topRect = pipeTop.getBoundingClientRect();
    const bottomRect = pipeBottom.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    if (
      birdRect.bottom > containerRect.bottom ||
      birdRect.top < containerRect.top ||
      (birdRect.right > topRect.left &&
       birdRect.left < topRect.right &&
       (birdRect.top < topRect.bottom || birdRect.bottom > bottomRect.top))
    ) {
      gameOver();
    }

    scoreDisplay.innerText = score;
  }

  function gameOver() {
    if (isGameOver) return; // Prevent multiple calls
    isGameOver = true;
    console.log("Game over triggered"); // Debug log
    clearInterval(gameInterval);
    saveScore(username, score);
    alert(`Game Over, ${username}! Your Score: ${score}`);
    setTimeout(() => location.reload(), 100); // Delay reload
  }

  function flap() {
    velocity = jump;
    if (!gameStarted) {
      gameStarted = true;
      audio.play().catch(error => console.log('Autoplay blocked:', error));
      gameInterval = setInterval(updateGame, 20);
    }
  }

  // Event listeners
  // Remove existing listeners to prevent duplicates
  document.removeEventListener("keydown", flapHandler);
  document.removeEventListener("click", flap);
  function flapHandler(e) {
    if (e.code === "Space") flap();
  }
  document.addEventListener("keydown", flapHandler);
  document.addEventListener("click", flap);

  startButton.addEventListener("click", () => {
    const input = usernameInput.value.trim();
    if (input === "") {
      alert("Please enter your name!");
      return;
    }
    username = input;
    startScreen.style.display = "none";
    gameContainer.style.display = "block";

    pipeX = gameWidth;
    birdY = gameHeight * 0.4;
    bird.style.top = birdY + "px";
    velocity = 0;
    score = 0;
    isGameOver = false; // Reset flag
  });

  // Start by loading leaderboard
  loadLeaderboard();
});

  // Start by loading leaderboard
  loadLeaderboard();
});


let lastSavedScore = null;

function saveScore(name, score) {
  const scoreKey = `${name}-${score}-${Date.now()}`;
  if (scoreKey === lastSavedScore) {
    console.log("Duplicate score save prevented");
    return;
  }
  lastSavedScore = scoreKey;
  console.log(`Saving score for ${name}: ${score}`);
  const newScoreRef = leaderboardRef.push();
  newScoreRef.set({
    name: name,
    score: score,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).catch((error) => {
    console.error("Error saving score:", error);
  });
}

// Reset in startButton click handler
startButton.addEventListener("click", () => {
  // ... existing code ...
  isGameOver = false;
  lastSavedScore = null; // Reset
});
