import React from 'react';
import { Award, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { GameStats, MatchSettings } from '../types/game';

interface SettingsModalProps {
  settings: MatchSettings;
  stats: GameStats;
  onUpdateSettings: (newSettings: MatchSettings) => void;
  onResetStats: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  stats,
  onUpdateSettings,
  onResetStats,
  onClose,
}) => {
  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/85 backdrop-blur-md p-4 select-none overflow-y-auto"
    >
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-700/60 rounded-2xl shadow-2xl p-5 sm:p-6 text-white my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-base">⚙️</span>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-100">
                Configurações & Dados
              </h2>
              <span className="text-[10px] uppercase font-mono text-slate-400">
                Preferências de Partida
              </span>
            </div>
          </div>
          <button
            id="btn-close-settings"
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 py-3 text-left">
          {/* Audio & Haptics Toggles */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1.5">
              Áudio e Feedback
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                {settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span className="text-[10px]">SFX: {settings.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled })}
                className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  settings.musicEnabled
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                <span className="text-sm">🎵</span>
                <span className="text-[10px]">Torcida: {settings.musicEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled })}
                className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  settings.vibrationEnabled
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                <span className="text-sm">📳</span>
                <span className="text-[10px]">Vibração: {settings.vibrationEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Match Duration */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1.5">
              Duração do Tempo Regulamentar
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '02:00', secs: 120 },
                { label: '03:00', secs: 180 },
                { label: '05:00', secs: 300 },
              ].map((dur) => (
                <button
                  key={dur.secs}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, durationSeconds: dur.secs })}
                  className={`py-2 rounded-lg border text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
                    settings.durationSeconds === dur.secs
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1.5">
              Nível da Inteligência Artificial
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'easy', label: 'Fácil' },
                { id: 'normal', label: 'Normal' },
                { id: 'hard', label: 'Difícil' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, difficulty: diff.id as 'easy' | 'normal' | 'hard' })}
                  className={`py-2 rounded-lg border text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
                    settings.difficulty === diff.id
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats section */}
          <div className="pt-3 border-t border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Award size={13} className="text-amber-400" />
                Telemetria & Histórico
              </label>
              <button
                type="button"
                onClick={onResetStats}
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer uppercase"
              >
                <RotateCcw size={10} />
                Zerar
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-[#0f172a] p-2.5 rounded-xl border border-slate-700/60 text-center">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-bold block font-mono">Partidas</span>
                <span className="text-sm font-black text-white font-mono">{stats.matchesPlayed}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-emerald-400 font-bold block font-mono">Vitórias</span>
                <span className="text-sm font-black text-emerald-400 font-mono">{stats.wins}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-rose-400 font-bold block font-mono">Derrotas</span>
                <span className="text-sm font-black text-rose-400 font-mono">{stats.losses}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-amber-400 font-bold block font-mono">Empates</span>
                <span className="text-sm font-black text-amber-400 font-mono">{stats.draws}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-blue-400 font-bold block font-mono">Gols Feitos</span>
                <span className="text-sm font-black text-blue-400 font-mono">{stats.goalsScored}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-bold block font-mono">Gols Sofridos</span>
                <span className="text-sm font-black text-slate-300 font-mono">{stats.goalsConceded}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-xs uppercase tracking-wider text-white shadow-md border border-blue-400/40 transition-all cursor-pointer"
        >
          Confirmar & Salvar
        </button>
      </div>
    </div>
  );
};
