  // Hämta canvas 
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Spelare egebskap
  const playerWidth = 50;
  const playerHeight = 100;
  const attackRange = 50;
  let gameRunning = true; 

  // Behövde lägga till för att jag råka skapa en restart glitch denna grej hindrar loop att stackas på varandra finns en cancelAnimationFrame 
  let animationFrameId = null;

  // --- Player-klassen ---
  // Denna klass hanterar all logik för en spelare: position, rörelse, dash, attack, hopp, gravitation, etc.
  class Player {
    constructor(x, y, color, keyLeft, keyRight, keyAttack, keyJump) {
      // samma sak som jag gjorde tidigare fast mindre kod
      this.x = x;
      this.y = y;
      this.color = color;
      this.hp = 100;
      
      // huvudrörelser
      this.keyLeft = keyLeft;
      this.keyRight = keyRight;
      this.keyAttack = keyAttack;
      this.keyJump = keyJump;
      
      // Rörelse och spelmekanik
      this.isJumping = false;
      this.vy = 0;                    // vi står stilla 
      this.attackKeyDown = false;
      this.isDashing = false;         
      this.lastLeftPress = 0;
      this.lastRightPress = 0;        
      this.isInvincible = false;
      this.canDash = true;         
      this.dashCooldownTimeout = null; 
      this.dashDirection = null;
      this.dashDistance = 100;       
      this.nextAttackTime = 0;
    }
    
    // dash igen
    tryDash(direction, now) {
      if (this.canDash) {
        if (direction === 'left') {
          if (now - this.lastLeftPress < 250) {
            this.dashDirection = "left";
            this.isDashing = true;
            this.canDash = false;
          }
          this.lastLeftPress = now;
        } else if (direction === 'right') {
          if (now - this.lastRightPress < 200) {
            this.dashDirection = "right";
            this.isDashing = true;
            this.canDash = false;
          }
          this.lastRightPress = now;
        }
      }
    }
    
    // uppdaterar spelaren (rörelse, attack, dash, hopp etc.)
    update(opponent) {
      if (this.isDashing && this.dashDirection) {
        // teleportera spelaren dash riktning
        this.x += this.dashDirection === "left" ? -this.dashDistance : this.dashDistance;
        this.isInvincible = true; // Ge invincibility under dash
        // åreställer dash så dashen inte upprepas
        this.dashDirection = null;
        this.isDashing = false;
        
        //invincibillity frame
        setTimeout(() => {
          this.isInvincible = false;
        }, 200);
        
        // start timer cooldown för dash
        this.dashCooldownTimeout = setTimeout(() => {
          this.canDash = true;
          this.dashCooldownTimeout = null;
        }, 600); // Dash cooldown på 600ms
        
        //  vill inte att vi rör oss utanför mappen
        this.x = Math.max(0, Math.min(canvas.width - playerWidth, this.x));
      } else {
        //  horisontell rörelse
        if (keys[this.keyLeft]) this.x -= 9;
        if (keys[this.keyRight]) this.x += 9;
        
        // Skapat hopp
        if (keys[this.keyJump] && !this.isJumping) {
          this.vy = -15;  // gör att den hoppar upp
          this.isJumping = true;
        }
        
        // newtons gravitations lag
        this.y += this.vy;
        this.vy += 0.8; // fall

        // Hoppmekanik typ
        if (this.y >= canvas.height - playerHeight) {
          this.y = canvas.height - playerHeight;
          this.vy = 0;
          this.isJumping = false;
        }
        
        // andragången inte röra ut mapp
        this.x = Math.max(0, Math.min(canvas.width - playerWidth, this.x));
      }
      
      // Attack logik med cooldown
      if (keys[this.keyAttack]) {
        const now = Date.now();
        if (!this.attackKeyDown && now >= this.nextAttackTime) {
          this.attackKeyDown = true;
          const distance = Math.abs(this.x - opponent.x);
          if (distance < attackRange && !opponent.isInvincible) {
            let damage = 5; // bas dmg
            if (this.vy > 0) {
              damage = 10; // crit dmg
            }
            opponent.hp -= damage;
          }
          // cooldown
          this.nextAttackTime = now + 250;
        }
      } else {
        this.attackKeyDown = false;
      }
    }
    
    // Metod för att rita spelaren
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, playerWidth, playerHeight);
    }
  }

  // trycks knapparna eller inte 
  const keys = {};

  // skapa spelare utefter clas player 
  const player1 = new Player(100, canvas.height - playerHeight, 'red', 'a', 'd', 's', 'w');
  const player2 = new Player(850, canvas.height - playerHeight, 'blue', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp');

  // trycks tangent
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true; // updaterar clicks
    
    //dashar den och ta bort repeterande skiten 
    if (!e.repeat) {
      const now = Date.now();
      if (e.key === player1.keyLeft) player1.tryDash('left', now);
      if (e.key === player1.keyRight) player1.tryDash('right', now);
      if (e.key === player2.keyLeft) player2.tryDash('left', now);
      if (e.key === player2.keyRight) player2.tryDash('right', now);
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  // Rita hp barer
  function drawHPBars() {
    ctx.fillStyle = 'white';
    ctx.fillText(`Spelare 1 HP: ${player1.hp}`, 20, 20);
    ctx.fillText(`Spelare 2 HP: ${player2.hp}`, 850, 20);
  }

  // Huvud loop
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
        player1.hp <= 0 ? 'Spelare 2 vinner!' : 'Spelare 1 vinner!',
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
    // Avbryt eventuellt pågående game-loop
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    player1.hp = 100;
    player2.hp = 100;
    player1.x = 100;
    player2.x = 850;
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
    
    // Töm eventuella aktiva tangenter
    for (let key in keys) { 
      keys[key] = false; 
    }
    
    gameRunning = true;
    ctx.font = '16px Arial';
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Inställningmeny 
  class Menu {
    constructor() {
      // Hämta meny-elementen
      this.menu = document.getElementById('menu');
      this.settingsBtn = document.getElementById('settingsBtn');
      this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
      this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
      
      // Lägger till eventlyssnare
      this.settingsBtn.addEventListener('click', () => { this.open(); });
      this.closeSettingsBtn.addEventListener('click', () => { this.close(); });
      this.saveSettingsBtn.addEventListener('click', () => { this.save(); });
    }
    
    open() {
      this.menu.style.display = 'block';
    }
    
    close() {
      this.menu.style.display = 'none';
    }
    
    save() {
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
      
      this.close();
    }
  }

  // Initiera menyn
  const menuInstance = new Menu();
  restartBtn.addEventListener('click', () => { restartGame(); });

  ctx.font = '16px Arial';
  gameLoop();
