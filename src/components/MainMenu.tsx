import React, { useEffect, useRef } from 'react';
import { PlayerStats } from '../game/types';
import { soundEngine } from '../game/audio';
import {
  Play,
  MapPin,
  Shield,
  BookOpen,
  Volume2,
  VolumeX,
  Music,
  Globe,
  HelpCircle,
} from 'lucide-react';

interface MainMenuProps {
  stats: PlayerStats;
  lang: 'bn' | 'en';
  onToggleLang: () => void;
  onPlay: () => void;
  onOpenStages: () => void;
  onOpenDojo: () => void;
  onOpenArtifacts: () => void;
  onOpenControls: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  lang,
  onToggleLang,
  onPlay,
  onOpenStages,
  onOpenDojo,
  onOpenArtifacts,
  onOpenControls,
}) => {
  const [muted, setMuted] = React.useState(soundEngine.getMuted());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background animated canvas: Glowing Blue Moon, silhouette cliff, wind mist & Arashi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Leaves / blue moon mist
    const leaves: { x: number; y: number; speedX: number; speedY: number }[] = [];
    for (let i = 0; i < 35; i++) {
      leaves.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speedX: 1.2 + Math.random() * 2,
        speedY: 0.4 + Math.random() * 0.8,
      });
    }

    const render = () => {
      time += 0.015;
      const w = canvas.width;
      const h = canvas.height;

      // Deep Blue Gradient Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#020617');
      sky.addColorStop(0.5, '#0c1a3b');
      sky.addColorStop(1, '#020617');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Distant stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137 + 50) % w);
        const sy = ((i * 91 + 30) % (h * 0.5));
        ctx.beginPath();
        ctx.arc(sx, sy, i % 4 === 0 ? 1.6 : 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gigantic glowing Blue Moon
      const moonX = w * 0.5;
      const moonY = h * 0.38;
      const moonR = Math.min(w, h) * 0.26;

      const aura = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 2.6);
      aura.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      aura.addColorStop(0.5, 'rgba(30, 58, 138, 0.15)');
      aura.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      const moonGrad = ctx.createRadialGradient(moonX - 20, moonY - 20, 15, moonX, moonY, moonR);
      moonGrad.addColorStop(0, '#f0f9ff');
      moonGrad.addColorStop(0.7, '#7dd3fc');
      moonGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Mountain ridges silhouette
      ctx.fillStyle = '#060d1f';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 30) {
        const my = h * 0.65 + Math.sin(x * 0.003 + 1) * 60 + Math.cos(x * 0.006) * 30;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Silhouette Pine Cliff on the right
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h);
      ctx.lineTo(w * 0.5, h * 0.68);
      ctx.lineTo(w * 0.75, h * 0.65);
      ctx.lineTo(w, h * 0.72);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Silhouette Ancient Pine Tree branch over the moon
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(w * 0.8, h * 0.65);
      ctx.quadraticCurveTo(w * 0.68, h * 0.45, w * 0.45, h * 0.48);
      ctx.stroke();

      // Silhouette Ninja Arashi standing on cliff branch
      const nx = w * 0.56;
      const ny = h * 0.55;

      ctx.fillStyle = '#000000';
      // Head
      ctx.beginPath();
      ctx.arc(nx, ny - 28, 9, 0, Math.PI * 2);
      // Torso & legs in stealth stance
      ctx.rect(nx - 7, ny - 20, 14, 22);
      ctx.rect(nx - 9, ny + 2, 7, 24);
      ctx.rect(nx + 2, ny + 2, 7, 24);
      ctx.fill();

      // Glowing Cyan Ninja Eyes
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(nx - 3, ny - 29, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Katana on back
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(nx - 12, ny + 10);
      ctx.lineTo(nx + 10, ny - 38);
      ctx.stroke();

      // Flowing Dark Blue Scarf waving dynamically in the wind
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(nx + 2, ny - 26);
      const wave1 = Math.sin(time * 3) * 12;
      const wave2 = Math.cos(time * 2.5) * 16;
      ctx.quadraticCurveTo(nx + 25 + wave1, ny - 30 + wave2, nx + 65, ny - 24 + wave1);
      ctx.stroke();

      // Leaves blowing across
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      for (const leaf of leaves) {
        leaf.x += leaf.speedX;
        leaf.y += leaf.speedY;
        if (leaf.x > w) leaf.x = 0;
        if (leaf.y > h) leaf.y = 0;
        ctx.beginPath();
        ctx.ellipse(leaf.x, leaf.y, 4, 1.8, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleToggleMute = () => {
    const isNowMuted = soundEngine.toggleMute();
    setMuted(isNowMuted);
  };

  const handleStartMusic = () => {
    soundEngine.startAmbientMusic();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden text-slate-100 select-none">
      {/* Background Animated Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Subtle Blue Vignette */}
      <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-[#020617]/40 to-[#020617]/90 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-blue-950/40 bg-[#020617]/70 backdrop-blur-md">
        {/* Left: Brand wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center font-bold text-sky-200 border border-blue-500/30 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            嵐
          </div>
          <span className="font-['Cinzel'] text-xl font-extrabold tracking-wider bg-gradient-to-r from-sky-200 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
            NINJA ARASHI 2
          </span>
        </div>

        {/* Center: Currency & Resources */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-950/60 rounded-full border border-blue-800/40">
            <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-amber-950 font-bold">
              ●
            </span>
            <span className="text-sm font-semibold text-amber-400 tabular-nums">
              {stats.coins.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-950/60 rounded-full border border-blue-800/40">
            <span className="text-sky-400 text-xs font-bold">◆</span>
            <span className="text-sm font-semibold text-sky-400 tabular-nums">
              {stats.diamonds.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right: Sound, Music, Language, Guide */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-950/80 hover:bg-blue-900 border border-blue-700/50 rounded-lg text-sky-300 transition-colors"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'বাংলা' : 'English'}</span>
          </button>

          <button
            onClick={handleStartMusic}
            className="p-2 text-sky-300 hover:text-white bg-blue-950/80 hover:bg-blue-900 border border-blue-700/50 rounded-lg transition-colors"
            title="Ambient Koto & Flute Music"
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 text-sky-300 hover:text-white bg-blue-950/80 hover:bg-blue-900 border border-blue-700/50 rounded-lg transition-colors"
            title="Sound FX"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenControls}
            className="p-2 text-sky-300 hover:text-white bg-blue-950/80 hover:bg-blue-900 border border-blue-700/50 rounded-lg transition-colors"
            title="Controls & Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Hero & Menu Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-10 md:px-20 max-w-2xl">
        {/* Title Badges */}
        <div className="space-y-2 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-sky-400 uppercase">
            <span>{lang === 'bn' ? 'অধ্যায় ২ : নীল ছায়া' : 'ACT II : BLUE SHADOW'}</span>
            <span>·</span>
            <span>{lang === 'bn' ? '১০টি স্টেজ · ২০০টি লেভেল' : '10 STAGES · 200 LEVELS'}</span>
          </div>

          <h1 className="font-['Cinzel'] text-5xl md:text-6xl font-black tracking-tight leading-none text-white drop-shadow-[0_4px_25px_rgba(56,189,248,0.4)]">
            NINJA <span className="text-sky-400">ARASHI</span> 2
          </h1>

          <p className="text-slate-300 text-sm md:text-base font-medium max-w-lg leading-relaxed drop-shadow-md">
            {lang === 'bn'
              ? 'শোগুন দোসুর হাত থেকে পুত্রকে উদ্ধার করতে নীল চাঁদের ছায়ায় অন্ধকার শত্রুদের ভেদ করে এগিয়ে চলুন।'
              : 'Pursue the dark shogun across 10 mystic stages and 200 sprawling levels under the veil of the blue moon.'}
          </p>
        </div>

        {/* Primary Play & Menu Navigation Buttons */}
        <div className="flex flex-col gap-3.5 max-w-sm">
          {/* Big Campaign Play Button */}
          <button
            onClick={onPlay}
            className="group relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 rounded-xl font-['Cinzel'] font-bold text-white text-lg tracking-wider shadow-[0_0_25px_rgba(56,189,248,0.5)] border border-sky-400/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              </div>
              <span>{lang === 'bn' ? 'ক্যাম্পেইন শুরু করুন' : 'START CAMPAIGN'}</span>
            </div>
            <span className="text-sky-200 text-xs font-sans tracking-normal opacity-90">
              {lang === 'bn' ? 'খেলা শুরু' : 'PLAY'}
            </span>
          </button>

          {/* Stages & Levels Select */}
          <button
            onClick={onOpenStages}
            className="flex items-center justify-between px-5 py-3.5 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-800/60 hover:border-sky-500/60 rounded-xl text-slate-200 font-medium transition-all"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-sky-400" />
              <span>{lang === 'bn' ? 'স্টেজ ও লেভেল মানচিত্র' : 'STAGES & LEVELS'}</span>
            </div>
            <span className="text-xs text-sky-300/80 font-mono">10 STAGES</span>
          </button>

          {/* Dojo & Skill Tree */}
          <button
            onClick={onOpenDojo}
            className="flex items-center justify-between px-5 py-3.5 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-800/60 hover:border-sky-500/60 rounded-xl text-slate-200 font-medium transition-all"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-sky-400" />
              <span>{lang === 'bn' ? 'ডজো ও দক্ষতা আপগ্রেড' : 'SKILL TREE & DOJO'}</span>
            </div>
            <span className="text-xs text-amber-400 font-mono">UPGRADE</span>
          </button>

          {/* Artifacts & Scrolls */}
          <button
            onClick={onOpenArtifacts}
            className="flex items-center justify-between px-5 py-3.5 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-800/60 hover:border-sky-500/60 rounded-xl text-slate-200 font-medium transition-all"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <span>{lang === 'bn' ? 'প্রাচীন পাণ্ডুলিপি ও নিদর্শন' : 'ARTIFACTS & SCROLLS'}</span>
            </div>
            <span className="text-xs text-sky-300/80 font-mono">COLLECTION</span>
          </button>
        </div>
      </main>

      {/* Bottom Footer Info */}
      <footer className="relative z-10 px-6 py-3 border-t border-blue-950/40 bg-[#020617]/70 backdrop-blur-md flex items-center justify-between text-xs text-slate-400">
        <div>
          <span>Ninja Arashi 2: Blue Shadow</span>
          <span className="mx-2">·</span>
          <span>Dark Blue & Black Silhouette Edition</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{lang === 'bn' ? 'নিয়ন্ত্রণ: WASD / তলোয়ার / শুরিকেন / ড্যাশ' : 'Controls: WASD / Slash / Shuriken / Dash'}</span>
        </div>
      </footer>
    </div>
  );
};
