import { useQuery } from '@tanstack/react-query';
import { fetchSleeperMatchups, fetchSleeperRosters, fetchSleeperUsers, fetchSleeperState, fetchSleeperPlayers } from '../services/sleeperService';
import { fetchYahooLeagueData } from '../services/yahooService';
import { SleeperLeague } from '../types';

export function useFantasyMatchups(leagues: SleeperLeague[]) {
  const { data: state } = useQuery({
    queryKey: ['sleeperState'],
    queryFn: fetchSleeperState,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const currentWeek = state?.season_type === 'off' || state?.season_type === 'pre' ? 18 : (state?.week || 1);

  const { data: players } = useQuery({
    queryKey: ['sleeperPlayers'],
    queryFn: fetchSleeperPlayers,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const { data: matchupsData, isLoading } = useQuery({
    queryKey: ['fantasyMatchups', leagues.map(l => l.league_id), currentWeek],
    queryFn: async () => {
      if (!leagues.length) return [];
      
      const promises = leagues.map(async (league) => {
        if (league.platform === 'Yahoo') {
          const { matchups, rosters, users } = await fetchYahooLeagueData(league.league_id, currentWeek);
          return { league, matchups, rosters, users };
        }

        const [matchups, rosters, users] = await Promise.all([
          fetchSleeperMatchups(league.league_id, currentWeek),
          fetchSleeperRosters(league.league_id),
          fetchSleeperUsers(league.league_id)
        ]);
        console.log('Fetched data for league', league.league_id, { matchups, rosters, users });
        return { league, matchups, rosters, users };
      });
      
      return Promise.all(promises);
    },
    enabled: leagues.length > 0 && !!currentWeek,
    refetchInterval: 60000, // Refresh every minute
  });

  return {
    matchupsData,
    isLoading,
    currentWeek,
    players,
  };
}
