import {
  Platform,
  Trap,
  Checkpoint,
  SecretScroll,
  CollectibleItem,
  Enemy,
  Point,
} from './types';
import { STAGES } from './stages';

export interface LevelData {
  stageId: number;
  levelId: number;
  worldWidth: number;
  worldHeight: number;
  spawnPoint: Point;
  exitPoint: Point;
  platforms: Platform[];
  traps: Trap[];
  checkpoints: Checkpoint[];
  scrolls: SecretScroll[];
  collectibles: CollectibleItem[];
  enemies: Enemy[];
  stageMeta: (typeof STAGES)[0];
}

// Simple seeded PRNG for consistent 200 levels
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  public next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

export function generateLevel(stageId: number, levelId: number): LevelData {
  const stageMeta = STAGES.find((s) => s.id === stageId) || STAGES[0];
  const rng = new SeededRandom(stageId * 1000 + levelId * 37 + 12345);

  // Big sprawling level width: 4500 to 6500 px
  const baseWidth = 4500 + levelId * 80 + rng.intRange(0, 400);
  const worldWidth = Math.min(baseWidth, 6800);
  const worldHeight = 1100;

  const platforms: Platform[] = [];
  const traps: Trap[] = [];
  const checkpoints: Checkpoint[] = [];
  const scrolls: SecretScroll[] = [];
  const collectibles: CollectibleItem[] = [];
  const enemies: Enemy[] = [];

  const spawnPoint: Point = { x: 140, y: 640 };
  const exitPoint: Point = { x: worldWidth - 220, y: 640 };

  // Starting ground platform
  platforms.push({
    x: 0,
    y: 720,
    width: 600,
    height: 380,
    type: 'ground',
  });

  let currentX = 580;
  let currentY = 720;
  const sectionsCount = 14 + Math.min(levelId, 10);

  // Generate large expansive multi-tiered terrain
  for (let i = 0; i < sectionsCount && currentX < worldWidth - 700; i++) {
    // Gap / Chasm
    const gapWidth = rng.intRange(120, 220);
    const pitX = currentX;
    const pitWidth = gapWidth;

    // Pit spikes at the bottom of chasms
    if (rng.next() > 0.25) {
      traps.push({
        id: `pit_spikes_${i}`,
        x: pitX + 10,
        y: 880,
        width: pitWidth - 20,
        height: 40,
        type: 'spikes',
        active: true,
      });
    }

    currentX += gapWidth;

    // Next ground / floating plateau
    const platWidth = rng.intRange(280, 520);
    const heightDelta = rng.intRange(-80, 80);
    currentY = Math.max(540, Math.min(820, currentY + heightDelta));

    platforms.push({
      x: currentX,
      y: currentY,
      width: platWidth,
      height: worldHeight - currentY,
      type: 'ground',
    });

    // Elevated overhead platforms (upper route / ninja parkour)
    if (rng.next() > 0.35) {
      const highY = currentY - rng.intRange(140, 220);
      const highW = rng.intRange(140, 260);
      const highX = currentX + rng.intRange(20, Math.max(30, platWidth - highW - 20));

      platforms.push({
        x: highX,
        y: highY,
        width: highW,
        height: 22,
        type: 'floating',
      });

      // Wooden bridge or wall
      if (rng.next() > 0.5) {
        platforms.push({
          x: highX + highW + rng.intRange(40, 100),
          y: highY - rng.intRange(-20, 40),
          width: rng.intRange(120, 180),
          height: 18,
          type: 'bridge',
        });
      }

      // Collectibles or scrolls on high perches
      if (rng.next() > 0.4) {
        collectibles.push({
          id: `high_gem_${i}`,
          x: highX + highW / 2,
          y: highY - 40,
          width: 24,
          height: 24,
          type: rng.next() > 0.6 ? 'diamond' : 'coin',
          value: 1,
          collected: false,
        });
      }
    }

    // Traps on this section
    const trapRoll = rng.next();
    if (trapRoll < 0.25) {
      // Spikes on ground
      traps.push({
        id: `spikes_${i}`,
        x: currentX + rng.intRange(40, Math.max(50, platWidth - 100)),
        y: currentY - 20,
        width: 60,
        height: 20,
        type: 'spikes',
        active: true,
      });
    } else if (trapRoll < 0.5) {
      // Swinging blade pendulum
      const pivotX = currentX + platWidth / 2;
      const pivotY = currentY - 240;
      traps.push({
        id: `swinging_blade_${i}`,
        x: pivotX - 25,
        y: pivotY,
        width: 50,
        height: 50,
        type: 'swinging_blade',
        active: true,
        pivot: { x: pivotX, y: pivotY },
        radius: 170,
        angle: rng.range(-Math.PI / 3, Math.PI / 3),
        speed: rng.range(0.035, 0.055),
      });
    } else if (trapRoll < 0.72) {
      // Rolling spiky gear/wheel
      traps.push({
        id: `spiked_wheel_${i}`,
        x: currentX + platWidth - 40,
        y: currentY - 32,
        width: 64,
        height: 64,
        type: 'spiked_wheel',
        active: true,
        speed: rng.range(2.0, 3.2),
        pivot: { x: currentX, y: currentX + platWidth }, // patrol bounds
      });
    } else if (trapRoll < 0.88) {
      // Breakable blue urns / toxic vases
      traps.push({
        id: `urn_${i}`,
        x: currentX + rng.intRange(30, platWidth - 60),
        y: currentY - 36,
        width: 32,
        height: 36,
        type: 'urn',
        active: true,
      });
    }

    // Enemies on this platform
    if (platWidth > 240 && rng.next() > 0.25) {
      const isBoss = levelId === 20 && i === Math.floor(sectionsCount / 2);
      const enemyType = isBoss
        ? 'boss_demon'
        : rng.next() > 0.65
        ? 'katana_ronin'
        : rng.next() > 0.4
        ? 'shuriken_ninja'
        : 'spear_guard';

      const enemyWidth = isBoss ? 52 : 36;
      const enemyHeight = isBoss ? 76 : 56;
      const maxHp = isBoss
        ? 350 + stageId * 50
        : enemyType === 'katana_ronin'
        ? 3
        : enemyType === 'shuriken_ninja'
        ? 2
        : 2;

      enemies.push({
        id: `enemy_${i}`,
        type: enemyType,
        x: currentX + platWidth / 2,
        y: currentY - enemyHeight,
        width: enemyWidth,
        height: enemyHeight,
        health: maxHp,
        maxHealth: maxHp,
        vx: 0,
        vy: 0,
        direction: -1,
        patrolMinX: currentX + 30,
        patrolMaxX: currentX + platWidth - 30,
        state: 'patrol',
        attackCooldown: rng.intRange(30, 90),
        sightRange: isBoss ? 450 : 280,
      });
    }

    // Coins scattered
    const coinCount = rng.intRange(2, 5);
    for (let c = 0; c < coinCount; c++) {
      collectibles.push({
        id: `coin_${i}_${c}`,
        x: currentX + (platWidth / (coinCount + 1)) * (c + 1),
        y: currentY - 45 - Math.sin((c / coinCount) * Math.PI) * 35,
        width: 20,
        height: 20,
        type: rng.next() > 0.85 ? 'diamond' : 'coin',
        value: 1,
        collected: false,
      });
    }

    currentX += platWidth;
  }

  // Final exit platform
  platforms.push({
    x: currentX,
    y: 720,
    width: worldWidth - currentX + 300,
    height: 380,
    type: 'ground',
  });

  // End boss if level 20 and not spawned yet
  if (levelId === 20 && !enemies.some((e) => e.type === 'boss_demon')) {
    enemies.push({
      id: `boss_level_${stageId}_${levelId}`,
      type: 'boss_demon',
      x: worldWidth - 600,
      y: 720 - 76,
      width: 56,
      height: 76,
      health: 400 + stageId * 60,
      maxHealth: 400 + stageId * 60,
      vx: 0,
      vy: 0,
      direction: -1,
      patrolMinX: worldWidth - 850,
      patrolMaxX: worldWidth - 350,
      state: 'patrol',
      attackCooldown: 40,
      sightRange: 500,
    });
  }

  // 2 Checkpoint Torii shrines along the expansive path
  checkpoints.push({
    id: 'cp_1',
    x: Math.floor(worldWidth * 0.35),
    y: 0, // calculated below to sit on platform
    width: 50,
    height: 70,
    activated: false,
  });
  checkpoints.push({
    id: 'cp_2',
    x: Math.floor(worldWidth * 0.7),
    y: 0,
    width: 50,
    height: 70,
    activated: false,
  });

  // Align checkpoints to top of underlying platform
  checkpoints.forEach((cp) => {
    const underPlat = platforms.find(
      (p) => cp.x >= p.x && cp.x + cp.width <= p.x + p.width && p.type === 'ground'
    );
    if (underPlat) {
      cp.y = underPlat.y - cp.height;
    } else {
      cp.y = 650;
    }
  });

  // 3 Secret Ancient Scrolls (Signature Ninja Arashi 2 3-star mechanic)
  const scrollPositionsX = [
    Math.floor(worldWidth * 0.22),
    Math.floor(worldWidth * 0.52),
    Math.floor(worldWidth * 0.82),
  ];

  scrollPositionsX.forEach((sx, idx) => {
    // Find nearby platform to float above or on high ledge
    const nearbyPlat = platforms.find(
      (p) => sx >= p.x - 50 && sx <= p.x + p.width + 50
    );
    const scrollY = nearbyPlat ? nearbyPlat.y - 75 : 550;

    scrolls.push({
      id: idx + 1,
      x: sx,
      y: scrollY,
      width: 28,
      height: 28,
      collected: false,
    });
  });

  return {
    stageId,
    levelId,
    worldWidth,
    worldHeight,
    spawnPoint,
    exitPoint,
    platforms,
    traps,
    checkpoints,
    scrolls,
    collectibles,
    enemies,
    stageMeta,
  };
}
