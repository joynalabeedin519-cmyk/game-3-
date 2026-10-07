import { PlayerStats, LevelProgress } from './types';
import { STAGES } from './stages';

const STORAGE_KEY_STATS = 'ninja_arashi_blue_stats_v1';
const STORAGE_KEY_LEVELS = 'ninja_arashi_blue_levels_v1';
const STORAGE_KEY_ARTIFACTS = 'ninja_arashi_blue_artifacts_v1';
const STORAGE_KEY_LANG = 'ninja_arashi_blue_lang_v1';

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  coins: 450,
  diamonds: 15,
  maxHealth: 3,
  health: 3,
  katanaLevel: 1,
  shurikenLevel: 1,
  dashLevel: 1,
  disguiseLevel: 1,
  vitalityLevel: 1,
};

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PLAYER_STATS, ...parsed };
    }
  } catch {
    // Ignore storage errors
  }
  return { ...DEFAULT_PLAYER_STATS };
}

export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

export function loadLevelProgress(): Record<string, LevelProgress> {
  const defaultProgress: Record<string, LevelProgress> = {};

  // Initialize all 10 stages x 20 levels = 200 levels
  STAGES.forEach((stage) => {
    for (let l = 1; l <= stage.totalLevels; l++) {
      const key = `${stage.id}_${l}`;
      defaultProgress[key] = {
        stageId: stage.id,
        levelId: l,
        unlocked: stage.id === 1 && l === 1, // Only Stage 1 Level 1 is unlocked initially
        completed: false,
        scrolls: 0,
        highScore: 0,
        bestTime: 0,
      };
    }
  });

  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEVELS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultProgress, ...parsed };
    }
  } catch {
    // fallback
  }

  return defaultProgress;
}

export function saveLevelProgress(progress: Record<string, LevelProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEY_LEVELS, JSON.stringify(progress));
  } catch {
    // Ignore
  }
}

export function unlockNextLevel(
  currentStage: number,
  currentLevel: number,
  scrolls: number,
  score: number,
  timeTaken: number
): Record<string, LevelProgress> {
  const progress = loadLevelProgress();
  const currentKey = `${currentStage}_${currentLevel}`;

  if (progress[currentKey]) {
    progress[currentKey].completed = true;
    progress[currentKey].scrolls = Math.max(progress[currentKey].scrolls, scrolls);
    progress[currentKey].highScore = Math.max(progress[currentKey].highScore, score);
    if (progress[currentKey].bestTime === 0 || timeTaken < progress[currentKey].bestTime) {
      progress[currentKey].bestTime = timeTaken;
    }
  }

  // Next level in same stage
  if (currentLevel < 20) {
    const nextKey = `${currentStage}_${currentLevel + 1}`;
    if (progress[nextKey]) {
      progress[nextKey].unlocked = true;
    }
  } else if (currentStage < 10) {
    // Finished level 20 of a stage -> unlock Stage (N+1) Level 1!
    const nextStageKey = `${currentStage + 1}_1`;
    if (progress[nextStageKey]) {
      progress[nextStageKey].unlocked = true;
    }
  }

  saveLevelProgress(progress);
  return progress;
}

export function unlockAllLevelsForTesting(): Record<string, LevelProgress> {
  const progress = loadLevelProgress();
  Object.keys(progress).forEach((key) => {
    progress[key].unlocked = true;
  });
  saveLevelProgress(progress);
  return progress;
}

export function resetGameProgress(): {
  stats: PlayerStats;
  progress: Record<string, LevelProgress>;
} {
  localStorage.removeItem(STORAGE_KEY_STATS);
  localStorage.removeItem(STORAGE_KEY_LEVELS);
  localStorage.removeItem(STORAGE_KEY_ARTIFACTS);
  const stats = { ...DEFAULT_PLAYER_STATS };
  const progress = loadLevelProgress();
  return { stats, progress };
}

export function loadLanguage(): 'bn' | 'en' {
  try {
    const lang = localStorage.getItem(STORAGE_KEY_LANG);
    if (lang === 'en' || lang === 'bn') return lang;
  } catch {
    // default
  }
  return 'bn'; // Default to Bengali as requested by user
}

export function saveLanguage(lang: 'bn' | 'en'): void {
  try {
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  } catch {
    // Ignore
  }
}
