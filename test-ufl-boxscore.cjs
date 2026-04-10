const https = require('https');
https.get('https://site.api.espn.com/apis/site/v2/sports/football/ufl/scoreboard', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const event = json.events[0];
    if (event) {
      https.get(`https://site.api.espn.com/apis/site/v2/sports/football/ufl/summary?event=${event.id}`, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
          const summary = JSON.parse(data2);
          console.log(JSON.stringify(summary.boxscore, null, 2));
        });
      });
    }
  });
});
