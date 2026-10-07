import React, { useState } from 'react';
import { STAGES } from '../game/stages';
import { LevelProgress } from '../game/types';
import {
  ArrowLeft,
  Lock,
  Skull,
  Scroll,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface StageLevelSelectProps {
  levelProgress: Record<string, LevelProgress>;
  currentStageId: number;
  lang: 'bn' | 'en';
  onSelectLevel: (stageId: number, levelId: number) => void;
  onBack: () => void;
  onUnlockAll: () => void;
}

export const StageLevelSelect: React.FC<StageLevelSelectProps> = ({
  levelProgress,
  currentStageId: initialStageId,
  lang,
  onSelectLevel,
  onBack,
  onUnlockAll,
}) => {
  const [selectedStageId, setSelectedStageId] = useState(initialStageId);

  const currentStage = STAGES.find((s) => s.id === selectedStageId) || STAGES[0];

  // Calculate total scrolls collected in this stage
  let stageScrolls = 0;
  for (let l = 1; l <= currentStage.totalLevels; l++) {
    const key = `${currentStage.id}_${l}`;
    if (levelProgress[key]) {
      stageScrolls += levelProgress[key].scrolls;
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[#020617] text-slate-100 select-none overflow-hidden">
      {/* Background Decorative Mist & Night Skyline */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${currentStage.glowColor}22 0%, #020617 80%)`,
        }}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-blue-950/60 bg-[#020617]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-blue-950 hover:bg-blue-900 border border-blue-800 rounded-lg text-sky-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'BACK'}</span>
          </button>
          <div>
            <h1 className="font-['Cinzel'] text-xl font-bold tracking-wide text-white">
              {lang === 'bn' ? 'স্টেজ ও লেভেল নির্বাচন' : 'STAGE & LEVEL MAP'}
            </h1>
            <p className="text-xs text-sky-400 font-mono">
              {lang === 'bn' ? '১০টি স্টেজ · ২০০টি বিশাল লেভেল' : '10 STAGES · 200 SPRAWLING LEVELS'}
            </p>
          </div>
        </div>

        {/* Stage Scroll Tally */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/80 border border-blue-800 rounded-lg text-xs font-medium text-sky-200">
            <Scroll className="w-4 h-4 text-sky-400" />
            <span>{lang === 'bn' ? 'পাণ্ডুলিপি' : 'Scrolls'}:</span>
            <span className="font-bold text-white tabular-nums">
              {stageScrolls} / {currentStage.totalLevels * 3}
            </span>
          </div>

          <button
            onClick={onUnlockAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 rounded-lg text-indigo-300 transition-colors"
            title="Unlock all 200 levels for testing"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সব লেভেল আনলক' : 'UNLOCK ALL'}</span>
          </button>
        </div>
      </header>

      {/* Stage Selector Tabs / Carousel (Stages 1 through 10) */}
      <div className="relative z-10 px-6 py-3 border-b border-blue-950/40 bg-blue-950/30 overflow-x-auto flex items-center gap-2">
        {STAGES.map((stage) => {
          const isActive = stage.id === selectedStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStageId(stage.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-sky-400/60'
                  : 'bg-blue-950/50 hover:bg-blue-900/60 text-slate-300 border border-blue-900/50'
              }`}
            >
              <span className="font-['Cinzel']">ACT {stage.id}</span>
              <span className="text-slate-400">|</span>
              <span>{lang === 'bn' ? stage.nameBn : stage.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Overview Banner */}
      <div className="relative z-10 px-8 py-3 bg-gradient-to-r from-blue-950/80 via-blue-900/40 to-transparent flex items-center justify-between border-b border-blue-950/40">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-['Cinzel'] text-lg font-bold text-sky-200">
              {lang === 'bn' ? `স্টেজ ${currentStage.id} : ${currentStage.nameBn}` : `STAGE ${currentStage.id} : ${currentStage.nameEn}`}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded bg-blue-900/60 text-sky-300 font-mono border border-blue-700/40">
              {lang === 'bn' ? `বস: ${currentStage.bossName}` : `BOSS: ${currentStage.bossName}`}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
            {lang === 'bn' ? currentStage.descriptionBn : currentStage.descriptionEn}
          </p>
        </div>

        {/* Quick Prev / Next Stage Buttons */}
        <div className="flex items-center gap-2">
          <button
            disabled={selectedStageId <= 1}
            onClick={() => setSelectedStageId((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 disabled:opacity-30 border border-blue-800 text-sky-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400">
            {selectedStageId} / {STAGES.length}
          </span>
          <button
            disabled={selectedStageId >= STAGES.length}
            onClick={() => setSelectedStageId((p) => Math.min(STAGES.length, p + 1))}
            className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 disabled:opacity-30 border border-blue-800 text-sky-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Winding 20 Levels Grid / Map */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-5xl w-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-5">
            {Array.from({ length: currentStage.totalLevels }, (_, idx) => {
              const levelNum = idx + 1;
              const key = `${currentStage.id}_${levelNum}`;
              const data = levelProgress[key] || {
                stageId: currentStage.id,
                levelId: levelNum,
                unlocked: currentStage.id === 1 && levelNum === 1,
                completed: false,
                scrolls: 0,
                highScore: 0,
                bestTime: 0,
              };

              const isBoss = levelNum === 20;

              return (
                <div
                  key={levelNum}
                  onClick={() => data.unlocked && onSelectLevel(currentStage.id, levelNum)}
                  className={`group relative flex flex-col items-center p-4 rounded-2xl border transition-all ${
                    data.unlocked
                      ? isBoss
                        ? 'bg-gradient-to-b from-red-950/60 to-blue-950/80 border-red-500/60 hover:border-red-400 cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:scale-105'
                        : 'bg-gradient-to-b from-blue-950/70 to-[#020617] border-blue-800/60 hover:border-sky-400/80 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:scale-105'
                      : 'bg-slate-950/40 border-slate-900/60 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Boss Marker */}
                  {isBoss && (
                    <div className="absolute -top-3 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Skull className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'বস' : 'BOSS'}</span>
                    </div>
                  )}

                  {/* Level Number Node */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-['Cinzel'] text-xl font-bold transition-all ${
                      data.unlocked
                        ? isBoss
                          ? 'bg-gradient-to-br from-red-600 to-rose-900 text-white border-2 border-red-400 shadow-lg'
                          : data.completed
                          ? 'bg-gradient-to-br from-blue-600 to-sky-500 text-white border-2 border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                          : 'bg-blue-950 text-sky-200 border-2 border-blue-600'
                        : 'bg-slate-900 text-slate-600 border border-slate-800'
                    }`}
                  >
                    {data.unlocked ? (
                      isBoss ? (
                        <Skull className="w-6 h-6" />
                      ) : (
                        levelNum
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  {/* Level Title */}
                  <span className="text-xs font-semibold text-slate-300 mt-2.5">
                    {lang === 'bn' ? `লেভেল ${levelNum}` : `Level ${levelNum}`}
                  </span>

                  {/* 3 Ancient Scrolls Rating */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {[1, 2, 3].map((starIdx) => (
                      <span
                        key={starIdx}
                        className={`text-sm ${
                          starIdx <= data.scrolls
                            ? 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]'
                            : 'text-slate-700'
                        }`}
                      >
                        📜
                      </span>
                    ))}
                  </div>

                  {/* Best Time if completed */}
                  {data.completed && data.bestTime > 0 && (
                    <span className="text-[10px] text-sky-300/80 font-mono mt-1">
                      {data.bestTime}s
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
