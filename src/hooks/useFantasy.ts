import { useState, useEffect } from 'react';
import { SleeperLeague, SleeperUser, SleeperMatchup, SleeperRoster } from '../types';
import { fetchSleeperUser, fetchSleeperLeagues, fetchSleeperMatchups, fetchSleeperRosters, fetchSleeperUsers, fetchSleeperState } from '../services/sleeperService';

const STORAGE_KEY = 'synced_leagues';

export function useFantasy() {
  const [syncedLeagues, setSyncedLeagues] = useState<SleeperLeague[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedLeagues));
  }, [syncedLeagues]);

  const syncLeague = async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await fetchSleeperUser(username);
      if (!user) throw new Error('User not found');
      
      const state = await fetchSleeperState();
      const season = state?.season_type === 'off' || state?.season_type === 'pre' ? state.previous_season : (state?.season || '2024');

      const leagues = await fetchSleeperLeagues(user.user_id, season);
      if (leagues.length === 0) throw new Error('No leagues found');
      
      // For simplicity, we sync all leagues for the user
      const newLeagues = leagues.filter(
        (l: SleeperLeague) => !syncedLeagues.some(sl => sl.league_id === l.league_id)
      ).map((l: SleeperLeague) => ({ ...l, synced_user_id: user.user_id, platform: 'Sleeper' }));
      
      // Also update any existing leagues that might be missing the synced_user_id
      const updatedExistingLeagues = syncedLeagues.map(sl => {
        if (!sl.synced_user_id && leagues.some((l: SleeperLeague) => l.league_id === sl.league_id)) {
          return { ...sl, synced_user_id: user.user_id, platform: 'Sleeper' };
        }
        return sl;
      });
      
      setSyncedLeagues([...updatedExistingLeagues, ...newLeagues]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addYahooLeague = (yahooLeague: any) => {
    const newLeague: any = {
      league_id: yahooLeague.league_key,
      name: yahooLeague.name,
      sport: 'nfl',
      season: yahooLeague.season,
      status: 'active',
      total_rosters: yahooLeague.num_teams,
      avatar: yahooLeague.logo_url,
      synced_user_id: 'yahoo_user', // We don't have the exact user ID right now
      platform: 'Yahoo'
    };

    if (!syncedLeagues.some(sl => sl.league_id === newLeague.league_id)) {
      setSyncedLeagues(prev => [...prev, newLeague]);
    }
  };

  const removeLeague = (leagueId: string) => {
    setSyncedLeagues(prev => prev.filter(l => l.league_id !== leagueId));
  };

  return {
    syncedLeagues,
    syncLeague,
    addYahooLeague,
    removeLeague,
    isLoading,
    error
  };
}
