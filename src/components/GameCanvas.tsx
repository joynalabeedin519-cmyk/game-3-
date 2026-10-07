import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayerStats, LevelProgress } from '../game/types';
import { generateLevel, LevelData } from '../game/levelGenerator';
import { NinjaPlayer } from '../game/player';
import { GameEngine } from '../game/engine';
import { GameHUD } from './GameHUD';
import { VictoryModal } from './VictoryModal';
import { GameOverModal } from './GameOverModal';
import { PauseModal } from './PauseModal';
import { soundEngine } from '../game/audio';

interface GameCanvasProps {
  stageId: number;
  levelId: number;
  stats: PlayerStats;
  lang: 'bn' | 'en';
  onUpdateStats: (stats: PlayerStats) => void;
  onLevelCompleteSave: (
    stageId: number,
    levelId: number,
    scrolls: number,
    coins: number,
    diamonds: number,
    time: number
  ) => void;
  onNextLevel: (nextStageId: number, nextLevelId: number) => void;
  onExitToStages: () => void;
  onExitToHome: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stageId,
  levelId,
  stats,
  lang,
  onUpdateStats,
  onLevelCompleteSave,
  onNextLevel,
  onExitToStages,
  onExitToHome,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const playerRef = useRef<NinjaPlayer | null>(null);

  // Modal states
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  // Dynamic In-Game HUD metrics
  const [coinsThisRun, setCoinsThisRun] = useState(0);
  const [diamondsThisRun, setDiamondsThisRun] = useState(0);
  const [scrollsFound, setScrollsFound] = useState(0);
  const [victoryData, setVictoryData] = useState<{
    scrolls: number;
    coins: number;
    diamonds: number;
    time: number;
  } | null>(null);

  // Level data memoization
  const [levelData, setLevelData] = useState<LevelData>(() =>
    generateLevel(stageId, levelId)
  );

  // Initialize and run the game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const data = generateLevel(stageId, levelId);
    setLevelData(data);

    const player = new NinjaPlayer(data.spawnPoint.x, data.spawnPoint.y, {
      ...stats,
      health: stats.maxHealth,
    });
    playerRef.current = player;

    const engine = new GameEngine(canvas, data, player, {
      onScoreUpdate: (coins, diamonds) => {
        setCoinsThisRun(coins);
        setDiamondsThisRun(diamonds);
      },
      onHealthUpdate: (health, maxHealth) => {
        onUpdateStats({ ...stats, health, maxHealth });
      },
      onScrollsUpdate: (collected) => {
        setScrollsFound(collected);
      },
      onLevelComplete: (scrolls, coinsEarned, diamondsEarned, timeSeconds) => {
        setIsVictory(true);
        setVictoryData({
          scrolls,
          coins: coinsEarned,
          diamonds: diamondsEarned,
          time: timeSeconds,
        });

        // Save progress & award currency
        onLevelCompleteSave(
          stageId,
          levelId,
          scrolls,
          coinsEarned,
          diamondsEarned,
          timeSeconds
        );
      },
      onGameOver: () => {
        setIsGameOver(true);
      },
    });

    engineRef.current = engine;
    engine.start();

    // Start subtle ambient music if not muted
    soundEngine.startAmbientMusic();

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
    };
  }, [stageId, levelId]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng || eng.isPaused || isVictory || isGameOver) {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          handleTogglePause();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          eng.inputLeft = true;
          break;
        case 'arrowright':
        case 'd':
          eng.inputRight = true;
          break;
        case 'arrowup':
        case 'w':
        case ' ':
          e.preventDefault();
          eng.triggerJump();
          break;
        case 'j':
        case 'z':
          eng.triggerAttack();
          break;
        case 'k':
        case 'x':
          eng.triggerShuriken();
          break;
        case 'l':
        case 'c':
          eng.triggerDash();
          break;
        case 'arrowdown':
        case 's':
        case 'shift':
          eng.triggerDisguise();
          break;
        case 'escape':
        case 'p':
          handleTogglePause();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          eng.inputLeft = false;
          break;
        case 'arrowright':
        case 'd':
          eng.inputRight = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isVictory, isGameOver]);

  const handleTogglePause = useCallback(() => {
    if (isVictory || isGameOver) return;
    setIsPaused((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.setPaused(next);
      }
      return next;
    });
  }, [isVictory, isGameOver]);

  const handleResume = () => {
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.setPaused(false);
    }
  };

  const handleRespawnCheckpoint = () => {
    setIsGameOver(false);
    if (engineRef.current) {
      engineRef.current.respawnAtCheckpoint();
    }
  };

  const handleRestartLevel = () => {
    setIsGameOver(false);
    setIsPaused(false);
    setIsVictory(false);
    setCoinsThisRun(0);
    setDiamondsThisRun(0);
    setScrollsFound(0);

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (engineRef.current) {
      engineRef.current.stop();
    }

    const data = generateLevel(stageId, levelId);
    setLevelData(data);

    const player = new NinjaPlayer(data.spawnPoint.x, data.spawnPoint.y, {
      ...stats,
      health: stats.maxHealth,
    });
    playerRef.current = player;

    const engine = new GameEngine(canvas, data, player, {
      onScoreUpdate: (coins, diamonds) => {
        setCoinsThisRun(coins);
        setDiamondsThisRun(diamonds);
      },
      onHealthUpdate: (health, maxHealth) => {
        onUpdateStats({ ...stats, health, maxHealth });
      },
      onScrollsUpdate: (collected) => {
        setScrollsFound(collected);
      },
      onLevelComplete: (scrolls, coinsEarned, diamondsEarned, timeSeconds) => {
        setIsVictory(true);
        setVictoryData({
          scrolls,
          coins: coinsEarned,
          diamonds: diamondsEarned,
          time: timeSeconds,
        });
        onLevelCompleteSave(
          stageId,
          levelId,
          scrolls,
          coinsEarned,
          diamondsEarned,
          timeSeconds
        );
      },
      onGameOver: () => {
        setIsGameOver(true);
      },
    });

    engineRef.current = engine;
    engine.start();
  };

  const handleNextLevel = () => {
    let nextStage = stageId;
    let nextLvl = levelId + 1;
    if (nextLvl > 20) {
      nextStage = Math.min(10, stageId + 1);
      nextLvl = 1;
    }
    onNextLevel(nextStage, nextLvl);
  };

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden select-none">
      {/* 60fps Game Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Heads-up display with touch buttons */}
      {playerRef.current && (
        <GameHUD
          player={playerRef.current}
          stats={stats}
          stageId={stageId}
          levelId={levelId}
          stageName={lang === 'bn' ? levelData.stageMeta.nameBn : levelData.stageMeta.nameEn}
          scrollsFound={scrollsFound}
          coinsEarned={coinsThisRun}
          diamondsEarned={diamondsThisRun}
          lang={lang}
          onPause={handleTogglePause}
          onLeftDown={() => {
            if (engineRef.current) engineRef.current.inputLeft = true;
          }}
          onLeftUp={() => {
            if (engineRef.current) engineRef.current.inputLeft = false;
          }}
          onRightDown={() => {
            if (engineRef.current) engineRef.current.inputRight = true;
          }}
          onRightUp={() => {
            if (engineRef.current) engineRef.current.inputRight = false;
          }}
          onJump={() => engineRef.current?.triggerJump()}
          onSlash={() => engineRef.current?.triggerAttack()}
          onShuriken={() => engineRef.current?.triggerShuriken()}
          onDash={() => engineRef.current?.triggerDash()}
          onDisguise={() => engineRef.current?.triggerDisguise()}
        />
      )}

      {/* Pause Modal */}
      {isPaused && (
        <PauseModal
          lang={lang}
          onResume={handleResume}
          onRestart={handleRestartLevel}
          onLevelSelect={onExitToStages}
          onHome={onExitToHome}
        />
      )}

      {/* Victory Modal */}
      {isVictory && victoryData && (
        <VictoryModal
          stageId={stageId}
          levelId={levelId}
          scrolls={victoryData.scrolls}
          coinsEarned={victoryData.coins}
          diamondsEarned={victoryData.diamonds}
          timeSeconds={victoryData.time}
          lang={lang}
          onNextLevel={handleNextLevel}
          onReplay={handleRestartLevel}
          onLevelSelect={onExitToStages}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          lang={lang}
          onRespawnCheckpoint={handleRespawnCheckpoint}
          onRestartLevel={handleRestartLevel}
          onHome={onExitToHome}
        />
      )}
    </div>
  );
};
