const https = require('https');

const postData = JSON.stringify({
  context: {
    client: {
      hl: 'th',
      gl: 'TH',
      clientName: 'WEB',
      clientVersion: '2.20240101.00.00',
    },
  },
  videoId: '3vOTTj_X3kQ',
});

const req = https.request('https://www.youtube.com/youtubei/v1/player', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('Video title:', data.videoDetails?.title);
      console.log('Video description:\n', data.videoDetails?.shortDescription);
      require('fs').writeFileSync('scripts/innertube_player.json', JSON.stringify(data, null, 2));
    } catch(e) {
      console.error('Error:', e.message);
    }
  });
});

req.write(postData);
req.end();
