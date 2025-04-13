const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const playerWidth = 50;
const playerHeight = 100;
const attackRange = 60;

const player1 = {
  x: 100,
  y: canvas.height - playerHeight,
  color: 'red',
  hp: 100,
  keyLeft: 'a',
  keyRight: 'd',
  keyAttack: 'w'
};

const player2 = {
  x: 650,
  y: canvas.height - playerHeight,
  color: 'blue',
  hp: 100,
  keyLeft: 'ArrowLeft',
  keyRight: 'ArrowRight',
  keyAttack: 'ArrowUp'
};

const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

function updatePlayer(player, opponent) {
  if (keys[player.keyLeft]) player.x -= 5;
  if (keys[player.keyRight]) player.x += 5;

  // Attack
  if (keys[player.keyAttack]) {
    const distance = Math.abs(player.x - opponent.x);
    if (distance < attackRange) {
      opponent.hp -= 1;
    }
  }

  // Stop at canvas edges
  player.x = Math.max(0, Math.min(canvas.width - playerWidth, player.x));
}

function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, playerWidth, playerHeight);
}

function drawHPBars() {
  ctx.fillStyle = 'white';
  ctx.fillText(`Player 1 HP: ${player1.hp}`, 20, 20);
  ctx.fillText(`Player 2 HP: ${player2.hp}`, 620, 20);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer(player1, player2);
  updatePlayer(player2, player1);

  drawPlayer(player1);
  drawPlayer(player2);
  drawHPBars();

  if (player1.hp <= 0 || player2.hp <= 0) {
    ctx.fillStyle = 'yellow';
    ctx.font = '40px Arial';
    ctx.fillText(
      player1.hp <= 0 ? 'Player 2 Wins!' : 'Player 1 Wins!',
      canvas.width / 2 - 150,
      canvas.height / 2
    );
  } else {
    requestAnimationFrame(gameLoop);
  }
}

ctx.font = '16px Arial';
gameLoop();
