import React from 'react';
import { CAR_COLORS, GameTheme } from '../types';
import { soundManager } from '../audio/soundManager';
import { Play, Trophy, Volume2, VolumeX, Sparkles, Sun, Moon, Sunset } from 'lucide-react';

interface StartMenuProps {
  onStart: () => void;
  highScore: number;
  selectedColorId: string;
  onSelectColor: (colorId: string) => void;
  selectedTheme: GameTheme;
  onSelectTheme: (theme: GameTheme) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  onStart,
  highScore,
  selectedColorId,
  onSelectColor,
  selectedTheme,
  onSelectTheme,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* High score badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 shadow-xl backdrop-blur-none">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Record:</span>
          <span className="text-sm font-bold font-mono text-amber-300 tabular-nums">
            {highScore.toLocaleString()} PTS
          </span>
        </div>

        {/* Audio mute toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition cursor-pointer shadow-xl"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Center: Bespoke Inline SVG Title Lockup with 30-40% Negative Space */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto text-center max-w-xl mx-auto">
        {/* Bespoke Racing SVG Title Lockup */}
        <div className="relative mb-6">
          <svg
            className="w-72 sm:w-96 h-28 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            viewBox="0 0 400 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="turboGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="driftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Speed Chevrons */}
            <path d="M20 70 L50 25 L40 25 L10 70 Z" fill="#f59e0b" opacity="0.6" />
            <path d="M40 70 L70 25 L60 25 L30 70 Z" fill="#ef4444" opacity="0.8" />

            {/* TURBO Text */}
            <text
              x="65"
              y="58"
              fill="url(#turboGrad)"
              fontSize="52"
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="2"
              fontFamily="system-ui, sans-serif"
            >
              TURBO
            </text>

            {/* DRIFT Text */}
            <text
              x="245"
              y="58"
              fill="url(#driftGrad)"
              fontSize="52"
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="2"
              fontFamily="system-ui, sans-serif"
            >
              RUSH
            </text>

            {/* Highway Subtitle Stripe */}
            <rect x="65" y="74" width="315" height="4" rx="2" fill="#e2e8f0" opacity="0.3" />
            <rect x="180" y="74" width="90" height="4" rx="2" fill="#38bdf8" />

            <text
              x="222"
              y="98"
              fill="#94a3b8"
              fontSize="14"
              fontWeight="700"
              letterSpacing="6"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
            >
              HIGHWAY SPEED RACER
            </text>
          </svg>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => {
            soundManager.playButton();
            onStart();
          }}
          className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-black text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:shadow-[0_0_45px_rgba(244,63,94,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
        >
          <Play className="w-6 h-6 fill-white transition-transform group-hover:translate-x-0.5" />
          <span>START RACE</span>
          <span className="ml-1 text-2xs px-2 py-0.5 rounded bg-black/25 text-white/80 border border-white/10 font-mono">
            SPACE / ENTER
          </span>
        </button>

        {/* Customization Drawer: Color & Theme */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 shadow-2xl">
          {/* Car Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Car Paint:
            </span>
            <div className="flex items-center gap-1.5">
              {CAR_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    soundManager.playButton();
                    onSelectColor(c.id);
                  }}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    selectedColorId === c.id ? 'scale-125 border-white ring-2 ring-white/40' : 'border-zinc-700 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.bodyColor }}
                />
              ))}
            </div>
          </div>

          <div className="w-px h-5 bg-zinc-800" />

          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold text-zinc-400 uppercase tracking-wider">Atmosphere:</span>
            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
              <button
                onClick={() => {
                  soundManager.playButton();
                  onSelectTheme('sunset');
                }}
                title="Sunset Horizon"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  selectedTheme === 'sunset' ? 'bg-amber-600/40 text-amber-300 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sunset className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  soundManager.playButton();
                  onSelectTheme('neon');
                }}
                title="Cyber Neon"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  selectedTheme === 'neon' ? 'bg-purple-600/40 text-purple-300 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  soundManager.playButton();
                  onSelectTheme('day');
                }}
                title="Sunny Highway"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  selectedTheme === 'day' ? 'bg-sky-600/40 text-sky-300 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="flex items-center justify-center pointer-events-auto">
        <div className="px-5 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400 font-medium tracking-wide shadow-md flex items-center gap-3">
          <span>
            <strong className="text-zinc-200">WASD / ◄►</strong> Steer & Gas
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            <strong className="text-zinc-200">Space</strong> Nitro Boost
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            <strong className="text-zinc-200">S / ▼</strong> Brake
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            <strong className="text-zinc-200">H</strong> Horn
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            <strong className="text-zinc-200">Esc</strong> Pause
          </span>
        </div>
      </div>
    </div>
  );
};
