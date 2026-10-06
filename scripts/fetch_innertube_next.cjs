const https = require('https');
const fs = require('fs');

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

const req = https.request('https://www.youtube.com/youtubei/v1/next', {
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
      fs.writeFileSync('scripts/innertube_next.json', body);
      console.log('Saved innertube_next.json, length:', body.length);
    } catch(e) {
      console.error('Error:', e.message);
    }
  });
});

req.write(postData);
req.end();
