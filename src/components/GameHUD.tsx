import React from 'react';
import { PlayerStats } from '../game/types';
import { NinjaPlayer } from '../game/player';
import {
  Heart,
  Pause,
  Sword,
  Sparkles,
  ShieldAlert,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Scroll,
} from 'lucide-react';

interface GameHUDProps {
  player: NinjaPlayer;
  stats: PlayerStats;
  stageId: number;
  levelId: number;
  stageName: string;
  scrollsFound: number;
  coinsEarned: number;
  diamondsEarned: number;
  lang: 'bn' | 'en';
  onPause: () => void;
  // Controls Handlers
  onLeftDown: () => void;
  onLeftUp: () => void;
  onRightDown: () => void;
  onRightUp: () => void;
  onJump: () => void;
  onSlash: () => void;
  onShuriken: () => void;
  onDash: () => void;
  onDisguise: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  stats,
  stageId,
  levelId,
  stageName,
  scrollsFound,
  coinsEarned,
  diamondsEarned,
  lang,
  onPause,
  onLeftDown,
  onLeftUp,
  onRightDown,
  onRightUp,
  onJump,
  onSlash,
  onShuriken,
  onDash,
  onDisguise,
}) => {
  // Cooldown ratios
  const dashCooldownRatio = player.dashCooldown > 0 ? player.dashCooldown / 120 : 0;
  const disguiseCooldownRatio = player.disguiseCooldown > 0 ? player.disguiseCooldown / 200 : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Player Profile & Hearts */}
        <div className="flex items-center gap-3">
          {/* Ninja Avatar */}
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-b from-blue-900 to-black border-2 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.4)] flex items-center justify-center overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-black relative flex items-center justify-center">
              {/* Cyan eyes */}
              <div className="w-1.5 h-1.5 rounded-full bg-sky-300 absolute left-0.5" />
              <div className="w-1.5 h-1.5 rounded-full bg-sky-300 absolute right-0.5" />
            </div>
            {/* Scarf strip */}
            <div className="absolute -bottom-1 -right-1 w-6 h-3 bg-blue-600 rounded-full rotate-45" />
          </div>

          {/* Health Hearts & Stage Info */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: stats.maxHealth }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-6 h-6 transition-all ${
                    i < stats.health
                      ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-100'
                      : 'fill-transparent text-slate-700 scale-90'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="font-['Cinzel'] text-sky-200">
                ACT {stageId} · LVL {levelId}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300 truncate max-w-[140px]">{stageName}</span>
            </div>
          </div>
        </div>

        {/* Center: 3 Secret Scrolls */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#020617]/85 backdrop-blur-md rounded-full border border-blue-900/60 shadow-lg">
          <Scroll className="w-4 h-4 text-sky-400" />
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((num) => (
              <span
                key={num}
                className={`text-base transition-all ${
                  num <= scrollsFound
                    ? 'text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] scale-110'
                    : 'opacity-25 grayscale'
                }`}
              >
                📜
              </span>
            ))}
          </div>
        </div>

        {/* Right: Coins, Diamonds & Pause */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-3.5 py-1.5 bg-[#020617]/85 backdrop-blur-md rounded-full border border-blue-900/60 shadow-lg">
            {/* Coins */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-[9px] text-amber-950 flex items-center justify-center">
                ●
              </span>
              <span className="font-mono tabular-nums">
                {(stats.coins + coinsEarned).toLocaleString()}
              </span>
            </div>

            {/* Diamonds */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <span>◆</span>
              <span className="font-mono tabular-nums">
                {(stats.diamonds + diamondsEarned).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto p-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-sky-300 hover:text-white shadow-lg transition-all active:scale-95"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Controls Row */}
      <div className="flex items-end justify-between w-full">
        {/* Left Side: Directional Buttons (Left & Right) */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Move Left */}
          <button
            onPointerDown={onLeftDown}
            onPointerUp={onLeftUp}
            onPointerLeave={onLeftUp}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-950/90 to-[#020617]/95 border-2 border-blue-800/80 active:border-sky-400 active:bg-blue-900 flex flex-col items-center justify-center text-sky-300 shadow-[0_0_15px_rgba(30,58,138,0.4)] active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-8 h-8" />
            <span className="text-[9px] text-slate-400 font-mono -mt-1">A / ←</span>
          </button>

          {/* Move Right */}
          <button
            onPointerDown={onRightDown}
            onPointerUp={onRightUp}
            onPointerLeave={onRightUp}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-950/90 to-[#020617]/95 border-2 border-blue-800/80 active:border-sky-400 active:bg-blue-900 flex flex-col items-center justify-center text-sky-300 shadow-[0_0_15px_rgba(30,58,138,0.4)] active:scale-95 transition-transform"
          >
            <ArrowRight className="w-8 h-8" />
            <span className="text-[9px] text-slate-400 font-mono -mt-1">D / →</span>
          </button>
        </div>

        {/* Right Side: Ninja Action Buttons (Signature Ninja Arashi 2 layout) */}
        <div className="pointer-events-auto flex items-end gap-3.5">
          {/* Disguise / Camouflage Skill Button */}
          <button
            onClick={onDisguise}
            disabled={player.disguiseCooldown > 0}
            className={`relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
              player.isDisguised
                ? 'bg-amber-600 border-amber-300 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
                : player.disguiseCooldown > 0
                ? 'bg-slate-900/80 border-slate-800 text-slate-600 opacity-60'
                : 'bg-gradient-to-br from-blue-950 to-indigo-950 border-blue-700/80 text-amber-300 hover:border-amber-400 active:scale-95'
            }`}
            title="Disguise as Barrel / Lantern (S / Down)"
          >
            <ShieldAlert className="w-6 h-6" />
            <span className="text-[8px] text-slate-400 font-mono">S / ↓</span>
            {disguiseCooldownRatio > 0 && (
              <div
                className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-xs font-mono font-bold text-white"
              >
                {Math.ceil(player.disguiseCooldown / 60)}s
              </div>
            )}
          </button>

          {/* Shadow Dash (Hayate Dash) */}
          <button
            onClick={onDash}
            disabled={player.dashCooldown > 0}
            className={`relative w-15 h-15 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
              player.isDashing
                ? 'bg-sky-500 border-sky-300 text-white shadow-[0_0_20px_rgba(56,189,248,0.8)]'
                : player.dashCooldown > 0
                ? 'bg-slate-900/80 border-slate-800 text-slate-600 opacity-60'
                : 'bg-gradient-to-br from-blue-900 to-sky-950 border-sky-600 text-sky-200 hover:border-sky-400 active:scale-95 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
            }`}
            title="Shadow Dash (L / C)"
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-[8px] text-slate-400 font-mono">L / C</span>
            {dashCooldownRatio > 0 && (
              <div
                className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-xs font-mono font-bold text-sky-300"
              >
                {Math.ceil(player.dashCooldown / 60)}s
              </div>
            )}
          </button>

          {/* Shuriken Throw */}
          <button
            onClick={onShuriken}
            disabled={player.shurikensRemaining <= 0}
            className={`relative w-15 h-15 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
              player.shurikensRemaining > 0
                ? 'bg-gradient-to-br from-blue-900 to-[#020617] border-blue-600 text-sky-300 hover:border-sky-400 active:scale-95'
                : 'bg-slate-900/80 border-slate-800 text-slate-600 opacity-60'
            }`}
            title="Throw Shuriken (K / X)"
          >
            <span className="text-xl">❖</span>
            <span className="text-[8px] text-slate-400 font-mono">K / X</span>
            {/* Shuriken remaining count badge */}
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-sky-500 text-[10px] font-bold text-white shadow">
              {player.shurikensRemaining}
            </span>
          </button>

          {/* Katana Melee Slash (Primary Attack) */}
          <button
            onClick={onSlash}
            className="w-17 h-17 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-700 border-2 border-sky-300 active:bg-sky-500 flex flex-col items-center justify-center text-white shadow-[0_0_20px_rgba(56,189,248,0.5)] active:scale-95 transition-transform"
            title="Katana Slash (J / Z)"
          >
            <Sword className="w-8 h-8" />
            <span className="text-[9px] text-sky-200 font-mono -mt-1">J / Z</span>
          </button>

          {/* Jump & Double Jump */}
          <button
            onClick={onJump}
            className="w-17 h-17 rounded-2xl bg-gradient-to-br from-blue-950 to-[#020617] border-2 border-blue-500 active:border-sky-300 active:bg-blue-900 flex flex-col items-center justify-center text-sky-200 shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95 transition-transform"
            title="Jump / Double Jump (W / Space / Up)"
          >
            <ArrowUp className="w-8 h-8" />
            <span className="text-[9px] text-slate-400 font-mono -mt-1">Space / W</span>
            {/* Double Jump Indicator */}
            {player.jumpsLeft > 0 && !player.isGrounded && (
              <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-blue-500 text-[9px] font-bold text-white shadow">
                2x
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
