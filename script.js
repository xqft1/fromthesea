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

// Sizes based on screen
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

// Initialise sizes
pipeTop.style.width = pipeWidth + "px";
pipeBottom.style.width = pipeWidth + "px";
bird.style.width = birdSize + "px";
bird.style.height = birdSize + "px";
bird.style.left = gameWidth * 0.15 + "px";
bird.style.top = birdY + "px";

// Load and display leaderboard
function loadLeaderboard() {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5); // Top 5
  leaderboardEl.innerHTML = leaderboard
    .map(entry => `<li>${entry.name}: ${entry.score}</li>`)
    .join('');
}

// Save score
function saveScore(name, score) {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push({ name, score });
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function updateGame() {
  velocity += gravity;
  birdY += velocity;
  bird.style.top = birdY + "px";

  // Move pipes from right to left
  pipeX -= pipeSpeed;

  // Reset pipes after leaving screen
  if (pipeX < -pipeWidth) {
    pipeX = gameWidth;
    let topHeight = Math.floor(Math.random() * (gameHeight * 0.4)) + 50;
    pipeTop.style.height = topHeight + "px";
    pipeBottom.style.height = (gameHeight - topHeight - pipeGap) + "px";
    score++;
  }

  pipeTop.style.left = pipeX + "px";
  pipeBottom.style.left = pipeX + "px";

  // Collision detection
  let birdRect = bird.getBoundingClientRect();
  let topRect = pipeTop.getBoundingClientRect();
  let bottomRect = pipeBottom.getBoundingClientRect();
  let containerRect = gameContainer.getBoundingClientRect();

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
  clearInterval(gameInterval);
  saveScore(username, score);
  alert(`Game Over, ${username}! Your Score: ${score}`);
  location.reload();
}

function flap() {
  velocity = jump;
}

// Event listeners
document.addEventListener("keydown", flap);
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




  // Set up initial positions
  pipeX = gameWidth;
  birdY = gameHeight * 0.4;
  bird.style.top = birdY + "px";
  velocity = 0;
  score = 0;

  gameInterval = setInterval(updateGame, 20);
});

loadLeaderboard();


// Audio setup
    const audio = new Audio('https://soundimage.org/wp-content/uploads/2014/02/Blazing-Stars.mp3');
    audio.loop = true; // Loop the music
    audio.volume = 0.5; // Set initial volume
    let gameStarted = false;

// Start game and music on first spacebar press
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !gameStarted) {
        gameStarted = true;
        audio.play().catch(error => console.log('Autoplay blocked:', error)); // Start music
        gameLoop(); // Start game loop
      }
      if (e.code === 'Space' && gameStarted) bird.velocity = -7; // Jump during gameplay
    });

  