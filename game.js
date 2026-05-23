const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const startButton = document.querySelector("#start");
const pauseButton = document.querySelector("#pause");
const restartButton = document.querySelector("#restart");

const cells = 20;
const tile = canvas.width / cells;
const tickMs = 145;
const minSwipeDistance = 24;

let snake;
let food;
let direction;
let nextDirection;
let score;
let best = Number(localStorage.getItem("snake-best") || 0);
let timer = null;
let gameState = "ready";
let pointerStart = null;

bestEl.textContent = best;

function resetGame() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
    { x: 5, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = score;
  food = placeFood();
  gameState = "ready";
  showOverlay("Ready?", "Press Space or tap Start to play.");
  draw();
}

function startGame() {
  if (gameState === "running") return;
  if (gameState === "gameover") resetGame();

  gameState = "running";
  hideOverlay();
  timer = window.setInterval(tick, tickMs);
}

function pauseGame() {
  if (gameState !== "running") return;

  window.clearInterval(timer);
  timer = null;
  gameState = "paused";
  showOverlay("Paused", "Press Space or tap Start to keep going.");
}

function restartGame() {
  window.clearInterval(timer);
  timer = null;
  resetGame();
}

function tick() {
  direction = nextDirection;

  const head = snake[0];
  const nextHead = {
    x: wrap(head.x + direction.x),
    y: wrap(head.y + direction.y),
  };

  if (isCollision(nextHead)) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    food = placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function isCollision(part) {
  const hitsSelf = snake.some((segment) => segment.x === part.x && segment.y === part.y);
  return hitsSelf;
}

function wrap(value) {
  if (value < 0) return cells - 1;
  if (value >= cells) return 0;
  return value;
}

function placeFood() {
  let spot;

  do {
    spot = {
      x: Math.floor(Math.random() * cells),
      y: Math.floor(Math.random() * cells),
    };
  } while (snake.some((segment) => segment.x === spot.x && segment.y === spot.y));

  return spot;
}

function endGame() {
  window.clearInterval(timer);
  timer = null;
  gameState = "gameover";

  if (score > best) {
    best = score;
    localStorage.setItem("snake-best", String(best));
    bestEl.textContent = best;
  }

  showOverlay("Game over", "Press Space or tap Restart for another run.");
}

function changeDirection(newDirection) {
  const movingOpposite =
    newDirection.x + nextDirection.x === 0 && newDirection.y + nextDirection.y === 0;

  if (!movingOpposite) {
    nextDirection = newDirection;
  }
}

function steerTowardPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const targetX = ((clientX - rect.left) / rect.width) * cells;
  const targetY = ((clientY - rect.top) / rect.height) * cells;
  const head = snake[0];
  const dx = targetX - head.x - 0.5;
  const dy = targetY - head.y - 0.5;

  if (Math.abs(dx) > Math.abs(dy)) {
    changeDirection({ x: dx < 0 ? -1 : 1, y: 0 });
  } else {
    changeDirection({ x: 0, y: dy < 0 ? -1 : 1 });
  }
}

function steerFromSwipe(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < minSwipeDistance) {
    steerTowardPoint(end.x, end.y);
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    changeDirection({ x: Math.sign(dx), y: 0 });
  } else {
    changeDirection({ x: 0, y: Math.sign(dy) });
  }
}

function draw() {
  ctx.fillStyle = "#172017";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(241, 246, 236, 0.05)";
  ctx.lineWidth = 1;

  for (let i = 1; i < cells; i += 1) {
    const pos = i * tile;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#ff3b30" : "#7ee36d";
    drawRoundedCell(segment.x, segment.y, 7);
  });
}

function drawFood() {
  ctx.fillStyle = "#ff6b5f";
  ctx.beginPath();
  ctx.arc(food.x * tile + tile / 2, food.y * tile + tile / 2, tile * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoundedCell(x, y, radius) {
  const inset = 3;
  const px = x * tile + inset;
  const py = y * tile + inset;
  const size = tile - inset * 2;

  ctx.beginPath();
  ctx.roundRect(px, py, size, size, radius);
  ctx.fill();
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

const directions = {
  ArrowUp: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
};

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    gameState === "running" ? pauseGame() : startGame();
    return;
  }

  const newDirection = directions[event.key];
  if (newDirection) {
    event.preventDefault();
    changeDirection(newDirection);
  }
});

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => {
    const dir = button.dataset.dir;
    const touchDirections = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    changeDirection(touchDirections[dir]);
  });
});

canvas.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;

  steerFromSwipe(pointerStart, { x: event.clientX, y: event.clientY });
  pointerStart = null;

  if (gameState !== "running") {
    startGame();
  }
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", pauseGame);
restartButton.addEventListener("click", restartGame);

resetGame();
