import React from 'react';
import { Award, Play, RotateCcw, Trophy, X } from 'lucide-react';
import { TournamentData } from '../types/game';

interface TournamentModalProps {
  tournament: TournamentData;
  onPlayNextMatch: () => void;
  onRestartTournament: () => void;
  onClose: () => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  tournament,
  onPlayNextMatch,
  onRestartTournament,
  onClose,
}) => {
  const isChampion = tournament.stage === 'CHAMPION';
  const isEliminated = tournament.stage === 'ELIMINATED';

  const getStageTitle = () => {
    switch (tournament.stage) {
      case 'QUARTERS':
        return 'Quartas de Final';
      case 'SEMIS':
        return 'Semifinal';
      case 'FINAL':
        return 'Grande Final';
      case 'CHAMPION':
        return '🏆 Campeão do Torneio!';
      case 'ELIMINATED':
        return 'Eliminado do Torneio';
    }
  };

  return (
    <div
      id="tournament-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/85 backdrop-blur-md p-3 select-none overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-[#1e293b] border border-slate-700/60 rounded-2xl shadow-2xl p-4 sm:p-6 text-white my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/40 flex items-center justify-center">
              <Trophy className="text-amber-400" size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
                Copa Regional de Botão
              </h2>
              <span className="text-[10px] text-amber-400 font-bold uppercase font-mono tracking-wider">
                Fase Atual: {getStageTitle()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Champion celebration banner */}
        {isChampion && (
          <div className="my-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/60 text-center animate-bounce">
            <Trophy className="mx-auto text-amber-300 mb-1" size={32} />
            <h3 className="text-lg font-black text-amber-200 uppercase tracking-tight font-mono">
              PARABÉNS! {tournament.playerTeam} É O GRANDE CAMPEÃO!
            </h3>
            <p className="text-xs text-amber-100/90 font-medium mt-0.5 font-mono">
              Você conquistou a taça mais cobiçada da temporada!
            </p>
          </div>
        )}

        {/* Eliminated banner */}
        {isEliminated && (
          <div className="my-3 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-center">
            <h3 className="text-base font-black text-rose-300 uppercase font-mono">
              Sua equipe foi eliminada!
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 font-mono">
              Reinicie o campeonato para tentar alcançar a glória novamente.
            </p>
          </div>
        )}

        {/* Visual Bracket */}
        <div className="my-3.5 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Quarters column */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center bg-[#0f172a] py-1 rounded-lg border border-slate-800 font-mono">
              Quartas de Final
            </h4>
            {tournament.bracket.quarters.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded-lg border text-xs ${
                  m.team1 === tournament.playerTeam || m.team2 === tournament.playerTeam
                    ? 'bg-blue-950/50 border-blue-500/80 shadow-sm'
                    : 'bg-[#0f172a] border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center py-0.5 font-semibold text-[11px]">
                  <span className={m.team1 === tournament.playerTeam ? 'text-blue-300 font-bold' : ''}>
                    {m.team1}
                  </span>
                  <span className="font-mono font-bold text-white ml-2">
                    {m.score1 !== undefined ? m.score1 : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 font-semibold border-t border-slate-800/80 mt-0.5 pt-0.5 text-[11px]">
                  <span className={m.team2 === tournament.playerTeam ? 'text-blue-300 font-bold' : ''}>
                    {m.team2}
                  </span>
                  <span className="font-mono font-bold text-white ml-2">
                    {m.score2 !== undefined ? m.score2 : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Semis column */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center bg-[#0f172a] py-1 rounded-lg border border-slate-800 font-mono">
              Semifinais
            </h4>
            {tournament.bracket.semis.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded-lg border text-xs my-auto ${
                  m.team1 === tournament.playerTeam || m.team2 === tournament.playerTeam
                    ? 'bg-blue-950/50 border-blue-500/80 shadow-sm'
                    : 'bg-[#0f172a] border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center py-0.5 font-semibold text-[11px]">
                  <span className={m.team1 === tournament.playerTeam ? 'text-blue-300 font-bold' : ''}>
                    {m.team1}
                  </span>
                  <span className="font-mono font-bold text-white ml-2">
                    {m.score1 !== undefined ? m.score1 : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 font-semibold border-t border-slate-800/80 mt-0.5 pt-0.5 text-[11px]">
                  <span className={m.team2 === tournament.playerTeam ? 'text-blue-300 font-bold' : ''}>
                    {m.team2}
                  </span>
                  <span className="font-mono font-bold text-white ml-2">
                    {m.score2 !== undefined ? m.score2 : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Final column */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider text-center bg-[#0f172a] py-1 rounded-lg border border-slate-800 font-mono flex items-center justify-center gap-1">
              <Award size={11} />
              Grande Final
            </h4>
            <div
              className={`p-3 rounded-lg border text-xs my-auto ${
                tournament.bracket.final.team1 === tournament.playerTeam ||
                tournament.bracket.final.team2 === tournament.playerTeam
                  ? 'bg-amber-950/40 border-amber-500/80 shadow-sm'
                  : 'bg-[#0f172a] border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex justify-between items-center py-0.5 font-semibold text-[11px]">
                <span className={tournament.bracket.final.team1 === tournament.playerTeam ? 'text-amber-300 font-bold' : ''}>
                  {tournament.bracket.final.team1}
                </span>
                <span className="font-mono font-bold text-white ml-2">
                  {tournament.bracket.final.score1 !== undefined ? tournament.bracket.final.score1 : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 font-semibold border-t border-slate-800/80 mt-0.5 pt-0.5 text-[11px]">
                <span className={tournament.bracket.final.team2 === tournament.playerTeam ? 'text-amber-300 font-bold' : ''}>
                  {tournament.bracket.final.team2}
                </span>
                <span className="font-mono font-bold text-white ml-2">
                  {tournament.bracket.final.score2 !== undefined ? tournament.bracket.final.score2 : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-slate-700/60">
          {!isChampion && !isEliminated && (
            <button
              type="button"
              onClick={onPlayNextMatch}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs tracking-wider uppercase text-white flex items-center justify-center gap-2 shadow-md border border-blue-400/40 transition-all cursor-pointer"
            >
              <Play size={16} className="fill-white" />
              <span>Jogar ({getStageTitle()})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRestartTournament}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs tracking-wider uppercase text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Novo Torneio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
