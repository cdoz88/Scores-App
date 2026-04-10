const https = require('https');
https.get('https://site.api.espn.com/apis/site/v2/sports/football/ufl/scoreboard', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const event = json.events[0];
    if (event) {
      https.get(`https://site.api.espn.com/apis/site/v2/sports/football/ufl/playbyplay?event=${event.id}`, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
          console.log(data2.substring(0, 500));
        });
      });
    }
  });
});
