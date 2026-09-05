import React from 'react';
import { Award, Flame, Home, RotateCcw, Swords } from 'lucide-react';
import { GameMode, Team } from '../types/game';

interface MatchEndModalProps {
  winner: Team | 'draw';
  blueScore: number;
  redScore: number;
  gameMode: GameMode;
  onPlayAgain: () => void;
  onStartExtraTime?: () => void;
  onStartPenalties?: () => void;
  onMainMenu: () => void;
  tournamentStage?: string;
  isTournament?: boolean;
  onContinueTournament?: () => void;
}

export const MatchEndModal: React.FC<MatchEndModalProps> = ({
  winner,
  blueScore,
  redScore,
  gameMode,
  onPlayAgain,
  onStartExtraTime,
  onStartPenalties,
  onMainMenu,
  isTournament,
  onContinueTournament,
}) => {
  const isDraw = winner === 'draw';
  const playerWon = winner === 'blue';

  return (
    <div
      id="match-end-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/85 backdrop-blur-md p-4 select-none"
    >
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-700/60 rounded-2xl shadow-2xl p-6 text-center text-white">
        {/* Top Trophy / Badge Icon */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-slate-900 border border-amber-400/50 flex items-center justify-center shadow-lg">
          {isDraw ? (
            <Swords className="text-amber-400" size={28} />
          ) : (
            <Award className="text-amber-400" size={30} />
          )}
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-1.5">
          Fim da Partida
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1">
          {isDraw
            ? 'EMPATE NO TEMPO REGULAR'
            : winner === 'blue'
            ? 'VITÓRIA DO TIME AZUL'
            : 'VITÓRIA DO TIME VERMELHO'}
        </h2>

        {/* Subtitle */}
        <p className="text-slate-400 text-xs mb-4 font-mono">
          {isDraw
            ? 'Partida terminou empatada. Escolha o desempate:'
            : gameMode === 'cpu'
            ? playerWon
              ? 'Excelente desempenho tático em campo!'
              : 'Boa partida! Aprimore suas táticas e tente de novo.'
            : 'Grande duelo até o apito final!'}
        </p>

        {/* Final Scoreboard Card */}
        <div className="bg-[#0f172a] border border-slate-700/60 rounded-xl p-3 mb-5 flex items-center justify-around shadow-inner">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <span className="text-[11px] font-bold text-blue-400 uppercase font-mono">AZUL</span>
            </div>
            <span className="text-3xl font-black text-white font-mono">{blueScore}</span>
          </div>

          <span className="text-xl font-black text-slate-600 font-mono">×</span>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-red-400 uppercase font-mono">VERMELHO</span>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            </div>
            <span className="text-3xl font-black text-white font-mono">{redScore}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* If tied and regular match, offer Extra Time and Penalties */}
          {isDraw && onStartExtraTime && onStartPenalties && (
            <>
              <button
                id="btn-start-golden-goal"
                type="button"
                onClick={onStartExtraTime}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] font-bold text-xs tracking-wider uppercase text-white flex items-center justify-center gap-2 shadow-md border border-amber-400/40 transition-all cursor-pointer"
              >
                <Flame size={16} />
                <span>Prorrogação (Gol de Ouro)</span>
              </button>

              <button
                id="btn-start-penalties"
                type="button"
                onClick={onStartPenalties}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.99] font-bold text-xs tracking-wider uppercase text-white flex items-center justify-center gap-2 shadow-md border border-purple-400/40 transition-all cursor-pointer"
              >
                <Swords size={16} />
                <span>Disputa de Pênaltis</span>
              </button>
            </>
          )}

          {/* Tournament advance */}
          {isTournament && onContinueTournament && (
            <button
              id="btn-tournament-continue"
              type="button"
              onClick={onContinueTournament}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] font-bold text-xs tracking-wider uppercase text-white flex items-center justify-center gap-2 shadow-md border border-emerald-400/40 transition-all cursor-pointer"
            >
              <span>Avançar no Torneio</span>
            </button>
          )}

          <button
            id="btn-play-again"
            type="button"
            onClick={onPlayAgain}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] font-bold text-xs tracking-wider uppercase text-white flex items-center justify-center gap-2 shadow-md border border-blue-400/40 transition-all cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>Jogar Novamente</span>
          </button>

          <button
            id="btn-return-main-menu"
            type="button"
            onClick={onMainMenu}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] font-semibold text-xs tracking-wider uppercase text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home size={15} />
            <span>Menu Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
