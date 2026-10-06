const fs = require('fs');

const str = fs.readFileSync('scripts/innertube_next.json', 'utf8');
const data = JSON.parse(str);

// Search for macroMarkers / chapterRenderer / comments with timestamps
const regex = /(\d{1,2}:\d{2})\s*([^\n\"\\<]{2,60})/g;
let match;
const found = [];
while ((match = regex.exec(str)) !== null) {
  found.push(`${match[1]} - ${match[2]}`);
}

console.log('Total timestamp matches:', found.length);
console.log('First 40 matches:\n', found.slice(0, 40).join('\n'));

// Check comments for timestamps or user breakdowns
const comments = [];
const commentRegex = /"contentText":\{"runs":\[\{"text":"([^"]+)"/g;
while ((match = commentRegex.exec(str)) !== null) {
  if (match[1].includes(':') || match[1].includes('ท่า')) {
    comments.push(match[1]);
  }
}
console.log('\nRelevant comments:\n', comments.join('\n---\n'));
