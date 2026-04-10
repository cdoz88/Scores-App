import fetch from 'node-fetch';
async function test() {
  const stateRes = await fetch('https://api.sleeper.app/v1/state/nfl');
  const state = await stateRes.json();
  const season = state.season_type === 'off' || state.season_type === 'pre' ? state.previous_season : state.season;
  
  const userRes = await fetch('https://api.sleeper.app/v1/user/CoreyFFAN');
  const user = await userRes.json();
  
  if (user && user.user_id) {
    const leaguesRes = await fetch(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${season}`);
    const leagues = await leaguesRes.json();
    console.log('Leagues:', leagues.length);
    
    if (leagues.length > 0) {
      const leagueId = leagues[0].league_id;
      const matchupsRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/18`);
      const matchups = await matchupsRes.json();
      console.log('Matchups week 18:', matchups.length);
      
      const matchups17Res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/17`);
      const matchups17 = await matchups17Res.json();
      console.log('Matchups week 17:', matchups17.length);
    }
  }
}
test();
