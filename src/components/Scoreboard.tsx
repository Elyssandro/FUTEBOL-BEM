import React from 'react';
import { Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { AIDifficulty, GameMode, PenaltyShootoutState, Team } from '../types/game';

interface ScoreboardProps {
  blueScore: number;
  redScore: number;
  secondsRemaining: number;
  totalDurationSeconds?: number;
  currentTurn: Team;
  gameMode: GameMode;
  difficulty?: AIDifficulty;
  penaltyState: PenaltyShootoutState | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onResetPractice?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  blueScore,
  redScore,
  secondsRemaining,
  totalDurationSeconds = 180,
  currentTurn,
  gameMode,
  difficulty = 'normal',
  penaltyState,
  soundEnabled,
  onToggleSound,
  onPause,
  onResetPractice,
}) => {
  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timeDisplay =
    gameMode === 'practice'
      ? 'TREINO / ∞'
      : `${formatSecs(secondsRemaining)} / ${formatSecs(totalDurationSeconds)}`;

  const isPenaltyMode = gameMode === 'penalties' && penaltyState !== null;

  const difficultyLabel =
    difficulty === 'easy' ? 'FÁCIL' : difficulty === 'hard' ? 'DIFÍCIL' : 'NORMAL';

  return (
    <header
      id="game-scoreboard-header"
      className="w-full h-14 sm:h-16 bg-[#1e293b]/80 border-b border-slate-700/50 backdrop-blur-md px-3 sm:px-8 flex items-center justify-between z-30 select-none pointer-events-auto"
    >
      {/* Left: Match Time & Scores */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Partida
          </span>
          <span className="text-xs sm:text-sm font-mono text-emerald-400 font-bold">
            {timeDisplay}
          </span>
        </div>

        <div className="h-7 sm:h-8 w-[1px] bg-slate-700 hidden xs:block"></div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 border-2 border-blue-400 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <span className="text-[10px] font-bold text-white">AZ</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {isPenaltyMode ? penaltyState.blueScore : blueScore}
            </span>
          </div>

          <span className="text-slate-500 font-bold text-sm sm:text-base">×</span>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {isPenaltyMode ? penaltyState.redScore : redScore}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center shadow-lg shadow-red-900/40">
              <span className="text-[10px] font-bold text-white">VM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: High Density Turn Indicator Badge */}
      <div
        className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border flex items-center gap-2 shadow-sm transition-all duration-300 ${
          currentTurn === 'blue'
            ? 'bg-slate-900/90 border-blue-500/40 text-blue-100'
            : 'bg-slate-900/90 border-red-500/40 text-red-100'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${
            currentTurn === 'blue' ? 'bg-blue-500' : 'bg-red-500'
          }`}
        />
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
          Turno: {currentTurn === 'blue' ? 'Time Azul' : 'Time Vermelho'}
        </span>
      </div>

      {/* Right: Difficulty & Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {gameMode === 'cpu' && (
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Dificuldade
            </span>
            <span
              className={`text-xs font-bold font-mono ${
                difficulty === 'hard'
                  ? 'text-rose-400'
                  : difficulty === 'easy'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {difficultyLabel}
            </span>
          </div>
        )}

        <button
          id="btn-toggle-sound"
          type="button"
          onClick={onToggleSound}
          aria-label="Toggle Sound"
          className="p-2 sm:p-2.5 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {gameMode === 'practice' && onResetPractice && (
          <button
            id="btn-reset-practice"
            type="button"
            onClick={onResetPractice}
            aria-label="Reset Practice"
            className="p-2 sm:p-2.5 bg-emerald-700/60 hover:bg-emerald-600 rounded-lg border border-emerald-500/60 text-emerald-200 transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
        )}

        <button
          id="btn-pause-game"
          type="button"
          onClick={onPause}
          aria-label="Pause Game"
          className="p-2 sm:p-2.5 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-600 text-white transition-colors cursor-pointer"
        >
          <Pause size={16} />
        </button>
      </div>
    </header>
  );
};
