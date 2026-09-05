import React from 'react';
import { Home, Play, RotateCcw } from 'lucide-react';

interface TrainingControlsProps {
  onResetBall: () => void;
  onResetTeams: () => void;
  onExitPractice: () => void;
}

export const TrainingControls: React.FC<TrainingControlsProps> = ({
  onResetBall,
  onResetTeams,
  onExitPractice,
}) => {
  return (
    <div
      id="training-controls-bar"
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-auto select-none"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="bg-[#1e293b]/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/50 text-[10px] text-emerald-300 font-mono font-bold shadow-md text-center uppercase tracking-wider">
        Modo Treino Livre • Toque e chute com qualquer botão
      </div>

      <div className="flex items-center gap-1.5 bg-[#0f172a]/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-xl">
        <button
          type="button"
          onClick={onResetBall}
          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 active:scale-[0.98] text-xs font-mono font-bold text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Play size={13} className="text-amber-400" />
          <span>Bola no Centro</span>
        </button>

        <button
          type="button"
          onClick={onResetTeams}
          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 active:scale-[0.98] text-xs font-mono font-bold text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw size={13} className="text-blue-400" />
          <span>Resetar Posições</span>
        </button>

        <button
          type="button"
          onClick={onExitPractice}
          className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-rose-950/60 active:scale-[0.98] text-xs font-mono font-bold text-rose-300 border border-rose-800/40 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Home size={13} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};
