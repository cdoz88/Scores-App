const https = require('https');

https.get('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401585608', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json.boxscore.teams, null, 2));
  });
});
