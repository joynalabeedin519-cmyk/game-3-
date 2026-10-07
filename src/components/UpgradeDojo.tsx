import React from 'react';
import { PlayerStats } from '../game/types';
import { soundEngine } from '../game/audio';
import {
  ArrowLeft,
  Sword,
  Sparkles,
  ShieldAlert,
  Heart,
  ChevronRight,
} from 'lucide-react';

interface UpgradeDojoProps {
  stats: PlayerStats;
  lang: 'bn' | 'en';
  onUpdateStats: (newStats: PlayerStats) => void;
  onBack: () => void;
}

interface SkillItem {
  id: keyof PlayerStats;
  nameEn: string;
  nameBn: string;
  descEn: string;
  descBn: string;
  level: number;
  maxLevel: number;
  coinCost: number;
  diamondCost: number;
  icon: React.ReactNode;
}

export const UpgradeDojo: React.FC<UpgradeDojoProps> = ({
  stats,
  lang,
  onUpdateStats,
  onBack,
}) => {
  const skills: SkillItem[] = [
    {
      id: 'katanaLevel',
      nameEn: 'Katana Crescent Slash',
      nameBn: 'কাটানা অর্ধচন্দ্রাকার আঘাত',
      descEn: 'Increases blade damage, slash radius and breaks enemy defenses faster.',
      descBn: 'তলোয়ারের আঘাতের তীব্রতা ও পরিসীমা বৃদ্ধি করে এবং শত্রুদের প্রতিরক্ষা চূর্ণ করে।',
      level: stats.katanaLevel,
      maxLevel: 5,
      coinCost: stats.katanaLevel * 250,
      diamondCost: stats.katanaLevel * 4,
      icon: <Sword className="w-6 h-6 text-sky-400" />,
    },
    {
      id: 'shurikenLevel',
      nameEn: 'Shadow Shuriken Capacity',
      nameBn: 'ছায়া শুরিকেন ক্ষমতা',
      descEn: 'Expands maximum shurikens carried and accelerates auto-recharge speed.',
      descBn: 'একসাথে বহনের শুরিকেন সংখ্যা বৃদ্ধি করে এবং দ্রুত স্বয়ংক্রিয় রিচার্জ নিশ্চিত করে।',
      level: stats.shurikenLevel,
      maxLevel: 5,
      coinCost: stats.shurikenLevel * 200,
      diamondCost: stats.shurikenLevel * 3,
      icon: <span className="text-2xl text-sky-400">❖</span>,
    },
    {
      id: 'dashLevel',
      nameEn: 'Hayate Shadow Dash',
      nameBn: 'হায়াতে ছায়া ড্যাশ',
      descEn: 'Extends dash distance, pierces heavier armor and significantly cuts cooldown.',
      descBn: 'ড্যাশের দূরত্ব ও গতি বাড়ায় এবং কুলডাউনের সময় দ্রুত হ্রাস করে।',
      level: stats.dashLevel,
      maxLevel: 5,
      coinCost: stats.dashLevel * 300,
      diamondCost: stats.dashLevel * 5,
      icon: <Sparkles className="w-6 h-6 text-sky-400" />,
    },
    {
      id: 'disguiseLevel',
      nameEn: 'Stealth Camouflage Disguise',
      nameBn: 'গুপ্ত ছদ্মবেশ কৌশল',
      descEn: 'Allows Arashi to stay hidden as a wooden barrel or stone lantern longer.',
      descBn: 'কাঠের পিপা বা পাথরের লণ্ঠন রূপে বেশি সময় ধরে অদৃশ্য ও নিরাপদ থাকার ক্ষমতা দেয়।',
      level: stats.disguiseLevel,
      maxLevel: 5,
      coinCost: stats.disguiseLevel * 220,
      diamondCost: stats.disguiseLevel * 3,
      icon: <ShieldAlert className="w-6 h-6 text-amber-400" />,
    },
    {
      id: 'vitalityLevel',
      nameEn: 'Vitality & Max Health',
      nameBn: 'জীবনশক্তি ও অতিরিক্ত জীবন',
      descEn: 'Adds permanent heart containers to survive devastating boss strikes.',
      descBn: 'স্থায়ী অতিরিক্ত জীবন যোগ করে যাতে মারাত্মক আঘাতের পরও টিকে থাকা যায়।',
      level: stats.vitalityLevel,
      maxLevel: 5,
      coinCost: stats.vitalityLevel * 400,
      diamondCost: stats.vitalityLevel * 6,
      icon: <Heart className="w-6 h-6 text-rose-400 fill-rose-500" />,
    },
  ];

  const handleUpgrade = (skill: SkillItem) => {
    if (skill.level >= skill.maxLevel) return;
    if (stats.coins < skill.coinCost || stats.diamonds < skill.diamondCost) {
      soundEngine.playPlayerHit();
      return;
    }

    const newStats: PlayerStats = {
      ...stats,
      coins: stats.coins - skill.coinCost,
      diamonds: stats.diamonds - skill.diamondCost,
      [skill.id]: skill.level + 1,
    };

    if (skill.id === 'vitalityLevel') {
      newStats.maxHealth = 3 + (newStats.vitalityLevel - 1);
      newStats.health = newStats.maxHealth;
    }

    soundEngine.playDiamond();
    onUpdateStats(newStats);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#020617] text-slate-100 select-none overflow-hidden">
      {/* Header */}
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
              {lang === 'bn' ? 'ডজো ও দক্ষতা আপগ্রেড' : 'SKILL TREE & DOJO'}
            </h1>
            <p className="text-xs text-sky-400 font-mono">
              {lang === 'bn' ? 'আরশির দক্ষতা ও অস্ত্র শক্তিশালী করুন' : 'ENHANCE ARASHI\'S LETHAL ARSENAL'}
            </p>
          </div>
        </div>

        {/* Currency balances */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-950/80 rounded-full border border-blue-800 text-xs font-bold">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-[10px] text-amber-950 flex items-center justify-center">
              ●
            </span>
            <span className="text-amber-400 font-mono tabular-nums">
              {stats.coins.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-950/80 rounded-full border border-blue-800 text-xs font-bold">
            <span className="text-sky-400">◆</span>
            <span className="text-sky-400 font-mono tabular-nums">
              {stats.diamonds.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* Skills list */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-3xl w-full flex flex-col gap-4">
          {skills.map((skill) => {
            const isMax = skill.level >= skill.maxLevel;
            const canAfford =
              stats.coins >= skill.coinCost && stats.diamonds >= skill.diamondCost;

            return (
              <div
                key={String(skill.id)}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-blue-900/30 to-[#020617] border border-blue-900/60 shadow-lg gap-4"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-blue-950 border border-blue-700/60 flex items-center justify-center shadow-inner shrink-0">
                    {skill.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-['Cinzel'] text-base font-bold text-white">
                        {lang === 'bn' ? skill.nameBn : skill.nameEn}
                      </h3>
                      <span className="text-xs font-mono font-semibold text-sky-400">
                        LVL {skill.level}/{skill.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-lg">
                      {lang === 'bn' ? skill.descBn : skill.descEn}
                    </p>

                    {/* Level Progress Bars */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {Array.from({ length: skill.maxLevel }).map((_, barIdx) => (
                        <div
                          key={barIdx}
                          className={`h-2 w-7 rounded-sm transition-all ${
                            barIdx < skill.level
                              ? 'bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Price & Upgrade Button */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                  {!isMax ? (
                    <button
                      onClick={() => handleUpgrade(skill)}
                      disabled={!canAfford}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-xs transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-95'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[11px] font-bold">
                          {lang === 'bn' ? 'আপগ্রেড' : 'UPGRADE'}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[10px] mt-0.5">
                          <span className="text-amber-400">● {skill.coinCost}</span>
                          <span className="text-sky-300">◆ {skill.diamondCost}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  ) : (
                    <div className="px-5 py-2.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-sky-400 text-xs font-bold uppercase tracking-wider font-mono">
                      MAX LEVEL
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
