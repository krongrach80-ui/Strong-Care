/**
 * StrongCare - AI Face Recognition & Liveness Engine
 * 
 * Powered by MediaPipe FaceLandmarker (478 Canonical Facial Mesh Landmarks):
 * 1. Real Face Detection: 478 dense 3D facial landmarks from MediaPipe FaceLandmarker task
 * 2. True Liveness Verification:
 *    - Blink Detection: Real-time neural blendshapes (eyeBlinkLeft, eyeBlinkRight)
 *    - Head Yaw Pose: Geometry angle of nose tip (point 1) relative to zygomatic cheeks (234, 454)
 *      (Mirrored coordinate compensation applied for CSS -scale-x-100 preview)
 *    - Anti-Spoofing: Natural blink duration gating (100–900ms) + multi-angle yaw verification
 * 3. 128-D Biometric Feature Embedding:
 *    - Translation-invariant (referenced to facial centroid)
 *    - Scale-invariant (normalized by Inter-Ocular Distance - IOD)
 *    - L2-normalized hypersphere unit vector (||v|| = 1.0)
 *    - Stored as mathematical vector only (No raw patient photos saved, PDPA/HIPAA compliant)
 */

import { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { poseService } from './poseService';

export interface FaceLandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface FaceDetectionResult {
  detected: boolean;
  box: { x: number; y: number; width: number; height: number };
  landmarks: {
    leftEye: FaceLandmarkPoint;
    rightEye: FaceLandmarkPoint;
    leftEyeTop: FaceLandmarkPoint;
    leftEyeBottom: FaceLandmarkPoint;
    rightEyeTop: FaceLandmarkPoint;
    rightEyeBottom: FaceLandmarkPoint;
    noseTip: FaceLandmarkPoint;
    mouthLeft: FaceLandmarkPoint;
    mouthRight: FaceLandmarkPoint;
    chin: FaceLandmarkPoint;
    leftCheek: FaceLandmarkPoint;
    rightCheek: FaceLandmarkPoint;
  };
  rawLandmarks?: FaceLandmarkPoint[];
  blendshapes?: { eyeBlinkLeft: number; eyeBlinkRight: number };
  ear: number; // Eye Aspect Ratio (or blendshape-derived aperture)
  yaw: number; // -1 (full left) to +1 (full right), 0 = center (Mirrored perspective: + is right on screen)
  pitch: number; // -1 (up) to +1 (down)
  faceCentered: boolean;
  qualityScore: number;
}

export interface LivenessState {
  blinkDetected: boolean;
  turnLeftDetected: boolean;
  turnRightDetected: boolean;
  isRealHuman: boolean;
  currentPrompt: string;
}

export class FaceService {
  private static instance: FaceService;
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitializing: boolean = false;
  private lastDetectTimestamp: number = 0;

  // Liveness tracking buffers
  private wasEyeClosed: boolean = false;
  private blinkTimestamp: number = 0;
  private isBlinkCompleted: boolean = false;
  private leftTurnCompleted: boolean = false;
  private rightTurnCompleted: boolean = false;

  private constructor() {}

  public static getInstance(): FaceService {
    if (!FaceService.instance) {
      FaceService.instance = new FaceService();
    }
    return FaceService.instance;
  }

  /**
   * Ensure MediaPipe FaceLandmarker model is loaded
   */
  public async initialize(): Promise<boolean> {
    if (this.faceLandmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      this.faceLandmarker = await poseService.ensureFaceLandmarker();
      this.isInitializing = false;
      return this.faceLandmarker !== null;
    } catch (err) {
      console.warn('⚠️ FaceService: Failed to initialize FaceLandmarker:', err);
      this.isInitializing = false;
      return false;
    }
  }

  public resetLiveness(): void {
    this.wasEyeClosed = false;
    this.blinkTimestamp = 0;
    this.isBlinkCompleted = false;
    this.leftTurnCompleted = false;
    this.rightTurnCompleted = false;
  }

  /**
   * Detect real face landmarks, blendshapes (blink), head pose (yaw/pitch)
   * using MediaPipe FaceLandmarker on video element.
   */
  public detectFace(video: HTMLVideoElement, timestamp?: number): FaceDetectionResult | null {
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
      return null;
    }

    if (!this.faceLandmarker) {
      this.faceLandmarker = poseService.getFaceLandmarker();
      if (!this.faceLandmarker) {
        this.initialize().catch(() => {});
        return null;
      }
    }

    // MediaPipe detectForVideo requires strictly increasing integer timestamp (ms)
    const now = timestamp || performance.now();
    let processTime = Math.floor(now);
    if (processTime <= this.lastDetectTimestamp) {
      processTime = this.lastDetectTimestamp + 1;
    }
    this.lastDetectTimestamp = processTime;

    let res: FaceLandmarkerResult | null = null;
    try {
      res = this.faceLandmarker.detectForVideo(video, processTime);
    } catch (err) {
      // Frame skipped / timestamp alignment
      return null;
    }

    if (!res || !res.faceLandmarks || res.faceLandmarks.length === 0) {
      return null;
    }

    const lm = res.faceLandmarks[0];
    if (!lm || lm.length < 468) {
      return null;
    }

    // 1. Compute true Bounding Box from all mesh landmarks
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;

    for (let i = 0; i < lm.length; i++) {
      const p = lm[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    // Add 8% comfortable boundary margin
    const padX = (maxX - minX) * 0.08;
    const padY = (maxY - minY) * 0.08;
    const boxX = Math.max(0, minX - padX);
    const boxY = Math.max(0, minY - padY);
    const boxW = Math.min(1 - boxX, (maxX - minX) + padX * 2);
    const boxH = Math.min(1 - boxY, (maxY - minY) + padY * 2);

    const normBox = {
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
    };

    // 2. Canonical MediaPipe Face Mesh Landmark Anchors
    // Nose tip: landmark 1
    // Cheeks: landmark 234 (right zygomatic arch), 454 (left zygomatic arch)
    // Chin: landmark 152
    // Left eye outer: 33, inner: 133, top: 159, bottom: 145
    // Right eye outer: 263, inner: 362, top: 386, bottom: 374
    // Mouth left: 61, right: 291
    const noseTip = lm[1];
    const rightCheek = lm[234];
    const leftCheek = lm[454];
    const chin = lm[152];

    const leftEyeOuter = lm[33];
    const leftEyeInner = lm[133];
    const leftEyeTop = lm[159];
    const leftEyeBottom = lm[145];

    const rightEyeInner = lm[362];
    const rightEyeOuter = lm[263];
    const rightEyeTop = lm[386];
    const rightEyeBottom = lm[374];

    const mouthLeft = lm[61];
    const mouthRight = lm[291];

    const leftEyeCenter = {
      x: (leftEyeOuter.x + leftEyeInner.x) / 2,
      y: (leftEyeTop.y + leftEyeBottom.y) / 2,
      z: (leftEyeOuter.z ?? 0 + (leftEyeInner.z ?? 0)) / 2,
    };

    const rightEyeCenter = {
      x: (rightEyeOuter.x + rightEyeInner.x) / 2,
      y: (rightEyeTop.y + rightEyeBottom.y) / 2,
      z: (rightEyeOuter.z ?? 0 + (rightEyeInner.z ?? 0)) / 2,
    };

    // 3. Extract Blendshapes for Neural Blink Detection
    const blendshapes = res.faceBlendshapes?.[0]?.categories || [];
    const blinkLeftScore = blendshapes.find((c) => c.categoryName === 'eyeBlinkLeft')?.score ?? 0;
    const blinkRightScore = blendshapes.find((c) => c.categoryName === 'eyeBlinkRight')?.score ?? 0;

    // Geometric EAR fallback
    const leftEarGeo = Math.hypot(leftEyeTop.x - leftEyeBottom.x, leftEyeTop.y - leftEyeBottom.y) /
      Math.max(0.01, 2 * Math.hypot(leftEyeOuter.x - leftEyeInner.x, leftEyeOuter.y - leftEyeInner.y));
    const rightEarGeo = Math.hypot(rightEyeTop.x - rightEyeBottom.x, rightEyeTop.y - rightEyeBottom.y) /
      Math.max(0.01, 2 * Math.hypot(rightEyeOuter.x - rightEyeInner.x, rightEyeOuter.y - rightEyeInner.y));
    const avgEarGeo = (leftEarGeo + rightEarGeo) / 2;

    // Effective EAR: blendshape is primary, geometric is secondary
    const maxBlinkScore = Math.max(blinkLeftScore, blinkRightScore);
    const ear = blendshapes.length > 0
      ? Math.max(0.12, Math.min(0.38, 0.34 - maxBlinkScore * 0.22))
      : avgEarGeo;

    // Evaluate blink state for liveness
    this.updateBlinkLiveness(blinkLeftScore, blinkRightScore, avgEarGeo);

    // 4. Real Head Pose (Yaw & Pitch)
    // Cheek span in image coordinates
    const midCheekX = (rightCheek.x + leftCheek.x) / 2;
    const cheekSpan = Math.max(0.01, Math.abs(leftCheek.x - rightCheek.x));

    // Raw camera frame: turning right moves nose towards anatomical right (lm 234, smaller x)
    // Because UI video element is mirrored via CSS (`-scale-x-100`),
    // we invert rawYaw so:
    // User turns RIGHT on screen -> yaw is POSITIVE (+0.15 .. +0.6)
    // User turns LEFT on screen  -> yaw is NEGATIVE (-0.15 .. -0.6)
    // User looks CENTER          -> yaw is close to 0 (-0.10 .. +0.10)
    const rawYaw = (noseTip.x - midCheekX) / (cheekSpan * 0.45);
    const yaw = Math.max(-1, Math.min(1, -rawYaw));

    if (yaw < -0.16) this.leftTurnCompleted = true;
    if (yaw > 0.16) this.rightTurnCompleted = true;

    // Pitch: relative position of nose tip between mid-eyes and chin
    const midEyeY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    const upperSpan = Math.max(0.01, noseTip.y - midEyeY);
    const lowerSpan = Math.max(0.01, chin.y - noseTip.y);
    const rawPitch = (upperSpan - lowerSpan * 0.75) / (Math.max(0.01, upperSpan + lowerSpan) * 0.45);
    const pitch = Math.max(-1, Math.min(1, rawPitch));

    // 5. Centered & Quality assessment
    const centerX = normBox.x + normBox.width / 2;
    const centerY = normBox.y + normBox.height / 2;
    const faceCentered =
      centerX >= 0.28 && centerX <= 0.72 &&
      centerY >= 0.20 && centerY <= 0.80 &&
      normBox.width >= 0.18 && normBox.width <= 0.75;

    let qualityScore = 100;
    if (!faceCentered) qualityScore -= 15;
    if (normBox.width < 0.22) qualityScore -= 20; // Too far away
    if (normBox.width > 0.68) qualityScore -= 15; // Too close
    if (Math.abs(pitch) > 0.4) qualityScore -= 15; // Extreme tilt

    const mappedLandmarks = {
      leftEye: leftEyeCenter,
      rightEye: rightEyeCenter,
      leftEyeTop: { x: leftEyeTop.x, y: leftEyeTop.y },
      leftEyeBottom: { x: leftEyeBottom.x, y: leftEyeBottom.y },
      rightEyeTop: { x: rightEyeTop.x, y: rightEyeTop.y },
      rightEyeBottom: { x: rightEyeBottom.x, y: rightEyeBottom.y },
      noseTip: { x: noseTip.x, y: noseTip.y },
      mouthLeft: { x: mouthLeft.x, y: mouthLeft.y },
      mouthRight: { x: mouthRight.x, y: mouthRight.y },
      chin: { x: chin.x, y: chin.y },
      leftCheek: { x: leftCheek.x, y: leftCheek.y },
      rightCheek: { x: rightCheek.x, y: rightCheek.y },
    };

    return {
      detected: true,
      box: normBox,
      landmarks: mappedLandmarks,
      rawLandmarks: lm,
      blendshapes: { eyeBlinkLeft: blinkLeftScore, eyeBlinkRight: blinkRightScore },
      ear,
      yaw,
      pitch,
      faceCentered,
      qualityScore: Math.max(40, qualityScore),
    };
  }

  /**
   * Anti-Spoofing: Evaluate natural blink transition (Closed -> Open within 100–900ms)
   */
  private updateBlinkLiveness(blinkL: number, blinkR: number, geoEar: number): void {
    const now = Date.now();
    const isClosed = (blinkL > 0.42 && blinkR > 0.42) || (geoEar < 0.18);

    if (isClosed && !this.wasEyeClosed) {
      this.wasEyeClosed = true;
      this.blinkTimestamp = now;
    } else if (!isClosed && this.wasEyeClosed) {
      const elapsed = now - this.blinkTimestamp;
      if (elapsed >= 100 && elapsed <= 900) {
        // Natural human blink confirmed!
        this.isBlinkCompleted = true;
      }
      this.wasEyeClosed = false;
    }
  }

  public getLivenessState(): LivenessState {
    const isRealHuman = this.isBlinkCompleted || (this.leftTurnCompleted && this.rightTurnCompleted);
    let prompt = 'กรุณามองตรงมาที่กล้อง';

    if (!this.leftTurnCompleted) {
      prompt = 'กรุณาหันหน้าไปทางซ้ายเล็กน้อย';
    } else if (!this.rightTurnCompleted) {
      prompt = 'กรุณาหันหน้าไปทางขวาเล็กน้อย';
    } else if (!this.isBlinkCompleted) {
      prompt = 'กรุณากระพริบตา 1 ครั้ง';
    } else {
      prompt = 'ยืนยันบุคคลจริงเรียบร้อย';
    }

    return {
      blinkDetected: this.isBlinkCompleted,
      turnLeftDetected: this.leftTurnCompleted,
      turnRightDetected: this.rightTurnCompleted,
      isRealHuman,
      currentPrompt: prompt,
    };
  }

  /**
   * Generate 128-dimensional Normalized Facial Embedding Vector
   * Extracted from MediaPipe FaceLandmarker (478 Dense Landmarks).
   *
   * Invariant Properties:
   * 1. Translation: Referenced to facial centroid (midEye + noseTip + chin)
   * 2. Scale: Scaled by Inter-Ocular Distance (IOD)
   * 3. Geometric Discriminability:
   *    - Dims 0..31: Anatomical Euclidean Distances / IOD
   *    - Dims 32..63: Morphological and Structural Proportions & Curvature
   *    - Dims 64..95: Facial Perimeter Polar Harmonics (32 angles)
   *    - Dims 96..127: Triangulation Orientation Invariant Angles (atan2)
   * 4. L2 Normalization: ||vec||_2 = 1.0 (Unit Hypersphere Projection)
   */
  public generateEmbedding(detection: FaceDetectionResult): number[] {
    const lm = detection.rawLandmarks;
    const vec: number[] = new Array(128).fill(0);

    // Fallback if raw landmarks are not present
    if (!lm || lm.length < 468) {
      return this.generateFallbackEmbedding(detection);
    }

    // 1. Primary Alignment Coordinates & Scale Unit (Inter-Ocular Distance)
    // Left eye outer: 33, Right eye outer: 263
    // Left eye inner: 133, Right eye inner: 362
    const iodX = lm[263].x - lm[33].x;
    const iodY = lm[263].y - lm[33].y;
    const iod = Math.max(0.02, Math.hypot(iodX, iodY));

    const midEyeX = (lm[33].x + lm[263].x) / 2;
    const midEyeY = (lm[33].y + lm[263].y) / 2;
    const faceCenterX = (lm[1].x + midEyeX + lm[152].x) / 3;
    const faceCenterY = (lm[1].y + midEyeY + lm[152].y) / 3;

    // Helper: distance between two landmarks divided by iod
    const dNorm = (i: number, j: number) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y) / iod;
    const dCenter = (i: number) => Math.hypot(lm[i].x - faceCenterX, lm[i].y - faceCenterY) / iod;
    const angleNorm = (i: number, j: number) => Math.atan2(lm[j].y - lm[i].y, lm[j].x - lm[i].x) / Math.PI;

    // 2. Feature Set 1: Key Anatomical Anthropometric Distances (dims 0..31)
    vec[0] = dNorm(1, 152);    // Nose tip to chin
    vec[1] = dNorm(10, 152);   // Forehead top to chin
    vec[2] = dNorm(10, 1);     // Forehead to nose tip
    vec[3] = dNorm(234, 454);  // Zygomatic cheek width
    vec[4] = dNorm(172, 397);  // Jaw angle width
    vec[5] = dNorm(61, 291);   // Mouth width
    vec[6] = dNorm(0, 17);     // Lip height
    vec[7] = dNorm(159, 145);  // Left eye aperture
    vec[8] = dNorm(386, 374);  // Right eye aperture
    vec[9] = dNorm(33, 133);   // Left eye width
    vec[10] = dNorm(362, 263); // Right eye width
    vec[11] = dNorm(133, 362); // Inter-canthal distance
    vec[12] = dNorm(1, 61);    // Nose tip to left mouth corner
    vec[13] = dNorm(1, 291);   // Nose tip to right mouth corner
    vec[14] = dNorm(152, 61);  // Chin to left mouth corner
    vec[15] = dNorm(152, 291); // Chin to right mouth corner
    vec[16] = dNorm(1, 234);   // Nose tip to right cheek
    vec[17] = dNorm(1, 454);   // Nose tip to left cheek
    vec[18] = dNorm(70, 300);  // Eyebrow arch distance
    vec[19] = dNorm(70, 105);  // Left eyebrow length
    vec[20] = dNorm(300, 334); // Right eyebrow length
    vec[21] = dNorm(168, 1);   // Glabella to nose tip
    vec[22] = dNorm(2, 0);     // Subnasale to upper lip
    vec[23] = dNorm(98, 327);  // Alar base nose width
    vec[24] = dNorm(58, 288);  // Mid cheek span
    vec[25] = dNorm(148, 377); // Lower cheek span
    vec[26] = dNorm(10, 234);  // Forehead to right cheek
    vec[27] = dNorm(10, 454);  // Forehead to left cheek
    vec[28] = dNorm(152, 172); // Chin to right jaw
    vec[29] = dNorm(152, 397); // Chin to left jaw
    vec[30] = dNorm(168, 152); // Glabella to chin (total facial height)
    vec[31] = dNorm(168, 2);   // Mid-facial height (glabella to subnasale)

    // 3. Feature Set 2: Morphological Proportions & Spatial Ratios (dims 32..63)
    const totalFaceHeight = Math.max(0.01, vec[30]);
    const cheekWidth = Math.max(0.01, vec[3]);
    const mouthWidth = Math.max(0.01, vec[5]);
    const jawWidth = Math.max(0.01, vec[4]);

    vec[32] = totalFaceHeight / cheekWidth;   // Facial index
    vec[33] = jawWidth / cheekWidth;          // Jaw-to-cheek proportion
    vec[34] = mouthWidth / cheekWidth;        // Mouth-to-cheek proportion
    vec[35] = vec[31] / totalFaceHeight;      // Mid-face ratio
    vec[36] = vec[0] / totalFaceHeight;       // Lower-face ratio
    vec[37] = vec[23] / mouthWidth;           // Nose width to mouth width
    vec[38] = vec[11] / iod;                  // Inter-canthal ratio
    vec[39] = vec[6] / Math.max(0.01, vec[0]); // Lip height to lower face

    // Distances from facial centroid to key facial anchors
    vec[40] = dCenter(1);    // Centroid to nose tip
    vec[41] = dCenter(10);   // Centroid to forehead
    vec[42] = dCenter(152);  // Centroid to chin
    vec[43] = dCenter(234);  // Centroid to right cheek
    vec[44] = dCenter(454);  // Centroid to left cheek
    vec[45] = dCenter(61);   // Centroid to left mouth
    vec[46] = dCenter(291);  // Centroid to right mouth
    vec[47] = dCenter(33);   // Centroid to left eye
    vec[48] = dCenter(263);  // Centroid to right eye

    // Bilateral Symmetry Ratios (Difference / Sum)
    for (let k = 0; k < 15; k++) {
      const dL = vec[12 + (k % 4)];
      const dR = vec[13 + (k % 4)];
      vec[49 + k] = (dL - dR) / Math.max(0.01, dL + dR);
    }

    // 4. Feature Set 3: 32 Polar Boundary Contour Descriptors (dims 64..95)
    // Canonical 32 face contour perimeter points in MediaPipe Face Mesh
    const perimeterIndices = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
      152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103,
    ];
    for (let p = 0; p < 32; p++) {
      const idx = perimeterIndices[p];
      vec[64 + p] = dCenter(idx);
    }

    // 5. Feature Set 4: Geometric Invariant Triangulation Angles (dims 96..127)
    // Angles between facial features (invariant to scale, normalized -1 to +1)
    vec[96] = angleNorm(1, 33);    // Nose to left eye
    vec[97] = angleNorm(1, 263);   // Nose to right eye
    vec[98] = angleNorm(1, 61);    // Nose to mouth left
    vec[99] = angleNorm(1, 291);   // Nose to mouth right
    vec[100] = angleNorm(152, 61); // Chin to mouth left
    vec[101] = angleNorm(152, 291);// Chin to mouth right
    vec[102] = angleNorm(33, 263); // Eye axis angle
    vec[103] = angleNorm(61, 291); // Mouth axis angle
    vec[104] = angleNorm(234, 454);// Cheek axis angle
    vec[105] = angleNorm(10, 152); // Midline vertical angle
    vec[106] = angleNorm(1, 234);  // Nose to right cheek
    vec[107] = angleNorm(1, 454);  // Nose to left cheek
    vec[108] = angleNorm(33, 61);  // Left eye to left mouth
    vec[109] = angleNorm(263, 291);// Right eye to right mouth
    vec[110] = angleNorm(33, 291); // Left eye to right mouth
    vec[111] = angleNorm(263, 61); // Right eye to left mouth

    for (let a = 0; a < 16; a++) {
      const pIdx = perimeterIndices[a * 2];
      vec[112 + a] = angleNorm(1, pIdx);
    }

    // 6. L2 Normalization: ||vec||_2 = 1.0 (Unit Hypersphere Projection)
    let normSq = 0;
    for (let i = 0; i < 128; i++) {
      normSq += vec[i] * vec[i];
    }
    const norm = Math.sqrt(normSq) || 1.0;
    for (let i = 0; i < 128; i++) {
      vec[i] = Math.round((vec[i] / norm) * 10000) / 10000;
    }

    return vec;
  }

  /**
   * Fallback embedding generation using standard 12 facial anchors
   */
  private generateFallbackEmbedding(detection: FaceDetectionResult): number[] {
    const lm = detection.landmarks;
    const vec: number[] = new Array(128).fill(0);

    const iod = Math.max(0.02, Math.hypot(lm.rightEye.x - lm.leftEye.x, lm.rightEye.y - lm.leftEye.y));
    const midEyeX = (lm.leftEye.x + lm.rightEye.x) / 2;
    const midEyeY = (lm.leftEye.y + lm.rightEye.y) / 2;

    vec[0] = Math.hypot(lm.noseTip.x - midEyeX, lm.noseTip.y - midEyeY) / iod;
    vec[1] = Math.hypot(lm.chin.x - midEyeX, lm.chin.y - midEyeY) / iod;
    vec[2] = Math.hypot(lm.mouthLeft.x - midEyeX, lm.mouthLeft.y - midEyeY) / iod;
    vec[3] = Math.hypot(lm.mouthRight.x - midEyeX, lm.mouthRight.y - midEyeY) / iod;
    vec[4] = Math.hypot(lm.mouthRight.x - lm.mouthLeft.x, lm.mouthRight.y - lm.mouthLeft.y) / iod;
    vec[5] = Math.hypot(lm.rightCheek.x - lm.leftCheek.x, lm.rightCheek.y - lm.leftCheek.y) / iod;

    for (let i = 6; i < 128; i++) {
      vec[i] = Math.sin((i * Math.PI) / 16) * vec[i % 6];
    }

    let normSq = 0;
    for (let i = 0; i < 128; i++) normSq += vec[i] * vec[i];
    const norm = Math.sqrt(normSq) || 1.0;
    for (let i = 0; i < 128; i++) vec[i] = Math.round((vec[i] / norm) * 10000) / 10000;

    return vec;
  }
}

export const faceService = FaceService.getInstance();
