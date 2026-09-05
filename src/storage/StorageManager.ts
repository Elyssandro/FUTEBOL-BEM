import { GameStats, MatchSettings } from '../types/game';

const SETTINGS_KEY = 'futebol_botao_settings';
const STATS_KEY = 'futebol_botao_stats';

export const DEFAULT_SETTINGS: MatchSettings = {
  durationSeconds: 180,
  difficulty: 'normal',
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
};

export const DEFAULT_STATS: GameStats = {
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  goalsScored: 0,
  goalsConceded: 0,
};

export class StorageManager {
  public static loadSettings(): MatchSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: MatchSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  public static loadStats(): GameStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (data) {
        return { ...DEFAULT_STATS, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_STATS };
  }

  public static saveStats(stats: GameStats): void {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }

  public static recordMatch(playerWon: boolean, isDraw: boolean, scored: number, conceded: number): GameStats {
    const stats = this.loadStats();
    stats.matchesPlayed += 1;
    if (isDraw) {
      stats.draws += 1;
    } else if (playerWon) {
      stats.wins += 1;
    } else {
      stats.losses += 1;
    }
    stats.goalsScored += scored;
    stats.goalsConceded += conceded;
    this.saveStats(stats);
    return stats;
  }

  public static resetStats(): GameStats {
    this.saveStats(DEFAULT_STATS);
    return { ...DEFAULT_STATS };
  }
}
