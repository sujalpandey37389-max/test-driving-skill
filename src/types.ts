export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameStats {
  score: number;
  distance: number; // in meters
  coins: number;
  nearMisses: number;
  currentSpeed: number; // in km/h
  maxSpeedReached: number;
  nitro: number; // 0 to 100
  multiplier: number;
}

export type GameTheme = 'sunset' | 'neon' | 'day';

export interface CarColorPreset {
  id: string;
  name: string;
  bodyColor: string;
  accentColor: string;
  glowColor: string;
}

export const CAR_COLORS: CarColorPreset[] = [
  { id: 'crimson', name: 'Inferno Red', bodyColor: '#dc2626', accentColor: '#ef4444', glowColor: '#f87171' },
  { id: 'cyber', name: 'Cyber Gold', bodyColor: '#eab308', accentColor: '#facc15', glowColor: '#fef08a' },
  { id: 'cyan', name: 'Electric Cyan', bodyColor: '#06b6d4', accentColor: '#22d3ee', glowColor: '#67e8f9' },
  { id: 'emerald', name: 'Acid Emerald', bodyColor: '#10b981', accentColor: '#34d399', glowColor: '#a7f3d0' },
  { id: 'violet', name: 'Neon Purple', bodyColor: '#8b5cf6', accentColor: '#a78bfa', glowColor: '#c4b5fd' },
  { id: 'stealth', name: 'Midnight Onyx', bodyColor: '#18181b', accentColor: '#27272a', glowColor: '#71717a' },
];

export interface InputState {
  steerLeft: boolean;
  steerRight: boolean;
  accelerate: boolean;
  brake: boolean;
  nitro: boolean;
  horn: boolean;
}
