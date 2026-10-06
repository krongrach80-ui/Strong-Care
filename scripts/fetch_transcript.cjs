const https = require('https');

const videoId = '3vOTTj_X3kQ';

// Try fetching timedtext list
const url = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;

https.get(url, (res) => {
  let xml = '';
  res.on('data', chunk => xml += chunk);
  res.on('end', () => {
    console.log('Timedtext list response:', xml);
    // If tracks found, fetch Thai or auto track
    const match = xml.match(/lang_code="([^"]+)"/);
    if (match) {
      const lang = match[1];
      const trackUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
      https.get(trackUrl, (res2) => {
        let jsonStr = '';
        res2.on('data', c => jsonStr += c);
        res2.on('end', () => {
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.events?.map(e => e.segs?.map(s => s.utf8).join('')).filter(Boolean).join(' ');
            require('fs').writeFileSync('scripts/transcript.txt', text || '');
            console.log('Transcript length:', text?.length);
            console.log('Sample transcript:\n', text?.slice(0, 500));
          } catch(e) {
            console.log('Could not parse timedtext json:', e.message);
          }
        });
      });
    }
  });
}).on('error', e => console.error(e));
