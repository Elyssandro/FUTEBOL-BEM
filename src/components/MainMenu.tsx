import React, { useState } from 'react';
import { Bot, Play, Settings, Sparkles, Swords, Target, Trophy, Users } from 'lucide-react';
import { AIDifficulty, GameMode } from '../types/game';

interface MainMenuProps {
  onStartMatch: (mode: GameMode, difficulty?: AIDifficulty) => void;
  onOpenTournament: () => void;
  onOpenSettings: () => void;
  onStartPenalties: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartMatch,
  onOpenTournament,
  onOpenSettings,
  onStartPenalties,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('normal');
  const [showCpuOptions, setShowCpuOptions] = useState(false);

  return (
    <div
      id="main-menu-container"
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#0f172a]/95 backdrop-blur-md p-4 select-none overflow-y-auto"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="w-full max-w-md my-auto flex flex-col items-center text-center">
        {/* High Density Logo / Badge */}
        <div className="relative mb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1e293b] p-0.5 shadow-xl shadow-blue-950/50 flex items-center justify-center border border-slate-700">
            <span className="text-3xl sm:text-4xl">⚽</span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-lg border border-blue-400 shadow-md">
            <Sparkles size={13} />
          </div>
        </div>

        {/* Game Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold mb-1.5">
          Simulador 2D • Mesa & Campo
        </div>
        <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white drop-shadow-md">
          Futebol de Botão
        </h1>
        <p className="text-xs font-mono text-slate-400 tracking-wider uppercase mb-5">
          Física Realista • Tática • Arcade
        </p>

        {/* Menu Buttons List */}
        <div className="w-full space-y-2">
          {/* VS CPU */}
          {!showCpuOptions ? (
            <button
              id="btn-menu-vscpu"
              type="button"
              onClick={() => setShowCpuOptions(true)}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm tracking-wide flex items-center justify-between shadow-lg shadow-blue-900/30 border border-blue-400/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white border border-blue-400/30">
                  <Bot size={18} />
                </div>
                <div className="text-left">
                  <div className="leading-tight font-black uppercase text-xs sm:text-sm">JOGADOR VS CPU</div>
                  <div className="text-[10px] font-normal text-blue-100 font-mono">IA inteligente com 3 níveis</div>
                </div>
              </div>
              <Play size={16} className="fill-white group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="bg-[#1e293b] border border-blue-500/50 rounded-xl p-3 shadow-xl space-y-2 animate-fadeIn">
              <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center justify-between">
                <span>Dificuldade da CPU</span>
                <button
                  type="button"
                  onClick={() => setShowCpuOptions(false)}
                  className="text-slate-400 hover:text-white text-[10px] uppercase font-mono cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(['easy', 'normal', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                      selectedDifficulty === diff
                        ? 'bg-blue-600 text-white shadow border border-blue-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {diff === 'easy' ? 'Fácil' : diff === 'normal' ? 'Normal' : 'Difícil'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onStartMatch('cpu', selectedDifficulty)}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-black text-xs uppercase text-white shadow-md cursor-pointer mt-1 tracking-wider"
              >
                Iniciar Partida
              </button>
            </div>
          )}

          {/* 2 JOGADORES (Pass & Play) */}
          <button
            id="btn-menu-2players"
            type="button"
            onClick={() => onStartMatch('2players')}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#1e293b] hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm tracking-wide flex items-center justify-between shadow-md border border-slate-700/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Users size={18} />
              </div>
              <div className="text-left">
                <div className="leading-tight font-black uppercase text-xs sm:text-sm">2 JOGADORES (LOCAL)</div>
                <div className="text-[10px] font-normal text-slate-400 font-mono">Duelo tático no mesmo aparelho</div>
              </div>
            </div>
            <Play size={16} className="fill-slate-400 group-hover:translate-x-1 group-hover:fill-white transition-transform" />
          </button>

          {/* TORNEIO */}
          <button
            id="btn-menu-tournament"
            type="button"
            onClick={onOpenTournament}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#1e293b] hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm tracking-wide flex items-center justify-between shadow-md border border-slate-700/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Trophy size={18} />
              </div>
              <div className="text-left">
                <div className="leading-tight font-black uppercase text-xs sm:text-sm">COPA & TORNEIO</div>
                <div className="text-[10px] font-normal text-slate-400 font-mono">Quartas, Semifinal e Grande Final</div>
              </div>
            </div>
            <Play size={16} className="fill-slate-400 group-hover:translate-x-1 group-hover:fill-white transition-transform" />
          </button>

          {/* DISPUTA DE PÊNALTIS */}
          <button
            id="btn-menu-penalties"
            type="button"
            onClick={onStartPenalties}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#1e293b] hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm tracking-wide flex items-center justify-between shadow-md border border-slate-700/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-900/40 border border-rose-500/40 flex items-center justify-center text-rose-300">
                <Swords size={18} />
              </div>
              <div className="text-left">
                <div className="leading-tight font-black uppercase text-xs sm:text-sm">DISPUTA DE PÊNALTIS</div>
                <div className="text-[10px] font-normal text-slate-400 font-mono">5 cobranças diretas e alternadas</div>
              </div>
            </div>
            <Play size={16} className="fill-slate-400 group-hover:translate-x-1 group-hover:fill-white transition-transform" />
          </button>

          {/* MODO TREINO */}
          <button
            id="btn-menu-practice"
            type="button"
            onClick={() => onStartMatch('practice')}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#1e293b] hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm tracking-wide flex items-center justify-between shadow-md border border-slate-700/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                <Target size={18} />
              </div>
              <div className="text-left">
                <div className="leading-tight font-black uppercase text-xs sm:text-sm">MODO TREINO</div>
                <div className="text-[10px] font-normal text-slate-400 font-mono">Treine rebotes, tabelas e ângulos</div>
              </div>
            </div>
            <Play size={16} className="fill-slate-400 group-hover:translate-x-1 group-hover:fill-white transition-transform" />
          </button>

          {/* CONFIGURAÇÕES */}
          <button
            id="btn-menu-settings"
            type="button"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:scale-[0.99] text-slate-300 hover:text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer"
          >
            <Settings size={15} />
            <span>Configurações & Estatísticas</span>
          </button>
        </div>

        {/* Footer info */}
        <p className="mt-5 text-[10px] text-slate-500 font-mono">
          Arraste o botão para trás e solte para disparar
        </p>
      </div>
    </div>
  );
};
