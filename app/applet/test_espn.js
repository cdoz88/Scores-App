const https = require('https');

https.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=1', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const json = JSON.parse(data);
    const event = json.events[0];
    const comp = event.competitions[0];
    console.log(Object.keys(comp));
    if (comp.details) {
      console.log('details:', comp.details.length);
    }
    if (comp.scoringPlays) {
      console.log('scoringPlays:', comp.scoringPlays.length);
    }
  });
});
