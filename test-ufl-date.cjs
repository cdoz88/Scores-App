const https = require('https');
https.get('https://site.api.espn.com/apis/site/v2/sports/football/ufl/scoreboard', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const event = json.events[0];
    if (event) {
      console.log('Event Name:', event.name);
      console.log('Event Date:', event.date);
      console.log('Event Status:', event.status.type.state);
    }
  });
});
