// Hämta canvas 
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Spelare egebskap
const playerWidth = 50;
const playerHeight = 100;
const attackRange = 50;
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
  isJumping: false,
  vy: 0,                    // vi står stilla 
  attackKeyDown: false,
  isDashing: false,         
  lastLeftPress: 0,
  lastRightPress: 0,        
  isInvincible: false,
  canDash: true,         
  dashCooldownTimeout: null, 
  dashDirection: null,
  dashDistance: 100,       
  nextAttackTime: 0         
};

let player2 = {
  x: 650,
  y: canvas.height - playerHeight,
  color: 'blue',
  hp: 100,
  keyLeft: 'ArrowLeft',
  keyRight: 'ArrowRight',
  keyAttack: 'ArrowDown',
  keyJump: 'ArrowUp', 
  isJumping: false,
  vy: 0,
  attackKeyDown: false,
  isDashing: false,         // dash mekanik flagga
  lastLeftPress: 0,         // tid för senaste vänster tryck
  lastRightPress: 0,        // tid för senaste höger tryck
  isInvincible: false,      // invincibility under dash
  canDash: true,            // tillåta dash
  dashCooldownTimeout: null, // cooldown timer
  dashDirection: null,      // dash riktning
  dashDistance: 100,        // dash distans
  nextAttackTime: 0         // tid nästa attack är tillåten
};

// trycks knapparna eller inte 
const keys = {};

// dash mekanik
function tryDash(player, direction, now) {
  if (player.canDash) {
    if (direction === 'left') {
      if (now - player.lastLeftPress < 250) {
        player.dashDirection = "left";
        player.isDashing = true;
        player.canDash = false;
      }
      player.lastLeftPress = now;
    } else if (direction === 'right') {
      if (now - player.lastRightPress < 250) {
        player.dashDirection = "right";
        player.isDashing = true;
        player.canDash = false;
      }
      player.lastRightPress = now;
    }
  }
}

document.addEventListener('keydown', (e) => {
  keys[e.key] = true; // updaterar händelser
  
  //dashar den och ta bort repeterande skiten 
  if (!e.repeat) {
    const now = Date.now();
    if (e.key === player1.keyLeft) tryDash(player1, 'left', now);
    if (e.key === player1.keyRight) tryDash(player1, 'right', now);
    if (e.key === player2.keyLeft) tryDash(player2, 'left', now);
    if (e.key === player2.keyRight) tryDash(player2, 'right', now);
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Rörelse attack dash och hopp logik
function updatePlayer(player, opponent) {
  // Om dash är aktiv -> utför teleport-liknande dash
  if (player.isDashing && player.dashDirection) {
    // teleportera spelaren baserat på dash riktning
    player.x += player.dashDirection === "left" ? -player.dashDistance : player.dashDistance;
    player.isInvincible = true; // Ge invincibility under dash
    // åreställer dash så dashen inte upprepas
    player.dashDirection = null;
    player.isDashing = false;
    
    //invincibillity frame
    setTimeout(() => {
      player.isInvincible = false;
    }, 100);
    
    // start timer cooldown för dash
    player.dashCooldownTimeout = setTimeout(() => {
      player.canDash = true;
      player.dashCooldownTimeout = null;
    }, 600); // Dash cooldown på 600ms
    // kontroll av gränser vill inte att vi rör oss utanför mappen
    player.x = Math.max(0, Math.min(canvas.width - playerWidth, player.x));
  } else {
    // Normal horisontell rörelse
    if (keys[player.keyLeft]) player.x -= 9;
    if (keys[player.keyRight]) player.x += 9;
  }
  
  // Attack logik med cooldown
  if (keys[player.keyAttack]) {
    const now = Date.now();
    if (!player.attackKeyDown && now >= player.nextAttackTime) {
      player.attackKeyDown = true;
      const distance = Math.abs(player.x - opponent.x);
      if (distance < attackRange && !opponent.isInvincible) {
        let damage = 5; // bas dmg
        if (player.vy > 0) {
          damage = 10; // crit dmg
        }
        opponent.hp -= damage;
      }
      // cooldown
      player.nextAttackTime = now + 250;
    }
  } else {
    player.attackKeyDown = false;
  }

  // Skapat hopp
  if (keys[player.keyJump] && !player.isJumping) {
    player.vy = -15;  // gör att den hoppar upp
    player.isJumping = true;
  }
  
  // newtons gravitations lag
  player.y += player.vy;
  player.vy += 0.8; // fall

  // Hoppmekanik typ
  if (player.y >= canvas.height - playerHeight) {
    player.y = canvas.height - playerHeight;
    player.vy = 0;
    player.isJumping = false;
  }
  
  // Håll spelaren inom spelplanens gränser
  player.x = Math.max(0, Math.min(canvas.width - playerWidth, player.x));
}

// Rita spelaren
function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, playerWidth, playerHeight);
}

// Rita HP barer
function drawHPBars() {
  ctx.fillStyle = 'white';
  ctx.fillText(`Spelare 1 HP: ${player1.hp}`, 20, 20);
  ctx.fillText(`Spelare 2 HP: ${player2.hp}`, 620, 20);
}

// Huvud loop
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

// Starta om spelet
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
  
  // Återställ dash, cooldown och invincibility
  player1.isDashing = false;
  player1.isInvincible = false;
  player1.canDash = true;
  player1.dashDirection = null;
  if (player1.dashCooldownTimeout) { clearTimeout(player1.dashCooldownTimeout); player1.dashCooldownTimeout = null; }
  player2.isDashing = false;
  player2.isInvincible = false;
  player2.canDash = true;
  player2.dashDirection = null;
  if (player2.dashCooldownTimeout) { clearTimeout(player2.dashCooldownTimeout); player2.dashCooldownTimeout = null; }
  
  for (let key in keys) { 
    keys[key] = false; 
  }
  gameRunning = true;
  ctx.font = '16px Arial';
  gameLoop();
}

// Inställningmeny 
const menu = document.getElementById('menu');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

settingsBtn.addEventListener('click', () => { menu.style.display = 'block'; });
closeSettingsBtn.addEventListener('click', () => { menu.style.display = 'none'; });
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
restartBtn.addEventListener('click', () => { restartGame(); });

ctx.font = '16px Arial';
gameLoop();
