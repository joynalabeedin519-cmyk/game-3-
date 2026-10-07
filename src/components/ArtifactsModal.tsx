import React from 'react';
import { ARTIFACTS } from '../game/stages';
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

interface ArtifactsModalProps {
  lang: 'bn' | 'en';
  onBack: () => void;
}

export const ArtifactsModal: React.FC<ArtifactsModalProps> = ({ lang, onBack }) => {
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
              {lang === 'bn' ? 'প্রাচীন নিদর্শন ও পাণ্ডুলিপি' : 'ANCIENT ARTIFACTS & RELICS'}
            </h1>
            <p className="text-xs text-sky-400 font-mono">
              {lang === 'bn' ? '১০টি স্টেজের লুকায়িত রহস্য' : 'SECRET RELICS ACROSS 10 STAGES'}
            </p>
          </div>
        </div>
      </header>

      {/* Artifacts Grid */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {ARTIFACTS.map((artifact) => (
            <div
              key={artifact.id}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                artifact.unlocked
                  ? 'bg-gradient-to-br from-blue-950/70 via-blue-900/30 to-[#020617] border-blue-700/60 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                  : 'bg-slate-950/40 border-slate-900/60 opacity-60'
              }`}
            >
              {/* Artifact Icon */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border shadow-inner shrink-0 ${
                  artifact.unlocked
                    ? 'bg-blue-950 border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                    : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                {artifact.unlocked ? artifact.icon : <Lock className="w-6 h-6 text-slate-600" />}
              </div>

              {/* Text Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-['Cinzel'] text-base font-bold text-white">
                    {lang === 'bn' ? artifact.nameBn : artifact.nameEn}
                  </h3>
                  {artifact.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                      ACT {artifact.stageReq}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {lang === 'bn' ? artifact.descBn : artifact.descEn}
                </p>

                <div className="mt-3 text-[11px] font-mono text-sky-400">
                  {artifact.unlocked
                    ? lang === 'bn'
                      ? '✓ সংগৃহীত ও সক্রিয়'
                      : '✓ Discovered & Active'
                    : lang === 'bn'
                    ? `লক করা - স্টেজ ${artifact.stageReq} সম্পূর্ণ করুন`
                    : `Locked - Complete Stage ${artifact.stageReq}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
