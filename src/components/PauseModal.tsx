import React from 'react';
import { Play, RotateCcw, MapPin, Home, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface PauseModalProps {
  lang: 'bn' | 'en';
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  lang,
  onResume,
  onRestart,
  onLevelSelect,
  onHome,
}) => {
  const [muted, setMuted] = React.useState(soundEngine.getMuted());

  const handleToggleMute = () => {
    const isMuted = soundEngine.toggleMute();
    setMuted(isMuted);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 select-none animate-fadeIn">
      <div className="relative w-full max-w-sm p-6 md:p-8 rounded-3xl bg-gradient-to-b from-blue-950/90 to-[#020617] border-2 border-blue-800 shadow-[0_0_35px_rgba(30,58,138,0.4)] flex flex-col items-center text-center">
        <h2 className="font-['Cinzel'] text-2xl md:text-3xl font-black tracking-wide text-white drop-shadow-md mb-6">
          {lang === 'bn' ? 'খেলা সাময়িক বিরতি' : 'GAME PAUSED'}
        </h2>

        <div className="w-full flex flex-col gap-3">
          {/* Resume */}
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-['Cinzel'] font-bold text-sm tracking-wider shadow-[0_0_15px_rgba(56,189,248,0.4)] border border-sky-400 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-white ml-0.5" />
            <span>{lang === 'bn' ? 'চালিয়ে যান' : 'RESUME'}</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-sky-200 text-xs font-semibold transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{lang === 'bn' ? 'পুনরায় শুরু করুন' : 'RESTART'}</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={handleToggleMute}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-sky-200 text-xs font-semibold transition-all active:scale-95"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            <span>{muted ? (lang === 'bn' ? 'শব্দ বন্ধ' : 'SOUND MUTED') : (lang === 'bn' ? 'শব্দ চালু' : 'SOUND ON')}</span>
          </button>

          {/* Level Select */}
          <button
            onClick={onLevelSelect}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-sky-200 text-xs font-semibold transition-all active:scale-95"
          >
            <MapPin className="w-4 h-4" />
            <span>{lang === 'bn' ? 'লেভেল নির্বাচন' : 'LEVEL SELECT'}</span>
          </button>

          {/* Main Menu */}
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-transparent hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-medium transition-all"
          >
            <Home className="w-4 h-4" />
            <span>{lang === 'bn' ? 'প্রধান মেনু' : 'MAIN MENU'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
