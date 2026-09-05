import React from 'react';
import { GameMode, Team } from '../types/game';

interface TacticalFooterProps {
  currentTurn: Team;
  activeDiscNumber?: number | string | null;
  isAiming: boolean;
  aimPower: number;
  isPhysicsRunning: boolean;
  gameMode: GameMode;
  tournamentStage?: string;
  blueScore: number;
  redScore: number;
  onPause: () => void;
  onResetBall?: () => void;
  onResetTeams?: () => void;
}

export const TacticalFooter: React.FC<TacticalFooterProps> = ({
  currentTurn,
  activeDiscNumber,
  isAiming,
  aimPower,
  isPhysicsRunning,
  gameMode,
  tournamentStage,
  blueScore,
  redScore,
  onPause,
  onResetBall,
  onResetTeams,
}) => {
  // Compute realistic dynamic tactical possession metric based on score & turns
  const totalGoals = blueScore + redScore;
  const basePossession = totalGoals === 0 ? 54 : Math.round(45 + (blueScore / (totalGoals || 1)) * 18);
  const bluePossession = Math.min(Math.max(basePossession, 35), 68);

  const totalShots = 6 + (blueScore + redScore) * 2;
  const onTarget = Math.round(totalShots * 0.65);

  const isBlue = currentTurn === 'blue';
  const powerLevel = Math.min(5, Math.ceil(aimPower * 5));

  const modeLabel =
    gameMode === 'tournament'
      ? 'Torneio Regional'
      : gameMode === 'cpu'
      ? 'Partida vs CPU'
      : gameMode === '2players'
      ? 'Duelo Local (2P)'
      : gameMode === 'penalties'
      ? 'Disputa de Pênaltis'
      : 'Modo Treino Livre';

  const subStageLabel =
    gameMode === 'tournament'
      ? tournamentStage || 'Fase Eliminatória'
      : gameMode === 'cpu'
      ? 'Arena Principal'
      : gameMode === '2players'
      ? 'Pass & Play'
      : 'Treinamento de Chutes';

  return (
    <footer
      id="tactical-footer-bar"
      className="w-full h-14 sm:h-16 bg-slate-900 border-t border-slate-800 px-3 sm:px-8 flex items-center justify-between z-20 select-none pointer-events-auto"
    >
      {/* Left: Tactical Metrics (Posse & Chutes) */}
      <div className="flex gap-2 items-center">
        <div className="px-2.5 sm:px-3.5 py-1.5 bg-slate-800/90 rounded-lg border border-slate-700/80 flex flex-col min-w-[95px] sm:min-w-[120px]">
          <span className="text-[9px] uppercase text-slate-400 font-bold tracking-tight">
            Posse de Bola
          </span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs sm:text-sm font-bold text-blue-400 font-mono">
              {bluePossession}%
            </span>
            <div className="w-10 sm:w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden ml-1 sm:ml-2">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${bluePossession}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-2.5 sm:px-3.5 py-1.5 bg-slate-800/90 rounded-lg border border-slate-700/80 flex flex-col min-w-[95px] sm:min-w-[120px] hidden xs:flex">
          <span className="text-[9px] uppercase text-slate-400 font-bold tracking-tight">
            Chutes a Gol
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
              {totalShots}
            </span>
            <span className="text-[10px] text-slate-400 italic">({onTarget} no alvo)</span>
          </div>
        </div>
      </div>

      {/* Center: Active Launcher Status */}
      <div className="flex items-center gap-2 sm:gap-3 bg-black/40 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-800">
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border transition-colors ${
            isBlue
              ? 'bg-blue-600/20 border-blue-500 text-blue-400'
              : 'bg-red-600/20 border-red-500 text-red-400'
          }`}
        >
          {activeDiscNumber || (isBlue ? 'AZ' : 'VM')}
        </div>

        <div className="flex flex-col">
          <span
            className={`text-[9px] sm:text-[10px] uppercase font-black tracking-tight ${
              isBlue ? 'text-blue-400' : 'text-red-400'
            }`}
          >
            {isPhysicsRunning
              ? 'Lance em Andamento'
              : isAiming
              ? `Potência: ${Math.round(aimPower * 100)}%`
              : 'Aguardando Lançamento'}
          </span>

          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((idx) => {
              const active = isAiming ? idx <= powerLevel : idx <= 3;
              return (
                <div
                  key={idx}
                  className={`w-4 sm:w-6 h-1.5 rounded-sm transition-colors ${
                    active
                      ? isBlue
                        ? 'bg-blue-500'
                        : 'bg-red-500'
                      : 'bg-slate-700'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Tournament / Match Info & Quick Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex flex-col items-end px-1 sm:px-2 hidden sm:flex">
          <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
            {modeLabel}
          </span>
          <span className="text-xs text-slate-300 font-medium italic truncate max-w-[140px]">
            {subStageLabel}
          </span>
        </div>

        {gameMode === 'practice' && onResetBall && onResetTeams ? (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onResetBall}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Bola Centro
            </button>
            <button
              type="button"
              onClick={onResetTeams}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Resetar
            </button>
          </div>
        ) : (
          <button
            id="btn-footer-pause"
            type="button"
            onClick={onPause}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-black uppercase text-xs sm:text-sm tracking-wider shadow-lg shadow-emerald-950/40 transition-all cursor-pointer active:scale-95"
          >
            Pausar Jogo
          </button>
        )}
      </div>
    </footer>
  );
};
