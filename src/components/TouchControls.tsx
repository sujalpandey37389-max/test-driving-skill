import React from 'react';
import { ArrowLeft, ArrowRight, Zap, Disc } from 'lucide-react';
import { InputState } from '../types';

interface TouchControlsProps {
  onUpdateInput: (key: keyof InputState, value: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onUpdateInput }) => {
  const handlePointerDown = (key: keyof InputState) => (e: React.PointerEvent) => {
    e.preventDefault();
    onUpdateInput(key, true);
  };

  const handlePointerUp = (key: keyof InputState) => (e: React.PointerEvent) => {
    e.preventDefault();
    onUpdateInput(key, false);
  };

  return (
    <div className="absolute inset-x-0 bottom-16 sm:bottom-20 px-4 flex justify-between items-end pointer-events-none z-10 md:hidden">
      {/* Left Steering Cluster */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onPointerDown={handlePointerDown('steerLeft')}
          onPointerUp={handlePointerUp('steerLeft')}
          onPointerLeave={handlePointerUp('steerLeft')}
          onPointerCancel={handlePointerUp('steerLeft')}
          aria-label="Steer Left"
          className="w-16 h-16 rounded-2xl bg-zinc-950/80 border border-zinc-700/80 active:bg-zinc-800 text-white flex items-center justify-center shadow-2xl active:scale-95 touch-none"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <button
          onPointerDown={handlePointerDown('steerRight')}
          onPointerUp={handlePointerUp('steerRight')}
          onPointerLeave={handlePointerUp('steerRight')}
          onPointerCancel={handlePointerUp('steerRight')}
          aria-label="Steer Right"
          className="w-16 h-16 rounded-2xl bg-zinc-950/80 border border-zinc-700/80 active:bg-zinc-800 text-white flex items-center justify-center shadow-2xl active:scale-95 touch-none"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Right Action Cluster: Brake & Nitro */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onPointerDown={handlePointerDown('brake')}
          onPointerUp={handlePointerUp('brake')}
          onPointerLeave={handlePointerUp('brake')}
          onPointerCancel={handlePointerUp('brake')}
          aria-label="Brake"
          className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-700/80 active:bg-rose-900 text-rose-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 touch-none text-2xs font-bold"
        >
          <Disc className="w-5 h-5" />
          <span>BRAKE</span>
        </button>

        <button
          onPointerDown={handlePointerDown('nitro')}
          onPointerUp={handlePointerUp('nitro')}
          onPointerLeave={handlePointerUp('nitro')}
          onPointerCancel={handlePointerUp('nitro')}
          aria-label="Nitro Boost"
          className="w-16 h-16 rounded-2xl bg-sky-950/90 border border-sky-500/80 active:bg-sky-900 text-sky-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 touch-none text-2xs font-bold"
        >
          <Zap className="w-6 h-6 fill-sky-400" />
          <span>NITRO</span>
        </button>
      </div>
    </div>
  );
};
