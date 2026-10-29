import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, GameStats, GameTheme, InputState, CAR_COLORS } from './types';
import { StartMenu } from './components/StartMenu';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { TouchControls } from './components/TouchControls';
import { soundManager } from './audio/soundManager';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [highScore, setHighScore] = useState<number>(0);
  const [selectedColorId, setSelectedColorId] = useState<string>(CAR_COLORS[0].id);
  const [selectedTheme, setSelectedTheme] = useState<GameTheme>('sunset');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [nearMissAlert, setNearMissAlert] = useState<{ text: string; id: number } | null>(null);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    nearMisses: 0,
    currentSpeed: 0,
    maxSpeedReached: 0,
    nitro: 50,
    multiplier: 1,
  });

  // Keep a ref to current gameState to avoid stale closures in event listeners
  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Mount Three.js Game Engine once
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onGameOver: (finalStats) => {
        setStats(finalStats);
        setGameState('GAMEOVER');
        if (finalStats.score > engine.getHighScore()) {
          setHighScore(finalStats.score);
        }
      },
      onNearMiss: (bonus, combo) => {
        setNearMissAlert({
          text: `NEAR MISS! +${bonus} (${combo}x)`,
          id: Date.now(),
        });
      },
      onCoinCollect: () => {
        // State updated via onStatsUpdate
      },
      onNitroPickup: () => {
        // State updated via onStatsUpdate
      },
    });

    engineRef.current = engine;
    setHighScore(engine.getHighScore());

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Clear near miss notification after 1.2s
  useEffect(() => {
    if (!nearMissAlert) return;
    const timer = setTimeout(() => {
      setNearMissAlert(null);
    }, 1200);
    return () => clearTimeout(timer);
  }, [nearMissAlert]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll on arrow keys & space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const currentState = gameStateRef.current;

      // Handle space / enter in Menu or GameOver states
      if (e.key === ' ' || e.key === 'Enter') {
        if (currentState === 'MENU') {
          handleStartRace();
          return;
        } else if (currentState === 'GAMEOVER') {
          handleRestartRace();
          return;
        }
      }

      // Handle Esc for pause
      if (e.key === 'Escape') {
        if (currentState === 'PLAYING') {
          handlePause();
        } else if (currentState === 'PAUSED') {
          handleResume();
        }
        return;
      }

      const engine = engineRef.current;
      if (!engine || currentState !== 'PLAYING') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          engine.inputs.steerLeft = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          engine.inputs.steerRight = true;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          engine.inputs.accelerate = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          engine.inputs.brake = true;
          break;
        case ' ':
          engine.inputs.nitro = true;
          break;
        case 'h':
        case 'H':
          engine.inputs.horn = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          engine.inputs.steerLeft = false;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          engine.inputs.steerRight = false;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          engine.inputs.accelerate = false;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          engine.inputs.brake = false;
          break;
        case ' ':
          engine.inputs.nitro = false;
          break;
        case 'h':
        case 'H':
          engine.inputs.horn = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleStartRace = () => {
    if (!engineRef.current) return;
    setGameState('PLAYING');
    engineRef.current.setGameState('PLAYING');
  };

  const handleRestartRace = () => {
    if (!engineRef.current) return;
    setGameState('PLAYING');
    engineRef.current.setGameState('PLAYING');
    setHighScore(engineRef.current.getHighScore());
  };

  const handlePause = () => {
    if (!engineRef.current) return;
    setGameState('PAUSED');
    engineRef.current.setGameState('PAUSED');
  };

  const handleResume = () => {
    if (!engineRef.current) return;
    setGameState('PLAYING');
    engineRef.current.setGameState('PLAYING');
  };

  const handleReturnToMenu = () => {
    if (!engineRef.current) return;
    setGameState('MENU');
    engineRef.current.setGameState('MENU');
    setHighScore(engineRef.current.getHighScore());
  };

  const handleSelectColor = (colorId: string) => {
    setSelectedColorId(colorId);
    engineRef.current?.setCarColor(colorId);
  };

  const handleSelectTheme = (theme: GameTheme) => {
    setSelectedTheme(theme);
    engineRef.current?.setTheme(theme);
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleTouchInput = (key: keyof InputState, value: boolean) => {
    if (engineRef.current) {
      engineRef.current.inputs[key] = value;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Title Screen / Start Menu */}
      {gameState === 'MENU' && (
        <StartMenu
          onStart={handleStartRace}
          highScore={highScore}
          selectedColorId={selectedColorId}
          onSelectColor={handleSelectColor}
          selectedTheme={selectedTheme}
          onSelectTheme={handleSelectTheme}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active In-Game HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER') && (
        <GameHUD
          stats={stats}
          highScore={highScore}
          nearMissNotification={nearMissAlert}
          onPause={handlePause}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onHorn={() => {
            if (engineRef.current) engineRef.current.inputs.horn = true;
            setTimeout(() => {
              if (engineRef.current) engineRef.current.inputs.horn = false;
            }, 200);
          }}
        />
      )}

      {/* On-Screen Touch Controls for Mobile/Tablet */}
      {gameState === 'PLAYING' && (
        <TouchControls onUpdateInput={handleTouchInput} />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartRace}
          onMenu={handleReturnToMenu}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          highScore={highScore}
          onRestart={handleRestartRace}
          onMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
}
