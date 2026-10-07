import { useState, useEffect } from 'react';
import { GameView, PlayerStats, LevelProgress } from './game/types';
import {
  loadPlayerStats,
  savePlayerStats,
  loadLevelProgress,
  unlockNextLevel,
  unlockAllLevelsForTesting,
  loadLanguage,
  saveLanguage,
} from './game/storage';
import { MainMenu } from './components/MainMenu';
import { StageLevelSelect } from './components/StageLevelSelect';
import { UpgradeDojo } from './components/UpgradeDojo';
import { ArtifactsModal } from './components/ArtifactsModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { GameCanvas } from './components/GameCanvas';

export default function App() {
  const [currentView, setCurrentView] = useState<GameView | 'CONTROLS'>('HOME');
  const [stats, setStats] = useState<PlayerStats>(loadPlayerStats);
  const [levelProgress, setLevelProgress] = useState<Record<string, LevelProgress>>(loadLevelProgress);
  const [currentStageId, setCurrentStageId] = useState<number>(1);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [lang, setLang] = useState<'bn' | 'en'>(loadLanguage);

  // Sync stats to local storage
  const handleUpdateStats = (newStats: PlayerStats) => {
    setStats(newStats);
    savePlayerStats(newStats);
  };

  const handleToggleLang = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    saveLanguage(nextLang);
  };

  // Launch campaign from home (plays highest unlocked or current)
  const handleStartCampaign = () => {
    // Find first unfinished level in current stage or Stage 1 Level 1
    let foundStage = 1;
    let foundLevel = 1;

    for (let s = 1; s <= 10; s++) {
      for (let l = 1; l <= 20; l++) {
        const key = `${s}_${l}`;
        const p = levelProgress[key];
        if (p && p.unlocked && !p.completed) {
          foundStage = s;
          foundLevel = l;
          break;
        }
      }
    }

    setCurrentStageId(foundStage);
    setCurrentLevelId(foundLevel);
    setCurrentView('PLAYING');
  };

  const handleSelectLevel = (stageId: number, levelId: number) => {
    setCurrentStageId(stageId);
    setCurrentLevelId(levelId);
    setCurrentView('PLAYING');
  };

  const handleLevelCompleteSave = (
    stageId: number,
    levelId: number,
    scrolls: number,
    coins: number,
    diamonds: number,
    time: number
  ) => {
    // Award currency
    const newStats: PlayerStats = {
      ...stats,
      coins: stats.coins + coins,
      diamonds: stats.diamonds + diamonds,
    };
    handleUpdateStats(newStats);

    // Unlock next level in progression
    const updatedProgress = unlockNextLevel(
      stageId,
      levelId,
      scrolls,
      coins * 10 + diamonds * 50,
      time
    );
    setLevelProgress({ ...updatedProgress });
  };

  const handleNextLevel = (nextStageId: number, nextLevelId: number) => {
    setCurrentStageId(nextStageId);
    setCurrentLevelId(nextLevelId);
    setCurrentView('PLAYING');
  };

  const handleUnlockAll = () => {
    const updated = unlockAllLevelsForTesting();
    setLevelProgress({ ...updated });
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617] text-slate-100 font-sans">
      {/* 1. HOME SCREEN */}
      {currentView === 'HOME' && (
        <MainMenu
          stats={stats}
          lang={lang}
          onToggleLang={handleToggleLang}
          onPlay={handleStartCampaign}
          onOpenStages={() => setCurrentView('LEVEL_SELECT')}
          onOpenDojo={() => setCurrentView('DOJO')}
          onOpenArtifacts={() => setCurrentView('ARTIFACTS')}
          onOpenControls={() => setCurrentView('CONTROLS')}
        />
      )}

      {/* 2. STAGES & 200 LEVELS SELECTOR */}
      {currentView === 'LEVEL_SELECT' && (
        <StageLevelSelect
          levelProgress={levelProgress}
          currentStageId={currentStageId}
          lang={lang}
          onSelectLevel={handleSelectLevel}
          onBack={() => setCurrentView('HOME')}
          onUnlockAll={handleUnlockAll}
        />
      )}

      {/* 3. DOJO & SKILL TREE */}
      {currentView === 'DOJO' && (
        <UpgradeDojo
          stats={stats}
          lang={lang}
          onUpdateStats={handleUpdateStats}
          onBack={() => setCurrentView('HOME')}
        />
      )}

      {/* 4. ARTIFACTS & SCROLLS */}
      {currentView === 'ARTIFACTS' && (
        <ArtifactsModal lang={lang} onBack={() => setCurrentView('HOME')} />
      )}

      {/* 5. CONTROLS GUIDE */}
      {currentView === 'CONTROLS' && (
        <ControlsGuideModal lang={lang} onBack={() => setCurrentView('HOME')} />
      )}

      {/* 6. ACTIVE GAMEPLAY CANVAS */}
      {currentView === 'PLAYING' && (
        <GameCanvas
          stageId={currentStageId}
          levelId={currentLevelId}
          stats={stats}
          lang={lang}
          onUpdateStats={handleUpdateStats}
          onLevelCompleteSave={handleLevelCompleteSave}
          onNextLevel={handleNextLevel}
          onExitToStages={() => setCurrentView('LEVEL_SELECT')}
          onExitToHome={() => setCurrentView('HOME')}
        />
      )}
    </div>
  );
}
