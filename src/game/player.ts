import { PlayerStats, Rect, SlashEffect } from './types';
import { soundEngine } from './audio';

export interface ScarfJoint {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export class NinjaPlayer {
  public x: number;
  public y: number;
  public width: number = 32;
  public height: number = 52;
  public vx: number = 0;
  public vy: number = 0;
  public direction: 1 | -1 = 1;

  public isGrounded: boolean = false;
  public isWallSliding: boolean = false;
  public wallSide: 1 | -1 = 1; // 1 if wall on right, -1 if wall on left
  public jumpsLeft: number = 2;

  // States
  public state:
    | 'idle'
    | 'run'
    | 'jump'
    | 'double_jump'
    | 'wall_slide'
    | 'attack'
    | 'dash'
    | 'disguise'
    | 'hurt'
    | 'dead' = 'idle';

  // Combat & Skill Cooldowns
  public isAttacking: boolean = false;
  public attackTimer: number = 0;
  public attackCooldown: number = 0;

  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashCooldown: number = 0;
  public maxDashCooldown: number = 180; // frames ~ 3s

  public isDisguised: boolean = false;
  public disguiseTimer: number = 0;
  public disguiseCooldown: number = 0;
  public maxDisguiseCooldown: number = 300; // frames ~ 5s

  public shurikensRemaining: number = 5;
  public shurikenCooldown: number = 0;
  public shurikenRegenTimer: number = 0;

  // Invincibility after taking damage
  public invulnerableTimer: number = 0;

  // Scarf physics joints (6 segments)
  public scarfJoints: ScarfJoint[] = [];

  // Active Slash Arc Effects
  public slashEffects: SlashEffect[] = [];

  // Dash ghost afterimages
  public dashGhosts: { x: number; y: number; alpha: number; direction: 1 | -1 }[] = [];

  public stats: PlayerStats;

  constructor(startX: number, startY: number, stats: PlayerStats) {
    this.x = startX;
    this.y = startY;
    this.stats = stats;
    this.shurikensRemaining = 3 + stats.shurikenLevel;

    // Initialize 7 scarf segments
    for (let i = 0; i < 7; i++) {
      this.scarfJoints.push({
        x: startX - i * 4,
        y: startY + 14,
        prevX: startX - i * 4,
        prevY: startY + 14,
      });
    }
  }

  public resetPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isDashing = false;
    this.isDisguised = false;
    this.isAttacking = false;
    this.invulnerableTimer = 60;
    this.state = 'idle';

    this.scarfJoints.forEach((j, i) => {
      j.x = x - i * 4;
      j.y = y + 14;
      j.prevX = j.x;
      j.prevY = j.y;
    });
  }

  public jump(): boolean {
    if (this.isDisguised) {
      this.endDisguise();
    }

    if (this.isWallSliding) {
      // Wall Kick jump!
      this.direction = (this.wallSide * -1) as 1 | -1;
      this.vx = this.direction * 6.8;
      this.vy = -12.2;
      this.isWallSliding = false;
      this.jumpsLeft = 1;
      this.state = 'jump';
      soundEngine.playJump();
      return true;
    }

    if (this.isGrounded) {
      this.vy = -12.5;
      this.isGrounded = false;
      this.jumpsLeft = 1;
      this.state = 'jump';
      soundEngine.playJump();
      return true;
    } else if (this.jumpsLeft > 0) {
      // Acrobatic double jump somersault
      this.vy = -11.5;
      this.jumpsLeft--;
      this.state = 'double_jump';
      soundEngine.playDoubleJump();
      return true;
    }
    return false;
  }

  public attack(): boolean {
    if (this.attackCooldown > 0 || this.isDashing) return false;
    if (this.isDisguised) this.endDisguise();

    this.isAttacking = true;
    this.attackTimer = 14; // attack lasts 14 frames
    this.attackCooldown = Math.max(14, 24 - this.stats.katanaLevel * 2);
    soundEngine.playKatanaSlash();

    // Register slash crescent arc
    const slashRadius = 45 + this.stats.katanaLevel * 6;
    this.slashEffects.push({
      x: this.x + (this.direction === 1 ? this.width + 10 : -10),
      y: this.y + this.height * 0.45,
      radius: slashRadius,
      angle: this.direction === 1 ? 0 : Math.PI,
      life: 14,
      maxLife: 14,
    });

    return true;
  }

  public dash(): boolean {
    if (this.dashCooldown > 0 || this.isDashing) return false;
    if (this.isDisguised) this.endDisguise();

    this.isDashing = true;
    this.dashTimer = 16;
    const cooldownReduction = this.stats.dashLevel * 20;
    this.dashCooldown = Math.max(80, 180 - cooldownReduction);
    this.invulnerableTimer = 18; // invincible during shadow dash
    soundEngine.playShadowDash();

    return true;
  }

  public disguise(): boolean {
    if (this.disguiseCooldown > 0) return false;

    this.isDisguised = true;
    const durationBonus = this.stats.disguiseLevel * 30;
    this.disguiseTimer = 220 + durationBonus; // ~4-5 seconds
    this.disguiseCooldown = Math.max(160, 320 - this.stats.disguiseLevel * 25);
    this.vx = 0;
    soundEngine.playDisguise();

    return true;
  }

  public endDisguise() {
    this.isDisguised = false;
    this.disguiseTimer = 0;
  }

  public throwShuriken(): boolean {
    if (this.shurikensRemaining <= 0 || this.shurikenCooldown > 0 || this.isDashing) {
      return false;
    }
    if (this.isDisguised) this.endDisguise();

    this.shurikensRemaining--;
    this.shurikenCooldown = Math.max(12, 22 - this.stats.shurikenLevel * 2);
    soundEngine.playShurikenThrow();
    return true;
  }

  public takeDamage(amount: number = 1): boolean {
    if (this.invulnerableTimer > 0 || this.isDashing) return false;

    this.stats.health -= amount;
    this.invulnerableTimer = 60; // 1 second invulnerability
    this.isDisguised = false;
    soundEngine.playPlayerHit();

    // Knockback
    this.vy = -6;
    this.vx = -this.direction * 4;

    if (this.stats.health <= 0) {
      this.state = 'dead';
      soundEngine.playDeathGong();
    }
    return true;
  }

  public update(inputLeft: boolean, inputRight: boolean) {
    // Cooldown tickers
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.disguiseCooldown > 0) this.disguiseCooldown--;
    if (this.shurikenCooldown > 0) this.shurikenCooldown--;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    // Shuriken regeneration over time
    const maxShurikens = 3 + this.stats.shurikenLevel;
    if (this.shurikensRemaining < maxShurikens) {
      this.shurikenRegenTimer++;
      if (this.shurikenRegenTimer >= 180) { // every 3s
        this.shurikensRemaining++;
        this.shurikenRegenTimer = 0;
      }
    }

    // Disguise timer
    if (this.isDisguised) {
      this.disguiseTimer--;
      if (this.disguiseTimer <= 0) {
        this.isDisguised = false;
      }
      this.vx = 0;
      this.state = 'disguise';
      return;
    }

    // Shadow Dash Handling
    if (this.isDashing) {
      this.dashTimer--;
      const dashSpeed = 16 + this.stats.dashLevel * 1.5;
      this.vx = this.direction * dashSpeed;
      this.vy = 0;

      // Spawn shadow afterimages
      if (this.dashTimer % 3 === 0) {
        this.dashGhosts.push({
          x: this.x,
          y: this.y,
          alpha: 0.65,
          direction: this.direction,
        });
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = this.direction * 3;
      }
    } else {
      // Normal Horizontal Movement
      const moveSpeed = 5.2;
      const accel = 0.8;
      const friction = 0.78;

      if (inputLeft && !inputRight) {
        this.direction = -1;
        this.vx = Math.max(-moveSpeed, this.vx - accel);
      } else if (inputRight && !inputLeft) {
        this.direction = 1;
        this.vx = Math.min(moveSpeed, this.vx + accel);
      } else {
        this.vx *= friction;
        if (Math.abs(this.vx) < 0.2) this.vx = 0;
      }

      // Attack timer
      if (this.isAttacking) {
        this.attackTimer--;
        if (this.attackTimer <= 0) {
          this.isAttacking = false;
        }
      }

      // Gravity & Vertical physics
      const gravity = 0.58;
      if (this.isWallSliding) {
        // Wall friction limits fall speed
        this.vy = Math.min(this.vy + 0.15, 2.2);
      } else {
        this.vy = Math.min(this.vy + gravity, 16);
      }
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Update state
    if (this.isAttacking) {
      this.state = 'attack';
    } else if (this.isDashing) {
      this.state = 'dash';
    } else if (this.isWallSliding) {
      this.state = 'wall_slide';
    } else if (!this.isGrounded) {
      this.state = this.jumpsLeft === 0 ? 'double_jump' : 'jump';
    } else if (Math.abs(this.vx) > 0.4) {
      this.state = 'run';
    } else {
      this.state = 'idle';
    }

    // Update slash effects
    for (let i = this.slashEffects.length - 1; i >= 0; i--) {
      const s = this.slashEffects[i];
      s.life--;
      s.x = this.x + (this.direction === 1 ? this.width + 10 : -10);
      s.y = this.y + this.height * 0.45;
      if (s.life <= 0) {
        this.slashEffects.splice(i, 1);
      }
    }

    // Update dash afterimages
    for (let i = this.dashGhosts.length - 1; i >= 0; i--) {
      const g = this.dashGhosts[i];
      g.alpha -= 0.05;
      if (g.alpha <= 0) {
        this.dashGhosts.splice(i, 1);
      }
    }

    // Update flowing scarf physics (Verlet integration)
    this.updateScarf();
  }

  private updateScarf() {
    const headX = this.x + (this.direction === 1 ? 6 : this.width - 6);
    const headY = this.y + 14;

    if (this.scarfJoints.length === 0) return;

    // Anchor first joint to ninja collar/headband
    this.scarfJoints[0].x = headX;
    this.scarfJoints[0].y = headY;

    const segmentDist = 6;
    const wind = Math.sin(Date.now() * 0.006) * 0.8;

    for (let i = 1; i < this.scarfJoints.length; i++) {
      const joint = this.scarfJoints[i];
      const prevX = joint.x;
      const prevY = joint.y;

      // Verlet inertia + gravity + wind opposite to movement
      const inertX = joint.x - joint.prevX;
      const inertY = joint.y - joint.prevY;

      joint.prevX = prevX;
      joint.prevY = prevY;

      joint.x += inertX * 0.85 - this.direction * 0.7 + wind * 0.3;
      joint.y += inertY * 0.85 + 0.35; // gentle gravity

      // Distance constraint to parent joint
      const parent = this.scarfJoints[i - 1];
      const dx = joint.x - parent.x;
      const dy = joint.y - parent.y;
      const dist = Math.hypot(dx, dy) || 1;
      const factor = (dist - segmentDist) / dist;

      joint.x -= dx * factor * 0.75;
      joint.y -= dy * factor * 0.75;
    }
  }

  public getRect(): Rect {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  public getAttackHitbox(): Rect | null {
    if (!this.isAttacking) return null;
    const range = 50 + this.stats.katanaLevel * 8;
    return {
      x: this.direction === 1 ? this.x + this.width : this.x - range,
      y: this.y + 4,
      width: range,
      height: this.height - 8,
    };
  }
}
