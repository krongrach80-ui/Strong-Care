import { AngleEngine } from '../biomechanics/AngleEngine';
import { RepetitionEngine } from '../biomechanics/RepetitionEngine';
import { getPoseSpec } from '../biomechanics/poseSpecs';
import { ExerciseDefinition } from '../types/exercise';
import { Landmark, PoseLandmarks, POSE_LANDMARKS } from '../types/pose';

export interface VerificationTestResult {
  id: string;
  name: string;
  category: 'ASPECT_RATIO' | 'REPETITION_STATE' | 'KINEMATIC_COVERAGE';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

/**
 * Helper to generate normalized landmarks given physical pixel coordinates and dimensions
 */
function createNormPoint(xPixel: number, yPixel: number, width: number, height: number): Landmark {
  return {
    x: xPixel / width,
    y: yPixel / height,
    visibility: 0.99,
  };
}

/**
 * Aspect Ratio & Repetition Engine Verification Suite
 */
export async function runBiomechanicalVerificationSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: VerificationTestResult[];
}> {
  const results: VerificationTestResult[] = [];

  // =========================================================================
  // SECTION 1: ASPECT RATIO INVARIANCE TESTS (16:9 vs 4:3 vs 9:16)
  // =========================================================================

  const viewports = [
    { name: '16:9 Landscape', width: 1920, height: 1080 },
    { name: '4:3 Standard',   width: 640,  height: 480 },
    { name: '9:16 Portrait',   width: 1080, height: 1920 },
  ];

  // Test 1.1: Right-angle elbow (90 degrees in physical space)
  // Vertex at (500, 500), A at (500, 300) [up], C at (700, 500) [right]
  {
    const angles: { vp: string; angle: number }[] = [];
    for (const vp of viewports) {
      const engine = new AngleEngine(1.0);
      engine.setDimensions(vp.width, vp.height);

      const vertex = createNormPoint(500, 500, vp.width, vp.height);
      const a = createNormPoint(500, 300, vp.width, vp.height);
      const c = createNormPoint(700, 500, vp.width, vp.height);

      const calculated = engine.calculateJointAngle(a, vertex, c);
      angles.push({ vp: vp.name, angle: calculated });
    }

    const all90 = angles.every((a) => Math.abs(a.angle - 90.0) <= 0.2);
    results.push({
      id: 'AR-01',
      name: 'Aspect-Ratio Invariance: 90° Joint Angle Across 16:9, 4:3, 9:16',
      category: 'ASPECT_RATIO',
      passed: all90,
      expected: '90.0° in all viewports (tolerance ±0.2°)',
      actual: angles.map((a) => `${a.vp}: ${a.angle}°`).join(' | '),
      details: 'Evaluated vertex with horizontal & vertical legs scaled to camera aspect ratios',
    });
  }

  // Test 1.2: 45-degree angled vector
  // Vertex at (400, 400), A at (400, 200) [vertical up], C at (600, 200) [diagonal 45°]
  {
    const angles: { vp: string; angle: number }[] = [];
    for (const vp of viewports) {
      const engine = new AngleEngine(1.0);
      engine.setDimensions(vp.width, vp.height);

      const vertex = createNormPoint(400, 400, vp.width, vp.height);
      const a = createNormPoint(400, 200, vp.width, vp.height);
      const c = createNormPoint(600, 200, vp.width, vp.height);

      const calculated = engine.calculateJointAngle(a, vertex, c);
      angles.push({ vp: vp.name, angle: calculated });
    }

    const all45 = angles.every((a) => Math.abs(a.angle - 45.0) <= 0.2);
    results.push({
      id: 'AR-02',
      name: 'Aspect-Ratio Invariance: 45° Joint Angle Across 16:9, 4:3, 9:16',
      category: 'ASPECT_RATIO',
      passed: all45,
      expected: '45.0° in all viewports (tolerance ±0.2°)',
      actual: angles.map((a) => `${a.vp}: ${a.angle}°`).join(' | '),
      details: 'Tests diagonal vectors where non-square pixels previously warped angle calculations',
    });
  }

  // Test 1.3: Vertical spine inclination (30° lean from gravitational vertical)
  // Top point at (500 + 200*tan(30°), 300) = (615.47, 300), Bottom point at (500, 500)
  {
    const dx = 200 * Math.tan((30 * Math.PI) / 180); // ~115.47 px
    const angles: { vp: string; angle: number }[] = [];

    for (const vp of viewports) {
      const engine = new AngleEngine(1.0);
      engine.setDimensions(vp.width, vp.height);

      const top = createNormPoint(500 + dx, 300, vp.width, vp.height);
      const bottom = createNormPoint(500, 500, vp.width, vp.height);

      const calculated = engine.calculateVerticalAngle(top, bottom);
      angles.push({ vp: vp.name, angle: calculated });
    }

    const all30 = angles.every((a) => Math.abs(a.angle - 30.0) <= 0.2);
    results.push({
      id: 'AR-03',
      name: 'Aspect-Ratio Invariance: Vertical Spine Inclination (30° Lean)',
      category: 'ASPECT_RATIO',
      passed: all30,
      expected: '30.0° in all viewports (tolerance ±0.2°)',
      actual: angles.map((a) => `${a.vp}: ${a.angle}°`).join(' | '),
      details: 'Ensures spine verticality measurement is invariant to vertical smartphone vs widescreen monitor',
    });
  }

  // Test 1.4: Horizontal shoulder tilt (15° tilt from horizontal)
  // Left point at (300, 500), Right point at (300 + 300, 500 + 300*tan(15°)) = (600, 580.38)
  {
    const dy = 300 * Math.tan((15 * Math.PI) / 180); // ~80.38 px
    const angles: { vp: string; angle: number }[] = [];

    for (const vp of viewports) {
      const engine = new AngleEngine(1.0);
      engine.setDimensions(vp.width, vp.height);

      const left = createNormPoint(300, 500, vp.width, vp.height);
      const right = createNormPoint(600, 500 + dy, vp.width, vp.height);

      const calculated = engine.calculateHorizontalTilt(left, right);
      angles.push({ vp: vp.name, angle: calculated });
    }

    const all15 = angles.every((a) => Math.abs(a.angle - 15.0) <= 0.2);
    results.push({
      id: 'AR-04',
      name: 'Aspect-Ratio Invariance: Horizontal Shoulder Tilt (15° Tilt)',
      category: 'ASPECT_RATIO',
      passed: all15,
      expected: '15.0° in all viewports (tolerance ±0.2°)',
      actual: angles.map((a) => `${a.vp}: ${a.angle}°`).join(' | '),
      details: 'Confirms shoulder hiking calculation is preserved accurately regardless of resolution',
    });
  }

  // =========================================================================
  // SECTION 2: REPETITION STATE MACHINE CLINICAL TESTS
  // =========================================================================

  const shoulderExercise: ExerciseDefinition = {
    id: 1,
    name: 'Shoulder Raise',
    slug: 'shoulder_raise',
    category: 'Shoulder',
    description: 'Arm raise test',
    target_joint: 'RIGHT_SHOULDER',
    target_angle: 90,
    min_angle: 30,
    max_angle: 90,
    max_safe_angle: 110,
    target_reps: 10,
    difficulty: 'beginner',
    hold_seconds: 1,
  };

  // Test 2.1: Full valid repetition with continuous hold
  {
    const repEngine = new RepetitionEngine(shoulderExercise, 600);
    let t = 1000;

    // 1. Start at rest (30°)
    repEngine.process(30, true, true, t); // Transitions to READY
    t += 500;

    // 2. Begin concentric movement (past trigger 45°)
    repEngine.process(55, true, true, t); // Transitions to UP
    t += 500;

    // 3. Reach target zone (90°)
    repEngine.process(90, true, true, t); // Transitions to HOLD
    t += 200;

    // 4. Hold in target zone for > 600ms
    repEngine.process(92, true, true, t);
    t += 250;
    repEngine.process(89, true, true, t);
    t += 250;
    const holdRes = repEngine.process(90, true, true, t); // Reached 700ms -> COMPLETE
    t += 400;

    // 5. Eccentric return to rest (30°)
    const finalRes = repEngine.process(30, true, true, t);

    const passed = finalRes.isRepJustCompleted && finalRes.telemetry.repCount === 1;
    results.push({
      id: 'REP-01',
      name: 'Repetition Automaton: Complete Golden Repetition with Isometric Hold',
      category: 'REPETITION_STATE',
      passed,
      expected: 'Rep Completed = true, Rep Count = 1',
      actual: `Rep Completed = ${finalRes.isRepJustCompleted}, Rep Count = ${finalRes.telemetry.repCount}, State = ${finalRes.telemetry.state}`,
      details: 'Steps: Rest (30°) -> Move (55°) -> Target (90°) -> Hold 700ms -> Return (30°)',
    });
  }

  // Test 2.2: Concentric early abort (returned to rest halfway before target)
  {
    const repEngine = new RepetitionEngine(shoulderExercise, 600);
    let t = 1000;

    repEngine.process(30, true, true, t); // READY
    t += 500;
    repEngine.process(55, true, true, t); // UP
    t += 500;
    // User drops back to rest without reaching 90°
    const abortRes = repEngine.process(32, true, true, t);

    const passed = abortRes.telemetry.state === 'READY' && abortRes.telemetry.repCount === 0 && !abortRes.isRepJustCompleted;
    results.push({
      id: 'REP-02',
      name: 'Repetition Automaton: Concentric Early Return Aborts Repetition',
      category: 'REPETITION_STATE',
      passed,
      expected: 'State aborts back to READY without counting rep (repCount = 0)',
      actual: `State = ${abortRes.telemetry.state}, RepCount = ${abortRes.telemetry.repCount}, RepCompleted = ${abortRes.isRepJustCompleted}`,
      details: 'Patient moved arm halfway (55°) then gave up and dropped back down (32°)',
    });
  }

  // Test 2.3: Concentric timeout (stuck in UP for > 7 seconds)
  {
    const repEngine = new RepetitionEngine(shoulderExercise, 600);
    let t = 1000;

    repEngine.process(30, true, true, t); // READY
    t += 500;
    repEngine.process(55, true, true, t); // UP
    t += 7500; // Stagnant in UP for 7.5 seconds
    const timeoutRes = repEngine.process(60, true, true, t);

    const passed = timeoutRes.telemetry.state === 'READY' && timeoutRes.telemetry.repCount === 0;
    results.push({
      id: 'REP-03',
      name: 'Repetition Automaton: Concentric Phase Timeout (> 7s) Resets State',
      category: 'REPETITION_STATE',
      passed,
      expected: 'State resets to READY on concentric timeout',
      actual: `State = ${timeoutRes.telemetry.state}, Feedback = "${timeoutRes.feedback}"`,
      details: 'Prevents automaton from staying trapped in UP phase when movement is halted',
    });
  }

  // Test 2.4: Out of target envelope during HOLD aborts back to UP
  {
    const repEngine = new RepetitionEngine(shoulderExercise, 600);
    let t = 1000;

    repEngine.process(30, true, true, t); // READY
    t += 500;
    repEngine.process(55, true, true, t); // UP
    t += 500;
    repEngine.process(90, true, true, t); // HOLD
    t += 200;
    repEngine.process(90, true, true, t); // held 200ms
    t += 100;
    // Drops out of target envelope (target 90, tolerance 15 -> min 75; drops to 60)
    repEngine.process(60, true, true, t); // outOfZoneSince set
    t += 800; // stays out of envelope beyond 700ms grace period
    const dropRes = repEngine.process(60, true, true, t);

    const passed = dropRes.telemetry.state === 'UP' && dropRes.telemetry.repCount === 0;
    results.push({
      id: 'REP-04',
      name: 'Repetition Automaton: Leaving Target Zone During Hold Resets to UP',
      category: 'REPETITION_STATE',
      passed,
      expected: 'State falls back to UP when leaving target zone',
      actual: `State = ${dropRes.telemetry.state}, RepCount = ${dropRes.telemetry.repCount}`,
      details: 'Enforces that hold duration is earned strictly while maintaining target pose',
    });
  }

  // Test 2.5: Occluded joint fail-safe freezes repetition
  {
    const repEngine = new RepetitionEngine(shoulderExercise, 600);
    let t = 1000;

    repEngine.process(30, true, true, t);
    t += 500;
    repEngine.process(55, true, true, t);
    t += 500;
    // Joints become occluded (isPoseConfident = false)
    const occludedRes = repEngine.process(90, true, false, t);

    const passed = occludedRes.telemetry.phase === 'idle' && !occludedRes.isRepJustCompleted;
    results.push({
      id: 'REP-05',
      name: 'Repetition Automaton: Low Confidence / Occluded Joints Freezes Rep Counting',
      category: 'REPETITION_STATE',
      passed,
      expected: 'Rep completion strictly rejected (repCompleted = false, phase = idle)',
      actual: `RepCompleted = ${occludedRes.isRepJustCompleted}, Feedback = "${occludedRes.feedback}"`,
      details: 'Fail-safe ensures partial or missing bodies never register false exercise reps',
    });
  }

  // Test 2.6: Flutter suppression (rep faster than minRepDuration 1.2s is rejected)
  {
    const repEngine = new RepetitionEngine(shoulderExercise, 200); // 200ms hold
    let t = 1000;

    repEngine.process(30, true, true, t);
    t += 100;
    repEngine.process(55, true, true, t); // UP (t = 1100)
    t += 100;
    repEngine.process(90, true, true, t); // HOLD (t = 1200)
    t += 250;
    repEngine.process(90, true, true, t); // COMPLETE (t = 1450)
    t += 100;
    // Returns to rest at t = 1550 (total rep duration = 1550 - 1100 = 450ms < 1200ms)
    const flutterRes = repEngine.process(30, true, true, t);

    const passed = flutterRes.telemetry.repCount === 0 && !flutterRes.isRepJustCompleted;
    results.push({
      id: 'REP-06',
      name: 'Repetition Automaton: High-Frequency Glitch Flutter (< 1.2s) Rejected',
      category: 'REPETITION_STATE',
      passed,
      expected: 'Rep rejected due to excessive speed (repCount = 0)',
      actual: `RepCount = ${flutterRes.telemetry.repCount}, RepCompleted = ${flutterRes.isRepJustCompleted}, Feedback = "${flutterRes.feedback}"`,
      details: 'Prevents webcam tracking blips from generating spurious repetitions',
    });
  }

  // =========================================================================
  // SECTION 3: KINEMATIC COVERAGE (ALL 15 EXERCISES RETURN VALID ANGLES)
  // =========================================================================

  const allExercises = [
    'shoulder_raise', 'bicep_curl', 'elbow_extension', 'knee_squat', 'alternating-knee-raise',
    'stretch_neck_lateral', 'stretch_neck_flexion', 'stretch_shoulder_cross', 'stretch_triceps_overhead',
    'stretch_chest_open', 'stretch_side_bend', 'stretch_torso_twist', 'stretch_quadriceps',
    'stretch_hamstrings', 'stretch_calf', 'stretch_piriformis_seated',
  ];

  // Create standard synthetic upright human body landmarks
  const syntheticBody: PoseLandmarks = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0.0,
    visibility: 0.95,
  }));
  // Position key joints realistically
  syntheticBody[POSE_LANDMARKS.NOSE] = { x: 0.50, y: 0.15, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.LEFT_EAR] = { x: 0.46, y: 0.14, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.RIGHT_EAR] = { x: 0.54, y: 0.14, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.25, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.58, y: 0.25, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.38, y: 0.40, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.62, y: 0.40, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.LEFT_WRIST] = { x: 0.36, y: 0.55, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.64, y: 0.55, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.55, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.55, y: 0.55, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.44, y: 0.75, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.56, y: 0.75, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.44, y: 0.92, visibility: 0.98 };
  syntheticBody[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.56, y: 0.92, visibility: 0.98 };

  const engine = new AngleEngine(1.0, 16 / 9);

  let zeroCount = 0;
  const kinematicResults: string[] = [];

  // Poses that require lateral tilt, rotation, or forward hinge to measure non-zero displacement
  const naturallyZeroWhenStraight = ['stretch_neck_lateral', 'stretch_side_bend', 'stretch_torso_twist', 'stretch_hamstrings', 'stretch_piriformis_seated'];

  // Create a modified posture executing dynamic stretch (tilted head, leaned trunk, twisted shoulders)
  const stretchActiveBody: PoseLandmarks = syntheticBody.map((p) => ({ ...p }));
  stretchActiveBody[POSE_LANDMARKS.LEFT_EAR] = { x: 0.45, y: 0.11, visibility: 0.98 }; // Tilted ear line
  stretchActiveBody[POSE_LANDMARKS.RIGHT_EAR] = { x: 0.55, y: 0.19, visibility: 0.98 };
  stretchActiveBody[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.38, y: 0.23, visibility: 0.98 }; // Leaned/twisted shoulders
  stretchActiveBody[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.54, y: 0.27, visibility: 0.98 };

  for (const slug of allExercises) {
    const dummyEx: ExerciseDefinition = {
      id: 99,
      name: slug,
      slug,
      category: 'General',
      description: 'Test',
      target_joint: 'PRIMARY',
      target_angle: 90,
      min_angle: 0,
      max_angle: 180,
      target_reps: 10,
      difficulty: 'beginner',
      hold_seconds: 1,
    };

    const targetBody = naturallyZeroWhenStraight.includes(slug) ? stretchActiveBody : syntheticBody;
    const res = engine.extractExerciseAngle(targetBody, dummyEx);

    if (res.angle === 0) {
      zeroCount++;
    }
    kinematicResults.push(`${slug}: ${res.angle}° (${res.side})`);
  }

  const allHaveKinematics = zeroCount === 0;
  results.push({
    id: 'KIN-01',
    name: 'Kinematic Coverage: All 16 Exercises Have Active Trigonometry (No Zero Returns)',
    category: 'KINEMATIC_COVERAGE',
    passed: allHaveKinematics,
    expected: 'All 16 exercises return active real calculations based on their kinematic spec',
    actual: `Unmeasured zero-return count: ${zeroCount}/16 exercises`,
    details: kinematicResults.join(' | '),
  });

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  return { total, passed, failed, results };
}
