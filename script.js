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
    leaderboardRef.off(); // Clear existing listener
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

  function saveScore(name, score) {
  if (isSavingScore) {
    console.log("Score already saved, skipping");
    return Promise.resolve();
  }
  isSavingScore = true;
  console.log(`Saving score for ${name}: ${score}`);
  return leaderboardRef.push({
    name: name,
    score: score,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    console.log("Score saved successfully");
  }).catch((error) => {
    console.error("Error saving score:", error);
  });
}

function gameOver() {
  if (isGameOver) {
    console.log("Game over already triggered, ignoring");
    return;
  }
  isGameOver = true;
  console.log("Game over triggered");

  clearInterval(gameInterval);
  audio.pause();

  document.removeEventListener("keydown", flapHandler);
  document.removeEventListener("click", flap);

  saveScore(username, score).finally(() => {
    setTimeout(() => {
      console.log("Returning to main page");
      startScreen.style.display = "block";
      gameContainer.style.display = "none";
      
      // Reset game state but DO NOT reset isSavingScore here
      isGameOver = false;
      // isSavingScore = false;  <-- remove this line to block multiple saves
      gameStarted = false;
      usernameInput.value = '';
      scoreDisplay.innerText = '0';

      loadLeaderboard();

      // Optionally disable start button to prevent restarting and scoring again
      startButton.disabled = true;
      usernameInput.disabled = true;

    }, 1000);
  });
}



  function checkCollision() {
    if (isGameOver) return { collision: false };
    const birdRect = bird.getBoundingClientRect();
    const topRect = pipeTop.getBoundingClientRect();
    const bottomRect = pipeBottom.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    if (birdRect.bottom > containerRect.bottom || birdRect.top < containerRect.top) {
      return { collision: true };
    }
    if (
      birdRect.right > topRect.left &&
      birdRect.left < topRect.right &&
      (birdRect.top < topRect.bottom || birdRect.bottom > bottomRect.top)
    ) {
      return { collision: true };
    }
    return { collision: false };
  }

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

    if (collision) {
      console.log(`Stopping game loop due to ${reason} collision`);
      clearInterval(gameInterval);
      gameInterval = null;  // avoid duplicate clears
      document.removeEventListener("keydown", flapHandler);
      document.removeEventListener("click", flap);
      gameOver();
      return; // stop further update logic
}

    }

    scoreDisplay.innerText = score;
  }

  function flap() {
    if (!isGameOver) velocity = jump;
  }

  function flapHandler(e) {
    if (e.code === "Space") flap();
  }

  startButton.addEventListener("click", () => {
    const input = usernameInput.value.trim();
    if (input === "") return alert("Please enter your name!");
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

    document.addEventListener("keydown", flapHandler);
    document.addEventListener("click", flap);
    audio.play().catch(console.log);
    gameInterval = setInterval(updateGame, 20);
  });

  loadLeaderboard();
});
