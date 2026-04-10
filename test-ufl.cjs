const https = require('https');
https.get('https://site.api.espn.com/apis/site/v2/sports/football/ufl/scoreboard', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const event = json.events[0];
    if (event) {
      console.log('Event ID:', event.id);
      https.get(`https://site.api.espn.com/apis/site/v2/sports/football/ufl/summary?event=${event.id}`, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
          const summary = JSON.parse(data2);
          console.log('Has boxscore:', !!summary.boxscore);
          console.log('Has plays:', !!summary.plays);
          console.log('Has scoringPlays:', !!summary.scoringPlays);
          console.log('Has drives:', !!summary.drives);
          if (summary.scoringPlays) {
            console.log('scoringPlays length:', summary.scoringPlays.length);
          }
        });
      });
    } else {
      console.log('No events found');
    }
  });
});
