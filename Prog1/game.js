// Hämta canvas 
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Spelare egebskap
const playerWidth = 50;
const playerHeight = 100;
const attackRange = 60;
let gameRunning = true; 

// rörelser och spel mekanik
let player1 = {
  x: 100,
  y: canvas.height - playerHeight,
  color: 'red',
  hp: 100,
  keyLeft: 'a',
  keyRight: 'd',
  keyAttack: 's',
  keyJump: 'w',
  isJumping: false,     // vi hoppar inte än
  vy: 0,                // vi står stilla 
  attackKeyDown: false  // att hålla ner knappen orsaker inte konstant dmg
};

let player2 = {
  x: 650,
  y: canvas.height - playerHeight,
  color: 'blue',
  hp: 100,
  keyLeft: 'ArrowLeft',
  keyRight: 'ArrowRight',
  keyAttack: 'Arrow',
  keyJump:'ArrowUp', 
  isJumping: false,
  vy: 0,
  attackKeyDown: false
};

// trycks knapparna eller inte 
const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// rörelse hastighet med mera
function updatePlayer(player, opponent) {
  // Horisontell rörelse
  if (keys[player.keyLeft]) player.x -= 10;
  if (keys[player.keyRight]) player.x += 10;

  // lite preference saker villle inte ha en ned tryck tanget gör tick utan clicka utan delay
  if (keys[player.keyAttack]) {
    if (!player.attackKeyDown) {
      player.attackKeyDown = true;
      const distance = Math.abs(player.x - opponent.x);
      if (distance < attackRange) {
        let damage = 5; // bas dmg
        // crit dmg från minecraft
        if (player.vy > 0) {
          damage = 10; // Ökad skada vid krit-attack
        }
        opponent.hp -= damage;
      }
    }
  } else {
    player.attackKeyDown = false;
  }

  // skapad hopp
  if (keys[player.keyJump] && !player.isJumping) {
    player.vy = -15;  // gör att den hoppar upp
    player.isJumping = true;
  }
  // gravutation
  player.y += player.vy;
  player.vy += 0.8; // fall

  // Hopp mekenik typ
  if (player.y >= canvas.height - playerHeight) {
    player.y = canvas.height - playerHeight;
    player.vy = 0;
    player.isJumping = false;
  }
  
  // horizontel spelplan
  player.x = Math.max(0, Math.min(canvas.width - playerWidth, player.x));
}

// spelaren är en stapel
function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, playerWidth, playerHeight);
}

// hp bar
function drawHPBars() {
  ctx.fillStyle = 'white';
  ctx.fillText(`Spelare 1 HP: ${player1.hp}`, 20, 20);
  ctx.fillText(`Spelare 2 HP: ${player2.hp}`, 620, 20);
}

// huvud loop
function gameLoop() {
  if (!gameRunning) return;

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
      player1.hp <= 0 ? 'Spelare 2 vinner!' : 'Spelare 1 vinner!',
      canvas.width / 2 - 150,
      canvas.height / 2
    );
    gameRunning = false;
  } else {
    requestAnimationFrame(gameLoop);
  }
}

// starta om spelet
function restartGame() {
  player1.hp = 100;
  player2.hp = 100;
  player1.x = 100;
  player2.x = 650;
  player1.y = canvas.height - playerHeight;
  player2.y = canvas.height - playerHeight;
  player1.vy = 0;
  player2.vy = 0;
  player1.isJumping = false;
  player2.isJumping = false;
  player1.attackKeyDown = false;
  player2.attackKeyDown = false;
  for (let key in keys) {
    keys[key] = false;
  }
  gameRunning = true;
  ctx.font = '16px Arial';
  gameLoop();
}

// inställningmeny 
const menu = document.getElementById('menu');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

settingsBtn.addEventListener('click', () => {
  menu.style.display = 'block';
});

closeSettingsBtn.addEventListener('click', () => {
  menu.style.display = 'none';
});

saveSettingsBtn.addEventListener('click', () => {
  const p1Left = document.getElementById('p1Left').value.trim();
  const p1Right = document.getElementById('p1Right').value.trim();
  const p1Attack = document.getElementById('p1Attack').value.trim();
  const p1Jump = document.getElementById('p1Jump').value.trim();
  const p2Left = document.getElementById('p2Left').value.trim();
  const p2Right = document.getElementById('p2Right').value.trim();
  const p2Attack = document.getElementById('p2Attack').value.trim();
  const p2Jump = document.getElementById('p2Jump').value.trim();

  if (p1Left !== '') player1.keyLeft = p1Left;
  if (p1Right !== '') player1.keyRight = p1Right;
  if (p1Attack !== '') player1.keyAttack = p1Attack;
  if (p1Jump !== '') player1.keyJump = p1Jump;

  if (p2Left !== '') player2.keyLeft = p2Left;
  if (p2Right !== '') player2.keyRight = p2Right;
  if (p2Attack !== '') player2.keyAttack = p2Attack;
  if (p2Jump !== '') player2.keyJump = p2Jump;

  menu.style.display = 'none';
});

// Restart
const restartBtn = document.getElementById('restartBtn');
restartBtn.addEventListener('click', () => {
  restartGame();
});

ctx.font = '16px Arial';
gameLoop();
