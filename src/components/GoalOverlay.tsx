import React from 'react';
import { Team } from '../types/game';

interface GoalOverlayProps {
  scoringTeam: Team;
}

export const GoalOverlay: React.FC<GoalOverlayProps> = ({ scoringTeam }) => {
  const isBlue = scoringTeam === 'blue';

  return (
    <div
      id="goal-celebration-overlay"
      className="fixed inset-0 z-30 pointer-events-none flex flex-col items-center justify-center bg-[#0f172a]/70 backdrop-blur-[3px] animate-fadeIn"
    >
      <div className="flex flex-col items-center justify-center transform animate-bounce">
        {/* Glowing badge */}
        <div
          className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest font-mono shadow-2xl mb-3 border ${
            isBlue
              ? 'bg-blue-600/90 text-white border-blue-300 shadow-blue-900/50'
              : 'bg-red-600/90 text-white border-red-300 shadow-red-900/50'
          }`}
        >
          {isBlue ? 'GOL • TIME AZUL' : 'GOL • TIME VERMELHO'}
        </div>

        {/* Main GOOOOL text */}
        <h1
          className="text-7xl sm:text-8xl md:text-9xl font-black italic tracking-tighter text-amber-400 drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]"
          style={{ WebkitTextStroke: '3px #0f172a' }}
        >
          GOL!
        </h1>

        <div className="mt-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-200 font-mono font-bold text-xs sm:text-sm tracking-wider uppercase">
          ⚽ Bola na rede! Reiniciando no centro... ⚽
        </div>
      </div>
    </div>
  );
};
