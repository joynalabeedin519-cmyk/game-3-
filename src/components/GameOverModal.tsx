import React from 'react';
import { RotateCcw, Home, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  lang: 'bn' | 'en';
  onRespawnCheckpoint: () => void;
  onRestartLevel: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  lang,
  onRespawnCheckpoint,
  onRestartLevel,
  onHome,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 select-none animate-fadeIn">
      <div className="relative w-full max-w-sm p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#090b14] to-[#02040a] border-2 border-blue-900/80 shadow-[0_0_35px_rgba(30,58,138,0.5)] flex flex-col items-center text-center">
        {/* Japanese Stamp for Death/Fallen */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-950 to-black border border-red-700/60 flex items-center justify-center text-3xl font-bold text-red-500 shadow-lg mb-2">
          死
        </div>

        <h2 className="font-['Cinzel'] text-2xl md:text-3xl font-black tracking-wide text-white drop-shadow-md">
          {lang === 'bn' ? 'আপনি পরাজিত হয়েছেন' : 'YOU WERE DEFEATED'}
        </h2>

        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed max-w-xs">
          {lang === 'bn'
            ? 'নীল আত্মার শিখায় প্রজ্বলিত শেষ তোরি চেকপয়েন্ট হতে আবার যাত্রা শুরু করুন।'
            : 'Rise again from your latest illuminated Torii shrine checkpoint or restart this stage.'}
        </p>

        <div className="w-full flex flex-col gap-3">
          {/* Respawn at Torii Checkpoint Button */}
          <button
            onClick={onRespawnCheckpoint}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 hover:from-blue-600 hover:to-sky-500 text-white font-['Cinzel'] font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-sky-400 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'bn' ? 'চেকপয়েন্টে পুনর্জন্ম' : 'RESPAWN AT SHRINE'}</span>
          </button>

          {/* Restart Entire Level */}
          <button
            onClick={onRestartLevel}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-sky-200 text-xs font-semibold transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{lang === 'bn' ? 'লেভেল শুরু থেকে খেলুন' : 'RESTART LEVEL'}</span>
          </button>

          {/* Return Home */}
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-transparent hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-medium transition-all"
          >
            <Home className="w-4 h-4" />
            <span>{lang === 'bn' ? 'প্রধান মেনুতে ফিরুন' : 'MAIN MENU'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
