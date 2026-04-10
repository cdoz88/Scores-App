import https from 'https';

https.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401772510', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(Object.keys(json));
    if (json.scoringPlays) {
      console.log('scoringPlays length:', json.scoringPlays.length);
      console.log('first scoring play:', json.scoringPlays[0]);
    }
  });
});
