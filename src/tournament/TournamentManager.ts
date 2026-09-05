import { TournamentData, TournamentMatch } from '../types/game';

export const TOURNAMENT_TEAMS = [
  'Estrela Azul',
  'Flamo Disco',
  'Santos Botão',
  'Palmeiras Disco',
  'Grêmio Redondo',
  'Cruzeiro Botão',
  'Vasco da Bola',
  'Galo Redondo',
];

export class TournamentManager {
  public static createTournament(playerTeam: string = 'Estrela Azul'): TournamentData {
    // Generate quarters
    const opponents = TOURNAMENT_TEAMS.filter((t) => t !== playerTeam);
    // Shuffle opponents
    const shuffled = [...opponents].sort(() => Math.random() - 0.5);

    const quarters: TournamentMatch[] = [
      { id: 'q1', team1: playerTeam, team2: shuffled[0], played: false },
      { id: 'q2', team1: shuffled[1], team2: shuffled[2], played: false },
      { id: 'q3', team1: shuffled[3], team2: shuffled[4], played: false },
      { id: 'q4', team1: shuffled[5], team2: shuffled[6], played: false },
    ];

    // Simulate non-player quarter matches right away for suspense
    quarters[1].score1 = Math.floor(Math.random() * 3) + 1;
    quarters[1].score2 = Math.floor(Math.random() * 3);
    quarters[1].winner = quarters[1].score1 >= (quarters[1].score2 || 0) ? quarters[1].team1 : quarters[1].team2;
    quarters[1].played = true;

    quarters[2].score1 = Math.floor(Math.random() * 3);
    quarters[2].score2 = Math.floor(Math.random() * 3) + 1;
    quarters[2].winner = (quarters[2].score2 || 0) >= (quarters[2].score1 || 0) ? quarters[2].team2 : quarters[2].team1;
    quarters[2].played = true;

    quarters[3].score1 = Math.floor(Math.random() * 3) + 2;
    quarters[3].score2 = Math.floor(Math.random() * 2);
    quarters[3].winner = quarters[3].team1;
    quarters[3].played = true;

    const semis: TournamentMatch[] = [
      { id: 's1', team1: 'Vencedor Q1', team2: quarters[1].winner!, played: false },
      { id: 's2', team1: quarters[2].winner!, team2: quarters[3].winner!, played: false },
    ];

    const final: TournamentMatch = {
      id: 'f1',
      team1: 'Vencedor S1',
      team2: 'Vencedor S2',
      played: false,
    };

    return {
      stage: 'QUARTERS',
      playerTeam,
      bracket: {
        quarters,
        semis,
        final,
      },
    };
  }

  public static advanceTournament(
    tournament: TournamentData,
    playerScore: number,
    opponentScore: number
  ): { tournament: TournamentData; result: 'won' | 'lost' | 'champion' } {
    const updated = JSON.parse(JSON.stringify(tournament)) as TournamentData;
    const playerWon = playerScore > opponentScore;

    if (!playerWon) {
      updated.stage = 'ELIMINATED';
      return { tournament: updated, result: 'lost' };
    }

    if (updated.stage === 'QUARTERS') {
      const q1 = updated.bracket.quarters[0];
      q1.score1 = playerScore;
      q1.score2 = opponentScore;
      q1.winner = updated.playerTeam;
      q1.played = true;

      // Set up Semi 1
      updated.bracket.semis[0].team1 = updated.playerTeam;

      // Simulate Semi 2
      const s2 = updated.bracket.semis[1];
      s2.score1 = Math.floor(Math.random() * 3) + 1;
      s2.score2 = Math.floor(Math.random() * 3);
      s2.winner = s2.score1 >= s2.score2 ? s2.team1 : s2.team2;
      s2.played = true;

      updated.bracket.final.team2 = s2.winner;

      updated.stage = 'SEMIS';
      return { tournament: updated, result: 'won' };
    } else if (updated.stage === 'SEMIS') {
      const s1 = updated.bracket.semis[0];
      s1.score1 = playerScore;
      s1.score2 = opponentScore;
      s1.winner = updated.playerTeam;
      s1.played = true;

      updated.bracket.final.team1 = updated.playerTeam;
      updated.stage = 'FINAL';
      return { tournament: updated, result: 'won' };
    } else if (updated.stage === 'FINAL') {
      const f = updated.bracket.final;
      f.score1 = playerScore;
      f.score2 = opponentScore;
      f.winner = updated.playerTeam;
      f.played = true;

      updated.stage = 'CHAMPION';
      return { tournament: updated, result: 'champion' };
    }

    return { tournament: updated, result: 'won' };
  }
}
