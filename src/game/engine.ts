import {
  Platform,
  Trap,
  Checkpoint,
  SecretScroll,
  CollectibleItem,
  Enemy,
  Projectile,
  Particle,
  Rect,
} from './types';
import { LevelData } from './levelGenerator';
import { NinjaPlayer } from './player';
import { soundEngine } from './audio';

export interface GameEngineCallbacks {
  onScoreUpdate: (coins: number, diamonds: number) => void;
  onHealthUpdate: (health: number, maxHealth: number) => void;
  onScrollsUpdate: (collected: number) => void;
  onLevelComplete: (scrolls: number, coinsEarned: number, diamondsEarned: number, timeSeconds: number) => void;
  onGameOver: () => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public levelData: LevelData;
  public player: NinjaPlayer;
  public callbacks: GameEngineCallbacks;

  // Running state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private animFrameId: number | null = null;
  private lastTimestamp: number = 0;

  // Camera
  public cameraX: number = 0;
  public cameraY: number = 0;
  public screenWidth: number = 1200;
  public screenHeight: number = 700;
  public screenShake: number = 0;

  // Active entities
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public coinsCollectedThisRun: number = 0;
  public diamondsCollectedThisRun: number = 0;
  public scrollsCollectedCount: number = 0;
  public activeCheckpointX: number;
  public activeCheckpointY: number;

  // Inputs
  public inputLeft: boolean = false;
  public inputRight: boolean = false;

  // Level statistics
  public levelStartTime: number = 0;
  public isLevelFinished: boolean = false;

  // Ambient wind leaves
  private ambientLeaves: { x: number; y: number; speedX: number; speedY: number; size: number }[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    levelData: LevelData,
    player: NinjaPlayer,
    callbacks: GameEngineCallbacks
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2d context');
    this.ctx = context;
    this.levelData = levelData;
    this.player = player;
    this.callbacks = callbacks;

    this.activeCheckpointX = levelData.spawnPoint.x;
    this.activeCheckpointY = levelData.spawnPoint.y;
    this.levelStartTime = Date.now();

    // Initialize ambient wind particles
    for (let i = 0; i < 40; i++) {
      this.ambientLeaves.push({
        x: Math.random() * this.levelData.worldWidth,
        y: Math.random() * this.levelData.worldHeight,
        speedX: 1.2 + Math.random() * 2.2,
        speedY: 0.3 + Math.random() * 0.8,
        size: 3 + Math.random() * 4,
      });
    }

    this.handleResize();
  }

  public handleResize() {
    this.screenWidth = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.screenHeight = this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.canvas.width = this.screenWidth;
    this.canvas.height = this.screenHeight;
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public respawnAtCheckpoint() {
    this.player.resetPosition(this.activeCheckpointX, this.activeCheckpointY);
    this.player.stats.health = this.player.stats.maxHealth;
    this.callbacks.onHealthUpdate(this.player.stats.health, this.player.stats.maxHealth);
  }

  // --- Actions triggered by Controls ---

  public triggerJump() {
    if (this.player.jump()) {
      // Dust particles at feet
      this.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 6);
    }
  }

  public triggerAttack() {
    if (this.player.attack()) {
      // Screen micro-shake
      this.screenShake = 3;
    }
  }

  public triggerDash() {
    if (this.player.dash()) {
      this.screenShake = 5;
      this.spawnShadowBurst(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        15
      );
    }
  }

  public triggerDisguise() {
    if (this.player.disguise()) {
      this.spawnPoof(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
    }
  }

  public triggerShuriken() {
    if (this.player.throwShuriken()) {
      const dir = this.player.direction;
      this.projectiles.push({
        id: `shuriken_${Date.now()}_${Math.random()}`,
        x: this.player.x + (dir === 1 ? this.player.width + 6 : -6),
        y: this.player.y + 20,
        vx: dir * 14,
        vy: -0.5,
        radius: 7,
        isPlayer: true,
        damage: 1 + Math.floor(this.player.stats.shurikenLevel / 2),
        stuck: false,
        rotation: 0,
      });
    }
  }

  // --- Main Loop ---

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    if (!this.isPaused && !this.isLevelFinished) {
      this.update();
    }

    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update() {
    if (this.player.state === 'dead') {
      return;
    }

    // Update Player
    this.player.update(this.inputLeft, this.inputRight);

    // Platform Collisions & Wall Slide
    this.handlePlayerPlatformCollisions();

    // Check bottom fall death
    if (this.player.y > this.levelData.worldHeight - 40) {
      this.player.takeDamage(this.player.stats.health);
      this.callbacks.onHealthUpdate(0, this.player.stats.maxHealth);
      this.callbacks.onGameOver();
      return;
    }

    // Traps
    this.updateTraps();

    // Enemies
    this.updateEnemies();

    // Projectiles
    this.updateProjectiles();

    // Collectibles & Checkpoints & Exit
    this.updateInteractiveEntities();

    // Particles & Ambient leaves
    this.updateParticles();

    // Camera follow player with smooth lerping
    const targetCamX = this.player.x + this.player.width / 2 - this.screenWidth * 0.4;
    const targetCamY = this.player.y + this.player.height / 2 - this.screenHeight * 0.55;

    this.cameraX += (targetCamX - this.cameraX) * 0.08;
    this.cameraY += (targetCamY - this.cameraY) * 0.08;

    // Clamp camera within world bounds
    this.cameraX = Math.max(0, Math.min(this.levelData.worldWidth - this.screenWidth, this.cameraX));
    this.cameraY = Math.max(0, Math.min(this.levelData.worldHeight - this.screenHeight, this.cameraY));

    if (this.screenShake > 0) {
      this.screenShake *= 0.85;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }
  }

  // --- Platform & Wall Collisions ---

  private handlePlayerPlatformCollisions() {
    const p = this.player;
    let groundedThisFrame = false;
    let wallSlidingThisFrame = false;

    const pRect = p.getRect();

    for (const plat of this.levelData.platforms) {
      // Check collision
      if (
        p.x + p.width > plat.x &&
        p.x < plat.x + plat.width &&
        p.y + p.height > plat.y &&
        p.y < plat.y + plat.height
      ) {
        // Compute overlap on each axis
        const overlapX = Math.min(p.x + p.width - plat.x, plat.x + plat.width - p.x);
        const overlapY = Math.min(p.y + p.height - plat.y, plat.y + plat.height - p.y);

        if (overlapY < overlapX && overlapY < 24) {
          // Vertical landing or ceiling bump
          if (p.vy > 0 && p.y + p.height - plat.y <= 24) {
            // Landed on platform
            p.y = plat.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.jumpsLeft = 2;
            groundedThisFrame = true;
          } else if (p.vy < 0 && plat.y + plat.height - p.y <= 24) {
            // Hit ceiling
            p.y = plat.y + plat.height;
            p.vy = 0;
          }
        } else if (plat.type === 'ground' || plat.type === 'wall') {
          // Horizontal Wall collision
          if (p.x + p.width / 2 < plat.x + plat.width / 2) {
            // Wall to right
            p.x = plat.x - p.width;
            p.vx = 0;
            if (!groundedThisFrame && p.vy > 0 && this.inputRight) {
              wallSlidingThisFrame = true;
              p.wallSide = 1;
            }
          } else {
            // Wall to left
            p.x = plat.x + plat.width;
            p.vx = 0;
            if (!groundedThisFrame && p.vy > 0 && this.inputLeft) {
              wallSlidingThisFrame = true;
              p.wallSide = -1;
            }
          }
        }
      }
    }

    p.isGrounded = groundedThisFrame;
    p.isWallSliding = wallSlidingThisFrame;

    if (p.isWallSliding && Math.random() > 0.4) {
      // Wall slide sparks / dust
      const dustX = p.wallSide === 1 ? p.x + p.width : p.x;
      this.spawnDust(dustX, p.y + p.height * 0.7, 1);
    }
  }

  // --- Traps Simulation ---

  private updateTraps() {
    const p = this.player;
    const pRect = p.getRect();
    const slashBox = p.getAttackHitbox();

    for (const trap of this.levelData.traps) {
      if (!trap.active) continue;

      if (trap.type === 'spikes') {
        // Pit spikes collision
        if (this.checkRectOverlap(pRect, trap)) {
          if (!p.isDashing) {
            if (p.takeDamage(1)) {
              this.callbacks.onHealthUpdate(p.stats.health, p.stats.maxHealth);
              this.screenShake = 6;
              if (p.stats.health <= 0) {
                this.callbacks.onGameOver();
              }
            }
          }
        }
      } else if (trap.type === 'swinging_blade') {
        // Oscillate angle
        if (trap.angle !== undefined && trap.speed && trap.pivot && trap.radius) {
          trap.angle += trap.speed;
          const bladeX = trap.pivot.x + Math.sin(trap.angle) * trap.radius;
          const bladeY = trap.pivot.y + Math.cos(trap.angle) * trap.radius;
          trap.x = bladeX - trap.width / 2;
          trap.y = bladeY - trap.height / 2;

          // Check hit
          if (this.checkRectOverlap(pRect, trap) && !p.isDashing) {
            if (p.takeDamage(1)) {
              this.callbacks.onHealthUpdate(p.stats.health, p.stats.maxHealth);
              this.screenShake = 7;
              if (p.stats.health <= 0) this.callbacks.onGameOver();
            }
          }
        }
      } else if (trap.type === 'spiked_wheel') {
        // Roll back and forth
        if (trap.speed && trap.pivot) {
          trap.x += trap.speed;
          if (trap.x > trap.pivot.y - trap.width) {
            trap.speed = -Math.abs(trap.speed);
          } else if (trap.x < trap.pivot.x) {
            trap.speed = Math.abs(trap.speed);
          }

          if (this.checkRectOverlap(pRect, trap) && !p.isDashing) {
            if (p.takeDamage(1)) {
              this.callbacks.onHealthUpdate(p.stats.health, p.stats.maxHealth);
              this.screenShake = 6;
              if (p.stats.health <= 0) this.callbacks.onGameOver();
            }
          }
        }
      } else if (trap.type === 'urn') {
        // Slicing breakable blue urns
        if (slashBox && this.checkRectOverlap(slashBox, trap)) {
          trap.active = false;
          soundEngine.playKatanaHit();
          this.spawnPoof(trap.x + trap.width / 2, trap.y + trap.height / 2);
          // Drop coin or diamond
          this.levelData.collectibles.push({
            id: `drop_${Date.now()}`,
            x: trap.x + 8,
            y: trap.y + 4,
            width: 20,
            height: 20,
            type: Math.random() > 0.4 ? 'coin' : 'diamond',
            value: 1,
            collected: false,
          });
        }
      }
    }
  }

  // --- Enemies AI ---

  private updateEnemies() {
    const p = this.player;
    const pRect = p.getRect();
    const slashBox = p.getAttackHitbox();

    for (let i = this.levelData.enemies.length - 1; i >= 0; i--) {
      const e = this.levelData.enemies[i];

      if (e.state === 'dead') {
        if (e.deadTimer !== undefined) {
          e.deadTimer--;
          if (e.deadTimer <= 0) {
            this.levelData.enemies.splice(i, 1);
          }
        }
        continue;
      }

      // Check player katana slash hit
      if (slashBox && this.checkRectOverlap(slashBox, e)) {
        e.health -= 2 + this.player.stats.katanaLevel;
        soundEngine.playKatanaHit();
        this.screenShake = 5;
        this.spawnBloodShadow(e.x + e.width / 2, e.y + e.height / 2, 10);

        if (e.health <= 0) {
          e.state = 'dead';
          e.deadTimer = 20;
          this.coinsCollectedThisRun += e.type === 'boss_demon' ? 50 : 5;
          this.diamondsCollectedThisRun += e.type === 'boss_demon' ? 10 : 1;
          this.callbacks.onScoreUpdate(this.coinsCollectedThisRun, this.diamondsCollectedThisRun);
          soundEngine.playDiamond();
          this.spawnShadowBurst(e.x + e.width / 2, e.y + e.height / 2, 25);
          continue;
        }
      }

      // Player shadow dash hits enemies!
      if (p.isDashing && this.checkRectOverlap(pRect, e)) {
        e.health -= 3;
        soundEngine.playKatanaHit();
        this.spawnBloodShadow(e.x + e.width / 2, e.y + e.height / 2, 12);
        if (e.health <= 0) {
          e.state = 'dead';
          e.deadTimer = 20;
          this.coinsCollectedThisRun += e.type === 'boss_demon' ? 50 : 5;
          this.callbacks.onScoreUpdate(this.coinsCollectedThisRun, this.diamondsCollectedThisRun);
          this.spawnShadowBurst(e.x + e.width / 2, e.y + e.height / 2, 20);
          continue;
        }
      }

      // Enemy Patrol & AI
      const distToPlayer = Math.hypot(
        p.x + p.width / 2 - (e.x + e.width / 2),
        p.y + p.height / 2 - (e.y + e.height / 2)
      );

      // If player is disguised, enemies ignore him
      const canSeePlayer = !p.isDisguised && distToPlayer < e.sightRange;

      if (e.attackCooldown > 0) e.attackCooldown--;

      if (canSeePlayer) {
        e.state = 'alert';
        e.direction = p.x > e.x ? 1 : -1;

        if (e.type === 'spear_guard') {
          // Thrust when within 65px
          if (distToPlayer < 70 && e.attackCooldown <= 0) {
            e.attackCooldown = 55;
            if (!p.isDashing) {
              if (p.takeDamage(1)) {
                this.callbacks.onHealthUpdate(p.stats.health, p.stats.maxHealth);
                if (p.stats.health <= 0) this.callbacks.onGameOver();
              }
            }
          } else {
            // Walk toward player
            e.x += e.direction * 1.8;
          }
        } else if (e.type === 'katana_ronin') {
          // Charge & slash
          if (distToPlayer < 60 && e.attackCooldown <= 0) {
            e.attackCooldown = 45;
            soundEngine.playKatanaSlash();
            if (!p.isDashing) {
              if (p.takeDamage(1)) {
                this.callbacks.onHealthUpdate(p.stats.health, p.stats.maxHealth);
                if (p.stats.health <= 0) this.callbacks.onGameOver();
              }
            }
          } else {
            e.x += e.direction * 2.8;
          }
        } else if (e.type === 'shuriken_ninja') {
          // Shoot blue projectile
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 80;
            this.projectiles.push({
              id: `enemy_proj_${Date.now()}_${i}`,
              x: e.x + (e.direction === 1 ? e.width + 4 : -4),
              y: e.y + 18,
              vx: e.direction * 8.5,
              vy: -0.2,
              radius: 6,
              isPlayer: false,
              damage: 1,
              stuck: false,
              rotation: 0,
            });
            soundEngine.playShurikenThrow();
          }
        } else if (e.type === 'boss_demon') {
          // Boss: Charge, slam, throw shadow blast
          if (distToPlayer < 90 && e.attackCooldown <= 0) {
            e.attackCooldown = 60;
            this.screenShake = 9;
            soundEngine.playKatanaHit();
            if (!p.isDashing) {
              if (p.takeDamage(1)) {
                this.callbacks.onHealthUpdate(p.stats.health, p.stats.maxHealth);
                if (p.stats.health <= 0) this.callbacks.onGameOver();
              }
            }
          } else {
            e.x += e.direction * 2.2;
          }
        }
      } else {
        // Simple Patrol
        e.state = 'patrol';
        e.x += e.direction * 1.2;
        if (e.x > e.patrolMaxX) {
          e.direction = -1;
        } else if (e.x < e.patrolMinX) {
          e.direction = 1;
        }
      }
    }
  }

  // --- Projectiles ---

  private updateProjectiles() {
    const p = this.player;
    const pRect = p.getRect();
    const slashBox = p.getAttackHitbox();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      if (proj.stuck) {
        if (proj.stuckTimer !== undefined) {
          proj.stuckTimer--;
          if (proj.stuckTimer <= 0) {
            this.projectiles.splice(i, 1);
          }
        }
        continue;
      }

      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.rotation += 0.3;

      // Projectile / Wall collision
      for (const plat of this.levelData.platforms) {
        if (
          proj.x > plat.x &&
          proj.x < plat.x + plat.width &&
          proj.y > plat.y &&
          proj.y < plat.y + plat.height
        ) {
          proj.stuck = true;
          proj.stuckTimer = 40;
          this.spawnDust(proj.x, proj.y, 3);
          break;
        }
      }

      if (proj.stuck) continue;

      if (proj.isPlayer) {
        // Player shuriken hits enemy
        for (const e of this.levelData.enemies) {
          if (e.state === 'dead') continue;
          if (
            proj.x > e.x &&
            proj.x < e.x + e.width &&
            proj.y > e.y &&
            proj.y < e.y + e.height
          ) {
            e.health -= proj.damage;
            soundEngine.playKatanaHit();
            this.spawnBloodShadow(proj.x, proj.y, 6);
            this.projectiles.splice(i, 1);

            if (e.health <= 0) {
              e.state = 'dead';
              e.deadTimer = 20;
              this.coinsCollectedThisRun += 5;
              this.callbacks.onScoreUpdate(this.coinsCollectedThisRun, this.diamondsCollectedThisRun);
              this.spawnShadowBurst(e.x + e.width / 2, e.y + e.height / 2, 20);
            }
            break;
          }
        }
      } else {
        // Enemy projectile hits player OR player slashes it away!
        if (slashBox && this.checkPointInRect({ x: proj.x, y: proj.y }, slashBox)) {
          // Deflect projectile!
          soundEngine.playKatanaHit();
          this.spawnShadowBurst(proj.x, proj.y, 8);
          this.projectiles.splice(i, 1);
          continue;
        }

        if (this.checkPointInRect({ x: proj.x, y: proj.y }, pRect) && !p.isDashing) {
          if (p.takeDamage(proj.damage)) {
            this.callbacks.onHealthUpdate(p.stats.health, p.stats.maxHealth);
            this.screenShake = 5;
            this.projectiles.splice(i, 1);
            if (p.stats.health <= 0) this.callbacks.onGameOver();
          }
        }
      }
    }
  }

  // --- Collectibles, Checkpoints & Exit ---

  private updateInteractiveEntities() {
    const p = this.player;
    const pRect = p.getRect();

    // Collectibles (Coins & Diamonds & Hearts)
    for (const item of this.levelData.collectibles) {
      if (item.collected) continue;

      const dist = Math.hypot(
        p.x + p.width / 2 - (item.x + item.width / 2),
        p.y + p.height / 2 - (item.y + item.height / 2)
      );

      // Proximity magnet
      if (dist < 55) {
        item.collected = true;
        if (item.type === 'coin') {
          this.coinsCollectedThisRun += item.value;
          soundEngine.playCoin();
        } else if (item.type === 'diamond') {
          this.diamondsCollectedThisRun += item.value;
          soundEngine.playDiamond();
        } else if (item.type === 'heart') {
          p.stats.health = Math.min(p.stats.maxHealth, p.stats.health + 1);
          this.callbacks.onHealthUpdate(p.stats.health, p.stats.maxHealth);
          soundEngine.playDiamond();
        }

        this.callbacks.onScoreUpdate(this.coinsCollectedThisRun, this.diamondsCollectedThisRun);
        this.spawnGlowSparks(item.x + 10, item.y + 10, '#38bdf8', 6);
      }
    }

    // 3 Secret Ancient Scrolls
    for (const scroll of this.levelData.scrolls) {
      if (scroll.collected) continue;
      if (this.checkRectOverlap(pRect, scroll)) {
        scroll.collected = true;
        this.scrollsCollectedCount++;
        this.callbacks.onScrollsUpdate(this.scrollsCollectedCount);
        soundEngine.playScrollFound();
        this.spawnGlowSparks(scroll.x + 14, scroll.y + 14, '#60a5fa', 18);
        this.screenShake = 4;
      }
    }

    // Checkpoints (Torii Shrines)
    for (const cp of this.levelData.checkpoints) {
      if (!cp.activated && this.checkRectOverlap(pRect, cp)) {
        cp.activated = true;
        this.activeCheckpointX = cp.x + 10;
        this.activeCheckpointY = cp.y + cp.height - p.height - 2;
        soundEngine.playCheckpointBell();
        this.spawnGlowSparks(cp.x + cp.width / 2, cp.y + cp.height / 2, '#38bdf8', 25);
      }
    }

    // Exit Torii Portal
    const exitDist = Math.hypot(
      p.x + p.width / 2 - this.levelData.exitPoint.x,
      p.y + p.height / 2 - this.levelData.exitPoint.y
    );

    if (exitDist < 60 && !this.isLevelFinished) {
      this.isLevelFinished = true;
      const timeTaken = Math.floor((Date.now() - this.levelStartTime) / 1000);
      soundEngine.playVictoryFanfare();
      this.spawnShadowBurst(
        this.levelData.exitPoint.x,
        this.levelData.exitPoint.y,
        40
      );
      this.callbacks.onLevelComplete(
        this.scrollsCollectedCount,
        this.coinsCollectedThisRun,
        this.diamondsCollectedThisRun,
        timeTaken
      );
    }
  }

  // --- Particles & FX ---

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.life--;
      part.alpha = part.life / part.maxLife;

      if (part.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Ambient wind leaves across screen
    for (const leaf of this.ambientLeaves) {
      leaf.x += leaf.speedX;
      leaf.y += leaf.speedY;
      if (leaf.x > this.levelData.worldWidth) leaf.x = 0;
      if (leaf.y > this.levelData.worldHeight) leaf.y = 0;
    }
  }

  public spawnDust(x: number, y: number, count: number = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        size: 2 + Math.random() * 3,
        alpha: 0.7,
        color: 'rgba(148, 163, 184, 0.6)',
        life: 18,
        maxLife: 18,
      });
    }
  }

  public spawnShadowBurst(x: number, y: number, count: number = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        alpha: 0.9,
        color: Math.random() > 0.4 ? '#38bdf8' : '#1e3a8a',
        life: 25,
        maxLife: 25,
      });
    }
  }

  public spawnBloodShadow(x: number, y: number, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        alpha: 0.9,
        color: Math.random() > 0.5 ? '#0284c7' : '#030712',
        life: 20,
        maxLife: 20,
      });
    }
  }

  public spawnPoof(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        alpha: 0.8,
        color: 'rgba(56, 189, 248, 0.4)',
        life: 24,
        maxLife: 24,
      });
    }
  }

  public spawnGlowSparks(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        alpha: 1,
        color,
        life: 22,
        maxLife: 22,
      });
    }
  }

  // --- Geometry Helpers ---

  private checkRectOverlap(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  private checkPointInRect(pt: { x: number; y: number }, r: Rect): boolean {
    return pt.x >= r.x && pt.x <= r.x + r.width && pt.y >= r.y && pt.y <= r.y + r.height;
  }

  // --- SILHOUETTE RENDERER ---

  public render() {
    const ctx = this.ctx;
    const w = this.screenWidth;
    const h = this.screenHeight;

    ctx.save();
    // Screen shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 2;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 1. SKY GRADIENT (Deep Blue to Midnight Black)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, this.levelData.stageMeta.skyColorTop);
    skyGrad.addColorStop(1, this.levelData.stageMeta.skyColorBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. GIANT BLUE MOON & STARS
    this.renderMoonAndStars(ctx, w, h);

    // 3. PARALLAX SILHOUETTE MOUNTAINS & PAGODAS (Layer 1 - Distant)
    this.renderParallaxMountains(ctx, w, h);

    // 4. PARALLAX BAMBOO & TORII GATES (Layer 2 - Midground)
    this.renderParallaxBamboos(ctx, w, h);

    // Apply Camera Translation for Game World Layer
    ctx.save();
    ctx.translate(-Math.floor(this.cameraX), -Math.floor(this.cameraY));

    // 5. TERRAIN & PLATFORMS (Pitch Black Silhouette with Blue Rim)
    this.renderPlatforms(ctx);

    // 6. CHECKPOINTS (Torii Shrines with Mystic Blue Flames)
    this.renderCheckpoints(ctx);

    // 7. EXIT PORTAL TORII GATE
    this.renderExitPortal(ctx);

    // 8. TRAPS & HAZARDS
    this.renderTraps(ctx);

    // 9. COLLECTIBLES & SECRET SCROLLS
    this.renderCollectibles(ctx);

    // 10. ENEMIES
    this.renderEnemies(ctx);

    // 11. PROJECTILES
    this.renderProjectiles(ctx);

    // 12. NINJA ARASHI (THE BLUE SHADOW)
    this.renderPlayer(ctx);

    // 13. PARTICLES & SLASH EFFECTS
    this.renderParticlesAndSlashes(ctx);

    ctx.restore(); // Restore camera translation

    // 14. FOREGROUND VIGNETTE & MIST OVERLAY
    this.renderVignette(ctx, w, h);

    ctx.restore();
  }

  private renderMoonAndStars(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 127 + 45) % w);
      const sy = ((i * 79 + 25) % (h * 0.4));
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3 === 0 ? 1.5 : 1), 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing Blue Moon
    const moonX = w * 0.78;
    const moonY = h * 0.22;
    const moonRadius = 65;

    // Moon Outer Aura
    const aura = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 2.8);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    aura.addColorStop(0.5, 'rgba(30, 58, 138, 0.18)');
    aura.addColorStop(1, 'rgba(3, 7, 18, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Moon Core
    const moonGrad = ctx.createRadialGradient(moonX - 15, moonY - 15, 10, moonX, moonY, moonRadius);
    moonGrad.addColorStop(0, '#e0f2fe');
    moonGrad.addColorStop(0.8, '#7dd3fc');
    moonGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle moon craters
    ctx.fillStyle = 'rgba(14, 116, 144, 0.2)';
    ctx.beginPath();
    ctx.arc(moonX - 15, moonY - 10, 14, 0, Math.PI * 2);
    ctx.arc(moonX + 18, moonY + 8, 18, 0, Math.PI * 2);
    ctx.arc(moonX - 5, moonY + 22, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderParallaxMountains(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const px = this.cameraX * 0.15;
    ctx.fillStyle = '#060d1f'; // Deep indigo silhouette

    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 40) {
      const worldX = x + px;
      const my = h * 0.55 + Math.sin(worldX * 0.002) * 90 + Math.cos(worldX * 0.005) * 45;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Distant Pagoda silhouettes on ridge
    const pagodaSpacing = 900;
    const startPagoda = Math.floor(px / pagodaSpacing) * pagodaSpacing;
    for (let pos = startPagoda; pos < startPagoda + w + pagodaSpacing; pos += pagodaSpacing) {
      const screenP = pos - px;
      if (screenP > -100 && screenP < w + 100) {
        this.drawPagodaSilhouette(ctx, screenP, h * 0.48, 0.45);
      }
    }
  }

  private renderParallaxBamboos(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const px = this.cameraX * 0.35;
    ctx.fillStyle = '#020713'; // Darker midground silhouette

    // Stalks
    const stalkSpacing = 160;
    const startStalk = Math.floor(px / stalkSpacing) * stalkSpacing;
    for (let pos = startStalk; pos < startStalk + w + stalkSpacing; pos += stalkSpacing) {
      const sx = pos - px + Math.sin(pos) * 40;
      ctx.fillRect(sx, h * 0.3, 10, h * 0.7);
      // Leaves
      ctx.beginPath();
      ctx.ellipse(sx - 15, h * 0.45, 20, 4, -0.4, 0, Math.PI * 2);
      ctx.ellipse(sx + 20, h * 0.52, 22, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPagodaSilhouette(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#060d1f';

    // 3 tiers of curved Japanese roofs
    for (let tier = 0; tier < 3; tier++) {
      const ty = -tier * 40;
      const rw = 90 - tier * 18;
      ctx.beginPath();
      ctx.moveTo(-rw, ty);
      ctx.quadraticCurveTo(0, ty - 15, rw, ty);
      ctx.lineTo(rw - 12, ty + 12);
      ctx.quadraticCurveTo(0, ty + 2, -(rw - 12), ty + 12);
      ctx.closePath();
      ctx.fill();

      // Pillars
      ctx.fillRect(-rw * 0.5, ty + 12, rw, 28);
    }
    // Finial spire
    ctx.fillRect(-2, -145, 4, 30);
    ctx.restore();
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#000000'; // Pure silhouette black

    for (const plat of this.levelData.platforms) {
      // Draw platform body
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      // Subtle cyan/blue rim light on top surface
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(plat.x, plat.y, plat.width, 2.5);

      // Grass / rugged rocky bumps on ground platforms
      if (plat.type === 'ground') {
        ctx.fillStyle = '#000000';
        for (let gx = plat.x + 8; gx < plat.x + plat.width - 8; gx += 22) {
          ctx.beginPath();
          ctx.moveTo(gx, plat.y);
          ctx.lineTo(gx + 4, plat.y - 4);
          ctx.lineTo(gx + 8, plat.y);
          ctx.fill();
        }
      } else if (plat.type === 'bridge') {
        // Wooden bridge ropes and slats
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(plat.x, plat.y);
        ctx.quadraticCurveTo(plat.x + plat.width / 2, plat.y + 10, plat.x + plat.width, plat.y);
        ctx.stroke();
      }

      ctx.fillStyle = '#000000';
    }
  }

  private renderCheckpoints(ctx: CanvasRenderingContext2D) {
    for (const cp of this.levelData.checkpoints) {
      // Torii Shrine Gate
      const cx = cp.x + cp.width / 2;
      const cy = cp.y;

      ctx.fillStyle = '#000000';
      // Left & right pillars
      ctx.fillRect(cx - 20, cy, 7, cp.height);
      ctx.fillRect(cx + 13, cy, 7, cp.height);
      // Top curved crossbeam
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 8);
      ctx.quadraticCurveTo(cx, cy - 14, cx + 30, cy - 8);
      ctx.lineTo(cx + 26, cy + 2);
      ctx.quadraticCurveTo(cx, cy - 4, cx - 26, cy + 2);
      ctx.closePath();
      ctx.fill();

      // Shrine Flame (Glowing Blue Soul Flame if activated)
      const flameX = cx;
      const flameY = cy + 20;

      if (cp.activated) {
        // Ethereal blue fire
        const fireGrad = ctx.createRadialGradient(flameX, flameY, 2, flameX, flameY, 26);
        fireGrad.addColorStop(0, '#ffffff');
        fireGrad.addColorStop(0.3, '#38bdf8');
        fireGrad.addColorStop(0.7, 'rgba(30, 58, 138, 0.4)');
        fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(flameX, flameY, 26, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing flame teardrop
        const flicker = Math.sin(Date.now() * 0.01) * 3;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(flameX - 6, flameY + 6);
        ctx.quadraticCurveTo(flameX + flicker, flameY - 14, flameX, flameY - 18);
        ctx.quadraticCurveTo(flameX, flameY - 8, flameX + 6, flameY + 6);
        ctx.closePath();
        ctx.fill();
      } else {
        // Unlit stone lantern
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(flameX, flameY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderExitPortal(ctx: CanvasRenderingContext2D) {
    const ep = this.levelData.exitPoint;
    const time = Date.now() * 0.003;

    // Glowing blue vortex
    const vortexGrad = ctx.createRadialGradient(ep.x, ep.y, 10, ep.x, ep.y, 60);
    vortexGrad.addColorStop(0, '#ffffff');
    vortexGrad.addColorStop(0.4, '#38bdf8');
    vortexGrad.addColorStop(0.8, 'rgba(30, 64, 175, 0.5)');
    vortexGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, 60, 0, Math.PI * 2);
    ctx.fill();

    // Portal Torii gate framing vortex
    ctx.fillStyle = '#000000';
    ctx.fillRect(ep.x - 35, ep.y - 50, 10, 90);
    ctx.fillRect(ep.x + 25, ep.y - 50, 10, 90);
    // Top arch
    ctx.fillRect(ep.x - 45, ep.y - 60, 90, 12);
    // Glowing Japanese Kanji: "道" (Way) or "忍" (Ninja)
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.fillText('門', ep.x, ep.y + 8);
  }

  private renderTraps(ctx: CanvasRenderingContext2D) {
    for (const trap of this.levelData.traps) {
      if (!trap.active) continue;

      if (trap.type === 'spikes') {
        // Ground Spikes (punji stakes)
        ctx.fillStyle = '#000000';
        const spikeCount = Math.floor(trap.width / 14);
        for (let i = 0; i < spikeCount; i++) {
          const sx = trap.x + i * 14;
          ctx.beginPath();
          ctx.moveTo(sx, trap.y + trap.height);
          ctx.lineTo(sx + 7, trap.y);
          ctx.lineTo(sx + 14, trap.y + trap.height);
          ctx.closePath();
          ctx.fill();

          // Gleaming blue spike tip
          ctx.fillStyle = '#60a5fa';
          ctx.fillRect(sx + 6, trap.y, 2, 4);
          ctx.fillStyle = '#000000';
        }
      } else if (trap.type === 'swinging_blade') {
        if (trap.pivot) {
          // Chain
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(trap.pivot.x, trap.pivot.y);
          ctx.lineTo(trap.x + trap.width / 2, trap.y + trap.height / 2);
          ctx.stroke();

          // Spiked mace ball
          const bx = trap.x + trap.width / 2;
          const by = trap.y + trap.height / 2;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(bx, by, 18, 0, Math.PI * 2);
          ctx.fill();

          // Protruding spikes
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.moveTo(bx + Math.cos(a) * 16, by + Math.sin(a) * 16);
            ctx.lineTo(bx + Math.cos(a) * 26, by + Math.sin(a) * 26);
            ctx.lineTo(bx + Math.cos(a + 0.3) * 16, by + Math.sin(a + 0.3) * 16);
            ctx.fill();
          }
        }
      } else if (trap.type === 'spiked_wheel') {
        const cx = trap.x + trap.width / 2;
        const cy = trap.y + trap.height / 2;
        const rot = Date.now() * 0.008;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
          ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
          ctx.lineTo(Math.cos(a + 0.25) * 20, Math.sin(a + 0.25) * 20);
          ctx.fill();
        }
        ctx.restore();
      } else if (trap.type === 'urn') {
        // Blue clay urn with blue glow
        const ux = trap.x;
        const uy = trap.y;
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(ux + 16, uy + 20, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.fillRect(ux + 10, uy + 2, 12, 6);
        // Soul flame crack
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ux + 16, uy + 10);
        ctx.lineTo(ux + 14, uy + 24);
        ctx.stroke();
      }
    }
  }

  private renderCollectibles(ctx: CanvasRenderingContext2D) {
    const time = Date.now() * 0.005;

    // Coins and Diamonds
    for (const item of this.levelData.collectibles) {
      if (item.collected) continue;
      const floatY = item.y + Math.sin(time + item.x) * 4;

      if (item.type === 'coin') {
        // Gold coin
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(item.x + 10, floatY + 10, 9, 0, Math.PI * 2);
        ctx.fill();
        // Inner square hole (ancient coin)
        ctx.fillStyle = '#030712';
        ctx.fillRect(item.x + 7, floatY + 7, 6, 6);
      } else if (item.type === 'diamond') {
        // Blue glowing diamond
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(item.x + 10, floatY);
        ctx.lineTo(item.x + 18, floatY + 10);
        ctx.lineTo(item.x + 10, floatY + 20);
        ctx.lineTo(item.x + 2, floatY + 10);
        ctx.closePath();
        ctx.fill();

        // White sheen
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(item.x + 10, floatY + 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3 Secret Ancient Scrolls (Glowing Blue Parchment)
    for (const scroll of this.levelData.scrolls) {
      if (scroll.collected) continue;
      const floatY = scroll.y + Math.sin(time * 1.5 + scroll.id) * 6;

      // Glow aura
      const glow = ctx.createRadialGradient(scroll.x + 14, floatY + 14, 4, scroll.x + 14, floatY + 14, 30);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(scroll.x + 14, floatY + 14, 30, 0, Math.PI * 2);
      ctx.fill();

      // Scroll parchment
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(scroll.x + 4, floatY + 4, 20, 22);

      // Wooden rollers
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(scroll.x + 1, floatY + 2, 26, 4);
      ctx.fillRect(scroll.x + 1, floatY + 24, 26, 4);

      // Ribbon seal
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(scroll.x + 12, floatY + 10, 4, 8);
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.levelData.enemies) {
      if (e.state === 'dead') {
        // Dissolving shadow corpse
        ctx.fillStyle = 'rgba(3, 7, 18, 0.4)';
        ctx.fillRect(e.x, e.y + e.height - 12, e.width, 12);
        continue;
      }

      ctx.save();
      ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
      ctx.scale(e.direction, 1);

      const hw = e.width / 2;
      const hh = e.height / 2;

      // Pitch black silhouette enemy body
      ctx.fillStyle = '#000000';
      ctx.fillRect(-hw, -hh, e.width, e.height);

      // Red/Yellow glowing eyes
      ctx.fillStyle = e.type === 'boss_demon' ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(hw * 0.4, -hh * 0.4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Enemy Weapons
      if (e.type === 'spear_guard') {
        // Spear
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-hw, 5);
        ctx.lineTo(hw + 26, -5);
        ctx.stroke();
        // Spear blade
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(hw + 26, -5);
        ctx.lineTo(hw + 40, -8);
        ctx.lineTo(hw + 28, -2);
        ctx.fill();
      } else if (e.type === 'katana_ronin') {
        // Katana
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(hw + 18, -14);
        ctx.stroke();
      } else if (e.type === 'boss_demon') {
        // Demon horns
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.5, -hh);
        ctx.lineTo(-hw * 0.8, -hh - 18);
        ctx.lineTo(-hw * 0.2, -hh);
        ctx.moveTo(hw * 0.5, -hh);
        ctx.lineTo(hw * 0.8, -hh - 18);
        ctx.lineTo(hw * 0.2, -hh);
        ctx.fill();
      }

      ctx.restore();

      // Boss / Enemy Health bar (shown when damaged)
      if (e.health < e.maxHealth || e.type === 'boss_demon') {
        const barW = Math.max(e.width, 40);
        const barX = e.x + e.width / 2 - barW / 2;
        const barY = e.y - 12;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barW, 4);

        const hpRatio = Math.max(0, e.health / e.maxHealth);
        ctx.fillStyle = e.type === 'boss_demon' ? '#ef4444' : '#38bdf8';
        ctx.fillRect(barX, barY, barW * hpRatio, 4);
      }
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.rotation);

      if (proj.isPlayer) {
        // Blue Ninja Shuriken (4 pointed spinning star)
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(proj.radius, 0);
          ctx.lineTo(proj.radius * 0.35, proj.radius * 0.35);
          ctx.closePath();
          ctx.fill();
        }
        // Center rivet
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Red / Dark dart
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-proj.radius, -2, proj.radius * 2, 4);
      }

      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    // Render Dash Ghosts (Shadow afterimages)
    for (const ghost of p.dashGhosts) {
      ctx.save();
      ctx.translate(ghost.x + p.width / 2, ghost.y + p.height / 2);
      ctx.scale(ghost.direction, 1);
      ctx.fillStyle = `rgba(56, 189, 248, ${ghost.alpha * 0.6})`;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }

    // Invulnerability blinking
    if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    // If Disguised: render wooden barrel or stone lantern
    if (p.isDisguised) {
      ctx.save();
      ctx.translate(p.x, p.y);
      // Wooden Barrel
      ctx.fillStyle = '#78350f';
      ctx.fillRect(2, 14, p.width - 4, p.height - 14);
      // Iron bands
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 20, p.width, 4);
      ctx.fillRect(0, 38, p.width, 4);
      // Cute glowing blue eyes peeking through slot!
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(10, 28, 4, 3);
      ctx.fillRect(18, 28, 4, 3);
      ctx.restore();
      return;
    }

    // Flowing Trailing Scarf (Signature Ninja Arashi Look)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    p.scarfJoints.forEach((j, idx) => {
      if (idx === 0) ctx.moveTo(j.x, j.y);
      else ctx.lineTo(j.x, j.y);
    });
    ctx.stroke();

    // Secondary scarf inner highlight
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    p.scarfJoints.forEach((j, idx) => {
      if (idx === 0) ctx.moveTo(j.x, j.y);
      else ctx.lineTo(j.x, j.y);
    });
    ctx.stroke();

    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    ctx.scale(p.direction, 1);

    const hw = p.width / 2;
    const hh = p.height / 2;

    // PITCH BLACK SILHOUETTE NINJA BODY
    ctx.fillStyle = '#000000';

    if (p.state === 'run') {
      const runCycle = Math.sin(Date.now() * 0.02) * 6;
      // Ninja running posture (leaning forward)
      ctx.beginPath();
      // Head
      ctx.arc(3, -hh + 12, 10, 0, Math.PI * 2);
      // Torso
      ctx.rect(-hw + 6, -hh + 20, 18, 20);
      // Legs
      ctx.rect(-hw + 4, 4, 10, 18 + runCycle);
      ctx.rect(hw - 12, 4, 10, 18 - runCycle);
      ctx.fill();
    } else if (p.state === 'double_jump') {
      // Acrobatic somersault ball
      const spin = Date.now() * 0.02;
      ctx.rotate(spin);
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      // Glowing blue somersault ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (p.state === 'wall_slide') {
      // Clinging to wall
      ctx.beginPath();
      ctx.arc(hw - 8, -hh + 12, 10, 0, Math.PI * 2);
      ctx.rect(-hw + 8, -hh + 20, 18, 22);
      ctx.rect(hw - 6, -2, 6, 26);
      ctx.fill();
    } else {
      // Idle / Default
      const breathe = Math.sin(Date.now() * 0.005) * 1.5;
      ctx.beginPath();
      // Head
      ctx.arc(2, -hh + 12, 10, 0, Math.PI * 2);
      // Torso
      ctx.rect(-hw + 4, -hh + 20 + breathe, 20, 22);
      // Legs
      ctx.rect(-hw + 4, 8, 8, 18);
      ctx.rect(hw - 12, 8, 8, 18);
      ctx.fill();
    }

    // Glowing Blue Headband on forehead
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-2, -hh + 8, 14, 4);

    // Menacing Sapphire / Electric Blue Eyes
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(6, -hh + 10, 2, 0, Math.PI * 2);
    ctx.fill();

    // Katana on back
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-hw + 2, 10);
    ctx.lineTo(hw + 4, -hh);
    ctx.stroke();

    ctx.restore();
  }

  private renderParticlesAndSlashes(ctx: CanvasRenderingContext2D) {
    // Slash Arc Effects (Katana Swing)
    for (const slash of this.player.slashEffects) {
      const progress = slash.life / slash.maxLife;
      ctx.save();
      ctx.translate(slash.x, slash.y);

      // Glowing blue crescent arc
      const arcGrad = ctx.createRadialGradient(0, 0, slash.radius * 0.4, 0, 0, slash.radius);
      arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      arcGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.8)');
      arcGrad.addColorStop(1, 'rgba(30, 58, 138, 0)');

      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = 14 * progress;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, slash.radius, slash.angle - 0.9, slash.angle + 0.9);
      ctx.stroke();

      ctx.restore();
    }

    // Particles (sparks, dust, shadow bursts)
    for (const part of this.particles) {
      ctx.save();
      ctx.globalAlpha = part.alpha;
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Ambient wind leaves / petals in foreground
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    for (const leaf of this.ambientLeaves) {
      ctx.beginPath();
      ctx.ellipse(leaf.x, leaf.y, leaf.size, leaf.size * 0.4, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Cinema letterbox / vignette gradient for deep mood
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.4, w / 2, h / 2, w * 0.75);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(2, 6, 23, 0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }
}
