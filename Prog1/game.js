// Inställningar och konstanter
const SETTINGS = {
  PLAYER_WIDTH: 50,
  PLAYER_HEIGHT: 100,
  ATTACK_RANGE: 50,
  GRAVITY: 0.8,
  JUMP_SPEED: -15,
  MOVE_SPEED: 9,
  ATTACK_COOLDOWN: 250,
  DASH_DISTANCE: 100,
  DASH_COOLDOWN: 600,
  DASH_INVINCIBILITY_DURATION: 200,
  ATTACK_DAMAGE: 5,
  CRIT_DAMAGE: 10,
  HIT_DURATION: 200  // Varaktighet för hit-effekten i ms
};

// Globala variabler och canvas
let gameRunning = true;
let animationFrameId = null;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.font = '16px Arial';
const keys = {}; // Objekt som håller reda på tangenttryckningar

// Player-klassen: Hanterar spelarens rörelse, dash, attack, hopp och gravitation
class Player {
  // Konstruktor med parametrar för position, standardfärg, hit-färg och tangentkontroller
  constructor(x, y, defaultColor, hitColor, keyLeft, keyRight, keyAttack, keyJump) {
    this.x = x;
    this.y = y;
    this.defaultColor = defaultColor;  // Spelarens normala färg
    this.hitColor = hitColor;          // Spelarens unika flash-färg vid träff
    this.hp = 100;
    this.lastHitTime = 0;              // Tid för senaste träffen

    // Tangentkontroller
    this.keyLeft = keyLeft;
    this.keyRight = keyRight;
    this.keyAttack = keyAttack;
    this.keyJump = keyJump;

    // Spelmekanik
    this.isJumping = false;
    this.vy = 0;
    this.attackKeyDown = false;
    this.isDashing = false;
    this.lastLeftPress = 0;
    this.lastRightPress = 0;
    this.isInvincible = false;
    this.canDash = true;
    this.dashCooldownTimeout = null;
    this.dashDirection = null;
    this.nextAttackTime = 0;
  }

  // Hjälpfunktion: Konvertera hex-färg (t.ex. "#ff8888") till "R, G, B" format
  hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length == 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  }

  // Minska HP och sätt senaste träffstid
  takeDamage(amount) {
    this.hp -= amount;
    this.lastHitTime = Date.now();
  }

  // Försök att dasha baserat på riktning och aktuell tid
  tryDash(direction, now) {
    if (this.canDash) {
      if (direction == 'left') {
        if (now - this.lastLeftPress < 250) {
          this.dashDirection = 'left';
          this.isDashing = true;
          this.canDash = false;
        }
        this.lastLeftPress = now;
      } else if (direction == 'right') {
        if (now - this.lastRightPress < 200) {
          this.dashDirection = 'right';
          this.isDashing = true;
          this.canDash = false;
        }
        this.lastRightPress = now;
      }
    }
  }

  // Återställ spelarens tillstånd för omstart
  reset(initialX, initialY) {
    this.x = initialX;
    this.y = initialY;
    this.hp = 100;
    this.vy = 0;
    this.isJumping = false;
    this.attackKeyDown = false;
    this.isDashing = false;
    this.isInvincible = false;
    this.canDash = true;
    this.dashDirection = null;
    if (this.dashCooldownTimeout != null) {
      clearTimeout(this.dashCooldownTimeout);
      this.dashCooldownTimeout = null;
    }
    this.lastHitTime = 0;
  }

  // Uppdatera spelarens position och händelser såsom rörelse, hopp, dash och attack
  update(opponent) {
    if (this.isDashing && this.dashDirection != null) {
      this.x += (this.dashDirection == 'left') ? -SETTINGS.DASH_DISTANCE : SETTINGS.DASH_DISTANCE;
      this.isInvincible = true;
      this.dashDirection = null;
      this.isDashing = false;
      setTimeout(() => {
        this.isInvincible = false;
      }, SETTINGS.DASH_INVINCIBILITY_DURATION);
      this.dashCooldownTimeout = setTimeout(() => {
        this.canDash = true;
        this.dashCooldownTimeout = null;
      }, SETTINGS.DASH_COOLDOWN);
      this.x = Math.max(0, Math.min(canvas.width - SETTINGS.PLAYER_WIDTH, this.x));
    } else {
      if (keys[this.keyLeft]) {
        this.x -= SETTINGS.MOVE_SPEED;
      }
      if (keys[this.keyRight]) {
        this.x += SETTINGS.MOVE_SPEED;
      }
      if (keys[this.keyJump] && this.isJumping == false) {
        this.vy = SETTINGS.JUMP_SPEED;
        this.isJumping = true;
      }
      this.y += this.vy;
      this.vy += SETTINGS.GRAVITY;
      if (this.y >= canvas.height - SETTINGS.PLAYER_HEIGHT) {
        this.y = canvas.height - SETTINGS.PLAYER_HEIGHT;
        this.vy = 0;
        this.isJumping = false;
      }
      this.x = Math.max(0, Math.min(canvas.width - SETTINGS.PLAYER_WIDTH, this.x));
    }

    if (keys[this.keyAttack]) {
      let now = Date.now();
      if (!this.attackKeyDown && now >= this.nextAttackTime) {
        this.attackKeyDown = true;
        let distance = Math.abs(this.x - opponent.x);
        if (distance < SETTINGS.ATTACK_RANGE && opponent.isInvincible == false) {
          let damage = (this.vy > 0) ? SETTINGS.CRIT_DAMAGE : SETTINGS.ATTACK_DAMAGE;
          opponent.takeDamage(damage);
        }
        this.nextAttackTime = now + SETTINGS.ATTACK_COOLDOWN;
      }
    } else {
      this.attackKeyDown = false;
    }
  }

  // Rita spelaren. Först ritas rektangeln med standardfärg, sedan appliceras en fade-effekt om spelaren nyligen tagit skada,
  // och slutligen ritas en cirkel i mitten som visar spelarens exakta position.
  draw() {
    ctx.fillStyle = this.defaultColor;
    ctx.fillRect(this.x, this.y, SETTINGS.PLAYER_WIDTH, SETTINGS.PLAYER_HEIGHT);

    let now = Date.now();
    let elapsed = now - this.lastHitTime;
    if (elapsed < SETTINGS.HIT_DURATION) {
      let alpha = 1 - (elapsed / SETTINGS.HIT_DURATION);
      ctx.fillStyle = `rgba(${this.hexToRgb(this.hitColor)}, ${alpha})`;
      ctx.fillRect(this.x, this.y, SETTINGS.PLAYER_WIDTH, SETTINGS.PLAYER_HEIGHT);
    }

    ctx.beginPath();
    let centerX = this.x + SETTINGS.PLAYER_WIDTH / 2;
    let centerY = this.y + SETTINGS.PLAYER_HEIGHT / 2;
    ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.stroke();
  }
}

// Menu-klassen: Hanterar inställningsmenyn
class Menu {
  constructor() {
    this.menu = document.getElementById('menu');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.settingsBtn.addEventListener('click', () => this.open());
    this.closeSettingsBtn.addEventListener('click', () => this.close());
    this.saveSettingsBtn.addEventListener('click', () => this.save());
  }

  open() {
    this.menu.style.display = 'block';
  }

  close() {
    this.menu.style.display = 'none';
  }

  save() {
    let p1Left = document.getElementById('p1Left').value.trim();
    let p1Right = document.getElementById('p1Right').value.trim();
    let p1Attack = document.getElementById('p1Attack').value.trim();
    let p1Jump = document.getElementById('p1Jump').value.trim();
    let p2Left = document.getElementById('p2Left').value.trim();
    let p2Right = document.getElementById('p2Right').value.trim();
    let p2Attack = document.getElementById('p2Attack').value.trim();
    let p2Jump = document.getElementById('p2Jump').value.trim();
    
    if (p1Left != '') { player1.keyLeft = p1Left; }
    if (p1Right != '') { player1.keyRight = p1Right; }
    if (p1Attack != '') { player1.keyAttack = p1Attack; }
    if (p1Jump != '') { player1.keyJump = p1Jump; }
    if (p2Left != '') { player2.keyLeft = p2Left; }
    if (p2Right != '') { player2.keyRight = p2Right; }
    if (p2Attack != '') { player2.keyAttack = p2Attack; }
    if (p2Jump != '') { player2.keyJump = p2Jump; }
    
    this.close();
  }
}

// Händelselyssnare för tangenttryck
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (!e.repeat) {
    let now = Date.now();
    if (e.key == player1.keyLeft) { player1.tryDash('left', now); }
    if (e.key == player1.keyRight) { player1.tryDash('right', now); }
    if (e.key == player2.keyLeft) { player2.tryDash('left', now); }
    if (e.key == player2.keyRight) { player2.tryDash('right', now); }
  }
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Rita HP-barer
function drawHPBars() {
  ctx.fillStyle = 'white';
  ctx.fillText(`Spelare 1 HP: ${player1.hp}`, 20, 20);
  ctx.fillText(`Spelare 2 HP: ${player2.hp}`, 850, 20);
}

// Huvudloopen för spelet
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  player1.update(player2);
  player2.update(player1);
  
  player1.draw();
  player2.draw();
  drawHPBars();
  
  if (player1.hp <= 0 || player2.hp <= 0) {
    ctx.fillStyle = 'yellow';
    ctx.font = '40px Arial';
    ctx.fillText(
      (player1.hp <= 0) ? 'Spelare 2 vinner!' : 'Spelare 1 vinner!',
      canvas.width / 2 - 150,
      canvas.height / 2
    );
    gameRunning = false;
  } else {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

// Starta om spelet
function restartGame() {
  if (animationFrameId != null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  player1.reset(100, canvas.height - SETTINGS.PLAYER_HEIGHT);
  player2.reset(850, canvas.height - SETTINGS.PLAYER_HEIGHT);
  for (let key in keys) {
    keys[key] = false;
  }
  gameRunning = true;
  ctx.font = '16px Arial';
  animationFrameId = requestAnimationFrame(gameLoop);
}

// Initiering av spelare, restart-knapp och meny
const player1 = new Player(100, canvas.height - SETTINGS.PLAYER_HEIGHT, 'red', '#ff8888', 'a', 'd', 's', 'w');
const player2 = new Player(850, canvas.height - SETTINGS.PLAYER_HEIGHT, 'blue', '#8888ff', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp');
const restartBtn = document.getElementById('restartBtn');
restartBtn.addEventListener('click', () => restartGame());
const menuInstance = new Menu();
gameLoop();
