/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Sport = 'football' | 'basketball' | 'baseball' | 'hockey' | 'golf' | 'soccer';

export interface League {
  id: string;
  name: string;
  sport: Sport;
  endpoint: string;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logo: string;
  score?: string;
  record?: string;
}

export interface GameStatus {
  state: 'pre' | 'in' | 'post';
  detail: string;
  clock?: string;
  period?: number;
}

export interface Game {
  id: string;
  league: string;
  name: string;
  shortName: string;
  date: string;
  status: GameStatus;
  awayTeam: Team;
  homeTeam: Team;
  lastPlay?: string;
  odds?: any[];
  broadcasts?: any[];
  golfCompetitors?: any[];
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  sport: string;
  season: string;
  status: string;
  total_rosters: number;
  avatar?: string;
  synced_user_id?: string;
}

export interface SleeperMatchup {
  matchup_id: number;
  roster_id: number;
  points: number;
  custom_points: number | null;
  starters: string[];
  players: string[];
  players_points: Record<string, number>;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  starters: string[];
  players: string[];
}

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  metadata: {
    team_name?: string;
  };
}
