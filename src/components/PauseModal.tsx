import React from 'react';
import { Home, Play, RotateCcw, Settings } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div
      id="pause-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-md p-4 select-none"
    >
      <div className="w-full max-w-sm bg-[#1e293b] border border-slate-700/60 rounded-2xl shadow-2xl p-6 text-center text-white">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-3">
          Partida Pausada
        </div>
        <h2 className="text-xl font-black tracking-tight text-white uppercase mb-5">
          Menu de Pausa
        </h2>

        <div className="flex flex-col gap-2.5">
          <button
            id="btn-pause-continue"
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 border border-blue-400/40 transition-all cursor-pointer"
          >
            <Play size={17} className="fill-white" />
            <span className="uppercase">Continuar Jogo</span>
          </button>

          <button
            id="btn-pause-restart"
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] font-semibold text-xs tracking-wide text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer uppercase"
          >
            <RotateCcw size={15} />
            <span>Reiniciar Partida</span>
          </button>

          <button
            id="btn-pause-settings"
            type="button"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] font-semibold text-xs tracking-wide text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer uppercase"
          >
            <Settings size={15} />
            <span>Configurações</span>
          </button>

          <button
            id="btn-pause-menu"
            type="button"
            onClick={onMainMenu}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-rose-950/60 active:scale-[0.99] font-semibold text-xs tracking-wide text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-800/60 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 uppercase"
          >
            <Home size={15} />
            <span>Menu Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
