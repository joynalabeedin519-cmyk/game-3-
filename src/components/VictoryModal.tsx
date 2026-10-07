import React from 'react';
import {
  RotateCcw,
  Play,
  MapPin,
  Trophy,
} from 'lucide-react';

interface VictoryModalProps {
  stageId: number;
  levelId: number;
  scrolls: number;
  coinsEarned: number;
  diamondsEarned: number;
  timeSeconds: number;
  lang: 'bn' | 'en';
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stageId,
  levelId,
  scrolls,
  coinsEarned,
  diamondsEarned,
  timeSeconds,
  lang,
  onNextLevel,
  onReplay,
  onLevelSelect,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 select-none animate-fadeIn">
      <div className="relative w-full max-w-md p-6 md:p-8 rounded-3xl bg-gradient-to-b from-blue-950/90 to-[#020617] border-2 border-sky-400/80 shadow-[0_0_40px_rgba(56,189,248,0.4)] flex flex-col items-center text-center">
        {/* Japanese Calligraphy Stamp */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 border border-sky-200 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-2">
          勝
        </div>

        <h2 className="font-['Cinzel'] text-3xl md:text-4xl font-black tracking-wide text-white drop-shadow-md">
          {lang === 'bn' ? 'বিজয় সম্পন্ন!' : 'STAGE CLEARED!'}
        </h2>

        <p className="text-xs font-mono text-sky-400 mt-1 uppercase tracking-widest">
          {lang === 'bn' ? `স্টেজ ${stageId} · লেভেল ${levelId}` : `ACT ${stageId} · LEVEL ${levelId}`}
        </p>

        {/* 3 Ancient Scrolls rating */}
        <div className="flex items-center justify-center gap-3 my-6">
          {[1, 2, 3].map((star) => (
            <div
              key={star}
              className={`flex flex-col items-center transition-all transform ${
                star <= scrolls ? 'scale-110 drop-shadow-[0_0_15px_rgba(56,189,248,0.9)]' : 'opacity-25 grayscale scale-90'
              }`}
            >
              <span className="text-4xl">📜</span>
              <span className="text-[10px] font-mono text-sky-300 mt-1 font-bold">
                {star <= scrolls ? (lang === 'bn' ? 'সংগৃহীত' : 'FOUND') : (lang === 'bn' ? 'অনাবিষ্কৃত' : 'MISSED')}
              </span>
            </div>
          ))}
        </div>

        {/* Level Stats Breakdown */}
        <div className="w-full grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-blue-950/50 border border-blue-900/60 mb-6 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold">{lang === 'bn' ? 'কয়েন' : 'Coins'}</span>
            <span className="font-mono text-amber-400 font-bold text-sm mt-0.5">
              +{coinsEarned}
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-blue-900/40">
            <span className="text-slate-400 text-[10px] uppercase font-bold">{lang === 'bn' ? 'হীরা' : 'Gems'}</span>
            <span className="font-mono text-sky-400 font-bold text-sm mt-0.5">
              +{diamondsEarned}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold">{lang === 'bn' ? 'সময়' : 'Time'}</span>
            <span className="font-mono text-white font-bold text-sm mt-0.5">
              {timeSeconds}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onNextLevel}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-['Cinzel'] font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(56,189,248,0.5)] border border-sky-400 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-white ml-0.5" />
            <span>{lang === 'bn' ? 'পরবর্তী লেভেল' : 'NEXT LEVEL'}</span>
          </button>

          <div className="flex items-center gap-2.5 w-full">
            <button
              onClick={onReplay}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-sky-200 text-xs font-semibold transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'আবার খেলুন' : 'RETRY'}</span>
            </button>
            <button
              onClick={onLevelSelect}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-sky-200 text-xs font-semibold transition-all active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লেভেল নির্বাচন' : 'LEVELS'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
