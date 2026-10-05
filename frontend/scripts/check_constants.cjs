const mp = require('../node_modules/@mediapipe/tasks-vision');

console.log('HAND_CONNECTIONS length:', mp.HandLandmarker.HAND_CONNECTIONS?.length);
console.log('Sample HAND_CONNECTIONS:', mp.HandLandmarker.HAND_CONNECTIONS?.slice(0, 5));

console.log('FACE_LANDMARKS_CONTOURS length:', mp.FaceLandmarker.FACE_LANDMARKS_CONTOURS?.length);
console.log('Sample FACE_LANDMARKS_CONTOURS:', mp.FaceLandmarker.FACE_LANDMARKS_CONTOURS?.slice(0, 5));
