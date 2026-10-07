import React from 'react';
import { ArrowLeft, Keyboard, Smartphone, Sparkles } from 'lucide-react';

interface ControlsGuideModalProps {
  lang: 'bn' | 'en';
  onBack: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({
  lang,
  onBack,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col bg-[#020617] text-slate-100 select-none overflow-hidden">
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
              {lang === 'bn' ? 'খেলার নিয়ম ও নিয়ন্ত্রণ' : 'HOW TO PLAY & CONTROLS'}
            </h1>
            <p className="text-xs text-sky-400 font-mono">
              {lang === 'bn' ? 'নিনজা আরশির অ্যাক্রোবেটিক কৌশলসমূহ' : 'MASTER ARASHI\'S SHADOW SKILLS'}
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-3xl w-full flex flex-col gap-6">
          {/* Keyboard Controls */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/70 to-[#020617] border border-blue-900/60 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Keyboard className="w-5 h-5 text-sky-400" />
              <h2 className="font-['Cinzel'] text-base font-bold text-white">
                {lang === 'bn' ? 'কীবোর্ড শর্টকাট (ডেস্কটপ)' : 'KEYBOARD SHORTCUTS (DESKTOP)'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/40">
                <span className="text-slate-300">{lang === 'bn' ? 'মুভমেন্ট (বামে / ডানে)' : 'Move Left / Right'}</span>
                <span className="font-mono text-sky-300 font-bold bg-blue-900/70 px-2 py-0.5 rounded">A / D অথবা Arrow keys</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/40">
                <span className="text-slate-300">{lang === 'bn' ? 'লাফ / ডাবল জাম্প' : 'Jump / Double Jump'}</span>
                <span className="font-mono text-sky-300 font-bold bg-blue-900/70 px-2 py-0.5 rounded">W / Spacebar / Up</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/40">
                <span className="text-slate-300">{lang === 'bn' ? 'কাটানা তলোয়ারের আঘাত' : 'Katana Sword Slash'}</span>
                <span className="font-mono text-sky-300 font-bold bg-blue-900/70 px-2 py-0.5 rounded">J অথবা Z</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/40">
                <span className="text-slate-300">{lang === 'bn' ? 'শুরিকেন নিক্ষেপ' : 'Throw Shuriken'}</span>
                <span className="font-mono text-sky-300 font-bold bg-blue-900/70 px-2 py-0.5 rounded">K অথবা X</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/40">
                <span className="text-slate-300">{lang === 'bn' ? 'ছায়া ড্যাশ (হায়াতে ড্যাশ)' : 'Shadow Hayate Dash'}</span>
                <span className="font-mono text-sky-300 font-bold bg-blue-900/70 px-2 py-0.5 rounded">L অথবা C</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/40">
                <span className="text-slate-300">{lang === 'bn' ? 'ছদ্মবেশ (পিপা রূপ ধারণ)' : 'Camouflage Disguise'}</span>
                <span className="font-mono text-amber-300 font-bold bg-blue-900/70 px-2 py-0.5 rounded">S / Down / Shift</span>
              </div>
            </div>
          </div>

          {/* Touch Controls Guide */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/70 to-[#020617] border border-blue-900/60 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <h2 className="font-['Cinzel'] text-base font-bold text-white">
                {lang === 'bn' ? 'টাচ স্ক্রিন নিয়ন্ত্রণ (মোবাইল ও ট্যাবলেট)' : 'ON-SCREEN TOUCH CONTROLS'}
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'স্ক্রিনের বামপাশে থাকা দুটি তীর বাটনে চেপে ধরে সামনে বা পেছনে হাঁটুন। ডানপাশের অ্যাকশন বাটনসমূহ দিয়ে জাম্প, তলোয়ার চালানো, শুরিকেন মারা এবং ড্যাশ দেওয়া যাবে।'
                : 'Use the left virtual arrow pads to run across platforms. Tap the right action clusters for acrobatic double-jumps, lethal sword strikes, ranged shurikens, and invulnerable shadow dashes.'}
            </p>
          </div>

          {/* Signature Techniques & Tips */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/70 to-[#020617] border border-blue-900/60 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h2 className="font-['Cinzel'] text-base font-bold text-white">
                {lang === 'bn' ? 'বিশেষ নিনজা কলাকৌশল' : 'SECRET NINJA TECHNIQUES'}
              </h2>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-900/40">
                <strong className="text-sky-300 font-semibold">1. {lang === 'bn' ? 'দেওয়াল বেয়ে ওঠা (Wall Climb & Jump)' : 'Wall Climb & Jump'}:</strong>{' '}
                {lang === 'bn'
                  ? 'উঁচু খাড়া দেওয়ালে গিয়ে লাফ দিলে আরশি দেওয়ালে ঝুলে পড়বে। এরপর আবার জাম্প বাটনে চাপ দিলে দেওয়াল থেকে লাথি মেরে আরও উঁচুতে ওঠা যায়।'
                  : 'Jump into any vertical wall to slide down slowly. Tap Jump while sliding to perform an athletic wall-kick jump to reach high secret passages!'}
              </div>
              <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-900/40">
                <strong className="text-sky-300 font-semibold">2. {lang === 'bn' ? 'তোরি চেকপয়েন্ট মাজার' : 'Torii Gate Checkpoints'}:</strong>{' '}
                {lang === 'bn'
                  ? 'লেভেলের পথে থাকা পাথরের তোরি গেটের সামনে গেলেই নীল আত্মা-শিখা জ্বলে উঠবে। মারা গেলে আবার শুরু থেকে নয়, এই চেকপয়েন্টেই জীবন ফিরে পাবেন!'
                  : 'Pass through the Torii shrines to ignite the blue soul fire. When you fall, you immediately respawn at your latest lit checkpoint with restored health!'}
              </div>
              <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-900/40">
                <strong className="text-sky-300 font-semibold">3. {lang === 'bn' ? '৩টি প্রাচীন পাণ্ডুলিপি' : '3 Secret Scrolls'}:</strong>{' '}
                {lang === 'bn'
                  ? 'প্রতিটি বড় লেভেলে ৩টি করে গোপন পাণ্ডুলিপি লুকানো থাকে। ৩টিই খুঁজে পেলে পূর্ণ ৩-স্টার রেটিং অর্জন করবেন!'
                  : 'Each sprawling level conceals 3 ancient secret scrolls in high or hidden parkour paths. Collect all 3 for a full 3-star mastery rating!'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
