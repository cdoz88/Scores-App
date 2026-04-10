import { Sport, League, Game } from '../types';
import { getTeamLogo } from '../lib/utils';

const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/';

export const LEAGUES: League[] = [
  { id: 'NFL', name: 'NFL', sport: 'football', endpoint: 'football/nfl/scoreboard' },
  { id: 'NCAAF', name: 'NCAAF', sport: 'football', endpoint: 'football/college-football/scoreboard' },
  { id: 'UFL', name: 'UFL', sport: 'football', endpoint: 'football/ufl/scoreboard' },
  { id: 'NBA', name: 'NBA', sport: 'basketball', endpoint: 'basketball/nba/scoreboard' },
  { id: 'WNBA', name: 'WNBA', sport: 'basketball', endpoint: 'basketball/wnba/scoreboard' },
  { id: 'NCAAB', name: 'NCAAB', sport: 'basketball', endpoint: 'basketball/mens-college-basketball/scoreboard' },
  { id: 'NCAAW', name: 'NCAAW', sport: 'basketball', endpoint: 'basketball/womens-college-basketball/scoreboard' },
  { id: 'MLB', name: 'MLB', sport: 'baseball', endpoint: 'baseball/mlb/scoreboard' },
  { id: 'CBASE', name: 'CBASE', sport: 'baseball', endpoint: 'baseball/college-baseball/scoreboard' },
  { id: 'NHL', name: 'NHL', sport: 'hockey', endpoint: 'hockey/nhl/scoreboard' },
  { id: 'PGA', name: 'PGA', sport: 'golf', endpoint: 'golf/pga/scoreboard' },
  { id: 'EPL', name: 'EPL', sport: 'soccer', endpoint: 'soccer/eng.1/scoreboard' },
  { id: 'MLS', name: 'MLS', sport: 'soccer', endpoint: 'soccer/usa.1/scoreboard' },
  { id: 'UCL', name: 'UCL', sport: 'soccer', endpoint: 'soccer/uefa.champions/scoreboard' },
  { id: 'UEL', name: 'UEL', sport: 'soccer', endpoint: 'soccer/uefa.europa/scoreboard' },
  { id: 'ESP', name: 'ESP', sport: 'soccer', endpoint: 'soccer/esp.1/scoreboard' },
  { id: 'GER', name: 'GER', sport: 'soccer', endpoint: 'soccer/ger.1/scoreboard' },
  { id: 'ITA', name: 'ITA', sport: 'soccer', endpoint: 'soccer/ita.1/scoreboard' },
  { id: 'FRA', name: 'FRA', sport: 'soccer', endpoint: 'soccer/fra.1/scoreboard' },
  { id: 'NED', name: 'NED', sport: 'soccer', endpoint: 'soccer/ned.1/scoreboard' },
  { id: 'MEX', name: 'MEX', sport: 'soccer', endpoint: 'soccer/mex.1/scoreboard' },
];

export async function fetchScoreboard(leagueId: string, date: string): Promise<Game[]> {
  const league = LEAGUES.find(l => l.id === leagueId);
  if (!league) return [];

  const url = `${API_BASE}${league.endpoint}?dates=${date.replace(/-/g, '')}`;
  const response = await fetch(url);
  const data = await response.json();

  return (data.events || []).map((event: any) => {
    const competition = event.competitions?.[0];
    if (!competition) return null;
    
    // Handle Golf (PGA) differently as it doesn't have away/home teams
    if (leagueId === 'PGA') {
      const competitors = competition.competitors || [];
      const sortedCompetitors = competitors
        .sort((a: any, b: any) => (a.order || 999) - (b.order || 999));
        
      return {
        id: event.id,
        league: leagueId,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        status: {
          state: competition.status.type.state,
          detail: competition.status.type.detail,
          clock: competition.status.clock,
          period: competition.status.period,
        },
        // For golf, we'll store all competitors in a special field
        // and provide dummy away/home teams to satisfy the type
        golfCompetitors: sortedCompetitors,
        awayTeam: {
          id: 'golf-dummy-1',
          name: 'Golf',
          abbreviation: 'GLF',
          displayName: 'Golf',
          logo: '',
        },
        homeTeam: {
          id: 'golf-dummy-2',
          name: 'Golf',
          abbreviation: 'GLF',
          displayName: 'Golf',
          logo: '',
        },
        lastPlay: competition.situation?.lastPlay?.text,
        odds: competition.odds || [],
        broadcasts: competition.broadcasts || competition.geoBroadcasts || [],
      };
    }
    
    const away = competition.competitors?.find((c: any) => c.homeAway === 'away');
    const home = competition.competitors?.find((c: any) => c.homeAway === 'home');

    if (!away || !home) return null;

    return {
      id: event.id,
      league: leagueId,
      name: event.name,
      shortName: event.shortName,
      date: event.date,
      status: {
        state: competition.status.type.state,
        detail: competition.status.type.detail,
        clock: competition.status.clock,
        period: competition.status.period,
      },
      awayTeam: {
        id: away.team.id,
        name: away.team.name,
        abbreviation: away.team.abbreviation,
        displayName: away.team.displayName,
        logo: getTeamLogo(away.team),
        score: away.score,
        record: away.records?.find((r: any) => r.type === 'total')?.summary,
      },
      homeTeam: {
        id: home.team.id,
        name: home.team.name,
        abbreviation: home.team.abbreviation,
        displayName: home.team.displayName,
        logo: getTeamLogo(home.team),
        score: home.score,
        record: home.records?.find((r: any) => r.type === 'total')?.summary,
      },
      lastPlay: competition.situation?.lastPlay?.text,
      odds: competition.odds || [],
      broadcasts: competition.broadcasts || competition.geoBroadcasts || [],
    };
  }).filter((g): g is Game => g !== null);
}

export async function fetchGameSummary(leagueId: string, gameId: string, date?: string) {
  const league = LEAGUES.find(l => l.id === leagueId);
  if (!league) return null;

  const leaguePath = league.endpoint.replace('/scoreboard', '');
  const url = `${API_BASE}${leaguePath}/summary?event=${gameId}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    if (leagueId === 'PGA') {
      // For PGA, the summary endpoint might not exist or return 404.
      // We can fallback to the scoreboard endpoint to get the leaderboard data for this specific event.
      let fallbackUrl = `${API_BASE}${league.endpoint}`;
      if (date) {
        // Format date to YYYYMMDD
        const formattedDate = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
        fallbackUrl += `?dates=${formattedDate}`;
      }
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        const event = data.events?.find((e: any) => e.id === gameId);
        if (event) {
          return { header: event }; // Wrap it in a 'header' object to match the expected structure in GameDetails
        }
      }
    }
    throw new Error(`Failed to fetch game summary: ${response.statusText}`);
  }
  
  return response.json();
}
