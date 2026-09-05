export type Team = 'blue' | 'red';

export type GameMode = 'cpu' | '2players' | 'tournament' | 'practice' | 'penalties';

export type AIDifficulty = 'easy' | 'normal' | 'hard';

export type MatchStatus =
  | 'MENU'
  | 'READY'
  | 'AIMING'
  | 'SIMULATING'
  | 'WAITING_STOP'
  | 'GOAL'
  | 'TURN_CHANGE'
  | 'PAUSED'
  | 'MATCH_END'
  | 'PENALTIES_TRANSITION';

export interface Disc {
  id: string;
  number: number;
  team: Team;
  isGoalkeeper: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  friction: number;
  restitution: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  friction: number;
  restitution: number;
  rotation: number;
}

export interface AimState {
  active: boolean;
  discId: string | null;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  shootVx: number;
  shootVy: number;
  power: number; // 0 to 1
  angle: number; // radians of shot direction
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface MatchSettings {
  durationSeconds: number; // 120, 180, 300
  difficulty: AIDifficulty;
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface GameStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  goalsConceded: number;
}

export interface TournamentMatch {
  id: string;
  team1: string;
  team2: string;
  score1?: number;
  score2?: number;
  winner?: string;
  played: boolean;
}

export interface TournamentData {
  stage: 'QUARTERS' | 'SEMIS' | 'FINAL' | 'CHAMPION' | 'ELIMINATED';
  playerTeam: string;
  bracket: {
    quarters: TournamentMatch[];
    semis: TournamentMatch[];
    final: TournamentMatch;
  };
}

export interface PenaltyShootoutState {
  round: number; // 0 to 4 (or higher for sudden death)
  currentTeam: Team;
  blueScore: number;
  redScore: number;
  blueHistory: ('goal' | 'miss')[];
  redHistory: ('goal' | 'miss')[];
  suddenDeath: boolean;
  finished: boolean;
  winner: Team | null;
}
