import React from 'react';
import { GameStats } from '../types';
import { soundManager } from '../audio/soundManager';
import { Volume2, VolumeX, Pause, Zap, Trophy, Coins, Compass } from 'lucide-react';

interface GameHUDProps {
  stats: GameStats;
  highScore: number;
  nearMissNotification: { text: string; id: number } | null;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onHorn: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  highScore,
  nearMissNotification,
  onPause,
  isMuted,
  onToggleMute,
  onHorn,
}) => {
  // Speed percentage (0 to 1) for speedometer arc/meter
  const speedRatio = Math.min(Math.max((stats.currentSpeed - 80) / 180, 0), 1);
  const isHighSpeed = stats.currentSpeed >= 180;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Bar: Perimeter status cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Score & Distance cluster */}
        <div className="flex flex-col gap-1.5 bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 sm:px-4 sm:py-3 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>High Score</span>
            <span className="font-mono text-white tabular-nums text-sm font-bold ml-auto">
              {highScore.toLocaleString()}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Score</span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
              {stats.score.toLocaleString()}
            </span>
            {stats.multiplier > 1 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-bounce">
                {stats.multiplier}x
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400 border-t border-zinc-800/80 pt-1.5">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-zinc-200 tabular-nums">
                {Math.round(stats.distance).toLocaleString()} m
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-mono text-zinc-200 tabular-nums">{stats.coins}</span>
            </div>
          </div>
        </div>

        {/* Center: Near Miss Pop Notification */}
        {nearMissNotification && (
          <div
            key={nearMissNotification.id}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-sm sm:text-base tracking-wide shadow-xl animate-bounce border border-amber-300"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{nearMissNotification.text}</span>
          </div>
        )}

        {/* Right: Quick actions (Mute, Horn, Pause) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              soundManager.startHorn();
              setTimeout(() => soundManager.stopHorn(), 180);
              onHorn();
            }}
            title="Honk Horn (H)"
            aria-label="Honk Horn"
            className="w-10 h-10 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition cursor-pointer shadow-md text-xs font-bold"
          >
            📢
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label="Toggle Audio Mute"
            className="w-10 h-10 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition cursor-pointer shadow-md"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            onClick={onPause}
            title="Pause Game (Esc)"
            aria-label="Pause Game"
            className="w-10 h-10 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition cursor-pointer shadow-md"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Speedometer & Nitro Gauge */}
      <div className="flex items-end justify-between w-full">
        {/* Nitro Booster Bar */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 shadow-lg pointer-events-auto min-w-[140px] sm:min-w-[190px]">
          <div className="flex items-center justify-between text-xs font-bold text-sky-400 mb-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-sky-400" />
              NITRO BOOST
            </span>
            <span className="font-mono text-zinc-300 text-2xs">SPACE</span>
          </div>
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/60">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                stats.nitro > 25
                  ? 'bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.round(stats.nitro)}%` }}
            />
          </div>
        </div>

        {/* Speedometer Cluster */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 sm:px-5 sm:py-3 shadow-lg pointer-events-auto text-right">
          <div className="text-2xs font-bold tracking-widest text-zinc-400 uppercase">SPEED</div>
          <div className="flex items-baseline justify-end gap-1.5">
            <span
              className={`text-3xl sm:text-4xl font-black font-mono tabular-nums tracking-tighter ${
                isHighSpeed ? 'text-amber-400' : 'text-white'
              }`}
            >
              {stats.currentSpeed}
            </span>
            <span className="text-xs font-bold text-zinc-400">KM/H</span>
          </div>

          {/* Speed meter bar */}
          <div className="w-28 sm:w-36 h-2 bg-zinc-800 rounded-full overflow-hidden mt-1 ml-auto">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
              style={{ width: `${Math.round(speedRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
