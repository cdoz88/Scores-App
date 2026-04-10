const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export async function fetchSleeperUser(username: string) {
  const response = await fetch(`${SLEEPER_API_BASE}/user/${username}`);
  if (!response.ok) return null;
  return response.json();
}

export async function fetchSleeperLeagues(userId: string, season: string = '2024') {
  const response = await fetch(`${SLEEPER_API_BASE}/user/${userId}/leagues/nfl/${season}`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchSleeperMatchups(leagueId: string, week: number) {
  const response = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}/matchups/${week}`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchSleeperRosters(leagueId: string) {
  const response = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}/rosters`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchSleeperUsers(leagueId: string) {
  const response = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}/users`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchSleeperState() {
  const response = await fetch(`${SLEEPER_API_BASE}/state/nfl`);
  if (!response.ok) return null;
  return response.json();
}

export async function fetchSleeperPlayers() {
  const response = await fetch(`${SLEEPER_API_BASE}/players/nfl`);
  if (!response.ok) return {};
  return response.json();
}
