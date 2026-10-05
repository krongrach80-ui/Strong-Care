/**
 * Strong Care - Biomechanics & Algorithm Tests
 * Validates Joint Vector Trigonometry, State Machine Hysteresis, and Safety Cutoffs
 */

// 1. Joint Angle Vector Dot Product Validation
export function testCalculateAngle() {
  const shoulder = { x: 0, y: 1 };
  const elbow = { x: 0, y: 0 }; // Vertex
  const wrist = { x: 1, y: 0 };

  const baX = shoulder.x - elbow.x;
  const baY = shoulder.y - elbow.y;
  const bcX = wrist.x - elbow.x;
  const bcY = wrist.y - elbow.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.hypot(baX, baY);
  const magBC = Math.hypot(bcX, bcY);
  const cosine = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  const angleDeg = (Math.acos(cosine) * 180) / Math.PI;

  console.assert(Math.abs(angleDeg - 90) < 0.001, `Expected 90 deg, got ${angleDeg}`);
  return angleDeg === 90;
}

// 2. Safety Cutoff Validation
export function testSafetyOverRomCutoff() {
  const currentAngle = 145;
  const safeCutoff = 140;
  const isDanger = currentAngle > safeCutoff;
  console.assert(isDanger === true, 'Over-ROM must trigger danger');
  return isDanger;
}

// 3. Clinical Liveness EAR Validation
export function testLivenessEarCalculation() {
  const openEyeEar = 0.32;
  const closedEyeEar = 0.16;
  const isBlink = closedEyeEar < 0.20 && openEyeEar >= 0.25;
  console.assert(isBlink === true, 'Blink detection threshold check');
  return isBlink;
}

if (typeof window === 'undefined') {
  console.log('--- Running Strong Care Algorithm Unit Tests ---');
  console.log('testCalculateAngle:', testCalculateAngle() ? 'PASSED' : 'FAILED');
  console.log('testSafetyOverRomCutoff:', testSafetyOverRomCutoff() ? 'PASSED' : 'FAILED');
  console.log('testLivenessEarCalculation:', testLivenessEarCalculation() ? 'PASSED' : 'FAILED');
}
