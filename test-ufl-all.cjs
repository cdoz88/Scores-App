const https = require('https');
https.get('https://site.api.espn.com/apis/site/v2/sports/football/ufl/scoreboard', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    json.events.forEach(event => {
      console.log('Event Name:', event.name);
      console.log('Event Date:', event.date);
      console.log('Event Status:', event.status.type.state);
      https.get(`https://site.api.espn.com/apis/site/v2/sports/football/ufl/summary?event=${event.id}`, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
          const summary = JSON.parse(data2);
          console.log(event.name, 'Has plays:', !!summary.plays, 'Has scoringPlays:', !!summary.scoringPlays, 'Has team stats:', summary.boxscore?.teams?.[0]?.statistics?.length > 0);
        });
      });
    });
  });
});
