import React from 'react';
import { soundManager } from '../audio/soundManager';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMenu,
}) => {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 select-none pointer-events-auto">
      <div className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-xl font-black text-white tracking-wider uppercase mb-1">
          GAME PAUSED
        </h3>
        <p className="text-xs text-zinc-400 mb-6">Take a breather, racer.</p>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              soundManager.playButton();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm tracking-wide shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume (Esc)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onRestart();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs tracking-wide border border-zinc-800 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Race</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onMenu();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs tracking-wide border border-zinc-800 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
