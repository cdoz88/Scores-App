export const fetchYahooLeagueData = async (leagueKey: string, week: number) => {
  const response = await fetch(`/api/yahoo/league/${leagueKey}/scoreboard;week=${week}?format=json`);
  if (!response.ok) throw new Error('Failed to fetch Yahoo scoreboard');
  const data = await response.json();

  const matchups: any[] = [];
  const rosters: any[] = [];
  const users: any[] = [];

  try {
    const leagueData = data.fantasy_content.league;
    const scoreboard = leagueData[1].scoreboard[0].matchups;

    let matchupIdCounter = 1;

    Object.keys(scoreboard).forEach(key => {
      if (key === 'count') return;
      const matchup = scoreboard[key].matchup;
      const teams = matchup[0].teams;

      Object.keys(teams).forEach(teamKey => {
        if (teamKey === 'count') return;
        const team = teams[teamKey].team;
        const teamInfo = team[0];
        const teamPoints = team[1].team_points.total;

        const teamId = teamInfo.find((t: any) => t.team_id)?.team_id;
        const teamName = teamInfo.find((t: any) => t.name)?.name;
        const teamLogos = teamInfo.find((t: any) => t.team_logos)?.team_logos;
        const logoUrl = teamLogos ? teamLogos[0].team_logo.url : '';
        const managers = teamInfo.find((t: any) => t.managers)?.managers;
        const manager = managers ? managers[0].manager : null;
        const nickname = manager ? manager.nickname : teamName;
        const managerId = manager ? manager.guid : teamId;

        // Create normalized user
        if (!users.find(u => u.user_id === managerId)) {
          users.push({
            user_id: managerId,
            username: nickname,
            display_name: nickname,
            avatar: logoUrl,
            metadata: { team_name: teamName }
          });
        }

        // Create normalized roster
        const rosterId = parseInt(teamId);
        if (!rosters.find(r => r.roster_id === rosterId)) {
          rosters.push({
            roster_id: rosterId,
            owner_id: managerId,
            league_id: leagueKey,
            starters: [], 
            players: []
          });
        }

        // Create normalized matchup
        matchups.push({
          matchup_id: matchupIdCounter,
          roster_id: rosterId,
          points: parseFloat(teamPoints) || 0,
          custom_points: null,
          starters: [],
          players: [],
          players_points: {}
        });
      });

      matchupIdCounter++;
    });
  } catch (e) {
    console.error("Error parsing Yahoo data", e);
  }

  return { matchups, rosters, users };
};
