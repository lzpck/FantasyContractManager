import {
  transformSleeperRosters,
  transformSleeperPlayersToLocal,
  SleeperRoster,
  SleeperPlayer,
} from './sleeperService';
import { PlayerPosition } from '@/types';

describe('transformSleeperRosters', () => {
  test('separa jogadores ativos, reserva e taxi', () => {
    const rosters: SleeperRoster[] = [
      {
        roster_id: 1,
        owner_id: 'user1',
        players: ['p1', 'p2', 'p3', 'p4'],
        starters: [],
        reserve: ['p3'],
        taxi: ['p4'],
        settings: {
          wins: 0,
          waiver_position: 0,
          waiver_budget_used: 0,
          total_moves: 0,
          ties: 0,
          losses: 0,
          fpts: 0,
          fpts_decimal: 0,
          fpts_against: 0,
          fpts_against_decimal: 0,
        },
      },
    ];

    const result = transformSleeperRosters(rosters);
    expect(result[0].players).toEqual(['p1', 'p2']);
    expect(result[0].reserve).toEqual(['p3']);
    expect(result[0].taxi).toEqual(['p4']);
  });
});

describe('transformSleeperPlayersToLocal', () => {
  test('filtra jogadores por fantasy positions', () => {
    const players: Record<string, SleeperPlayer> = {
      p1: {
        player_id: 'p1',
        full_name: 'Test QB',
        first_name: 'Test',
        last_name: 'QB',
        position: 'QB',
        team: 'BUF',
        fantasy_positions: ['QB'],
      },
      p2: {
        player_id: 'p2',
        full_name: 'Bench',
        first_name: 'Bench',
        last_name: 'WR',
        position: 'WR',
        team: 'DAL',
        fantasy_positions: ['BN'],
      },
    } as Record<string, SleeperPlayer>;

    const allowed = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];
    const result = transformSleeperPlayersToLocal(players, allowed);
    expect(result).toHaveLength(1);
    expect(result[0].sleeperPlayerId).toBe('p1');
    expect(result[0].fantasyPositions).toEqual([PlayerPosition.QB]);
  });
});
