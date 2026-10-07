export interface PlayerStats {
  coins: number;
  diamonds: number;
  maxHealth: number;
  health: number;
  katanaLevel: number;    // 1-5
  shurikenLevel: number;  // 1-5
  dashLevel: number;      // 1-5
  disguiseLevel: number;  // 1-5
  vitalityLevel: number;  // 1-5
}

export interface LevelProgress {
  stageId: number;      // 1-10
  levelId: number;      // 1-20
  unlocked: boolean;
  completed: boolean;
  scrolls: number;      // 0-3
  highScore: number;
  bestTime: number;     // seconds
}

export interface StageInfo {
  id: number;
  nameEn: string;
  nameBn: string;
  theme: string;
  descriptionEn: string;
  descriptionBn: string;
  skyColorTop: string;
  skyColorBottom: string;
  mistColor: string;
  glowColor: string;
  totalLevels: number;
  bossName: string;
}

export interface Artifact {
  id: string;
  nameEn: string;
  nameBn: string;
  descEn: string;
  descBn: string;
  icon: string;
  unlocked: boolean;
  stageReq: number;
}

export type GameView =
  | 'HOME'
  | 'LEVEL_SELECT'
  | 'DOJO'
  | 'ARTIFACTS'
  | 'PLAYING'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAME_OVER';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Platform extends Rect {
  type: 'ground' | 'floating' | 'bridge' | 'wall' | 'breakable';
  texture?: string;
  health?: number;
}

export interface Trap extends Rect {
  id: string;
  type: 'spikes' | 'spiked_wheel' | 'swinging_blade' | 'falling_spikes' | 'urn';
  active: boolean;
  angle?: number;
  pivot?: Point;
  speed?: number;
  radius?: number;
  fallSpeed?: number;
  hasFallen?: boolean;
}

export interface Checkpoint extends Rect {
  id: string;
  activated: boolean;
}

export interface SecretScroll extends Rect {
  id: number;
  collected: boolean;
}

export interface CollectibleItem extends Rect {
  id: string;
  type: 'coin' | 'diamond' | 'heart';
  value: number;
  collected: boolean;
  floatOffset?: number;
}

export type EnemyType = 'spear_guard' | 'katana_ronin' | 'shuriken_ninja' | 'boss_demon';

export interface Enemy extends Rect {
  id: string;
  type: EnemyType;
  health: number;
  maxHealth: number;
  vx: number;
  vy: number;
  direction: 1 | -1;
  patrolMinX: number;
  patrolMaxX: number;
  state: 'patrol' | 'alert' | 'attack' | 'dead';
  attackCooldown: number;
  sightRange: number;
  deadTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isPlayer: boolean;
  damage: number;
  stuck: boolean;
  stuckTimer?: number;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'leaf' | 'spark' | 'slash';
}

export interface SlashEffect {
  x: number;
  y: number;
  radius: number;
  angle: number;
  life: number;
  maxLife: number;
}
