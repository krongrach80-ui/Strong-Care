const fs = require('fs');
const content = fs.readFileSync('node_modules/@mediapipe/tasks-vision/vision.d.ts', 'utf8');

function extractClass(name) {
  const idx = content.indexOf(`export declare class ${name}`);
  if (idx !== -1) {
    console.log(content.slice(idx, idx + 1000));
  }
}

extractClass('HandLandmarker');
extractClass('FaceLandmarker');
