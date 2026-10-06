const fs = require('fs');

try {
  const raw = fs.readFileSync('scripts/yt_data.json', 'utf8');
  const data = JSON.parse(raw);

  // Search description
  const videoDetails = data?.videoDetails || {};
  console.log('Video Title:', videoDetails.title);
  console.log('Length (sec):', videoDetails.lengthSeconds);
  console.log('Short description:\n', videoDetails.shortDescription);

  // Search for chapters or markers in engagement panels or player overlays
  const str = JSON.stringify(data);
  const chapterMatches = str.match(/"title":\{"simpleText":"([^"]+)"\},"timeDescription":\{"simpleText":"([^"]+)"\}/g);
  if (chapterMatches) {
    console.log('\n--- Chapters Found ---');
    chapterMatches.forEach((m) => console.log(m));
  } else {
    // Look for macroMarkers / chapterRenderer
    const re = /"chapterRenderer":\{"title":\{"simpleText":"([^"]+)"\},"timeRangeStartMillis":(\d+)/g;
    let m;
    console.log('\n--- Chapter Renderers ---');
    while ((m = re.exec(str)) !== null) {
      console.log(`[${Math.floor(m[2]/1000)}s] ${m[1]}`);
    }
  }
} catch (e) {
  console.error('Error parsing:', e.message);
}
