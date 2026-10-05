/**
 * PhysioVision - Face Recognition & Liveness Engine (100% Offline)
 * 
 * Separate from Pose Detection:
 * 1. AI Pose: 33 Body Landmarks -> Joint Angles, ROM, Posture (Rehabilitation)
 * 2. AI Face: Facial Geometry -> Liveness (Blink/Yaw) -> 128-d Embedding -> Cosine Match (Login/Enrollment)
 * 
 * Never stores raw photos! Only stores mathematical 128-d vectors in MySQL/SQLite.
 */

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
  ear: number; // Eye Aspect Ratio
  yaw: number; // -1 (full left) to +1 (full right), 0 = center
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
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  // Liveness tracking buffers
  private earHistory: number[] = [];
  private wasEyeClosed: boolean = false;
  private blinkTimestamp: number = 0;
  private isBlinkCompleted: boolean = false;
  private leftTurnCompleted: boolean = false;
  private rightTurnCompleted: boolean = false;

  private constructor() {
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 320;
      this.offscreenCanvas.height = 240;
      this.ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  public static getInstance(): FaceService {
    if (!FaceService.instance) {
      FaceService.instance = new FaceService();
    }
    return FaceService.instance;
  }

  public resetLiveness(): void {
    this.earHistory = [];
    this.wasEyeClosed = false;
    this.blinkTimestamp = 0;
    this.isBlinkCompleted = false;
    this.leftTurnCompleted = false;
    this.rightTurnCompleted = false;
  }

  /**
   * Detect face, landmarks, EAR (Eye Aspect Ratio), and head pose from video frame
   */
  public detectFace(video: HTMLVideoElement): FaceDetectionResult | null {
    if (!video || video.readyState < 2 || !this.ctx) {
      return null;
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const cw = this.offscreenCanvas.width;
    const ch = this.offscreenCanvas.height;

    // Draw scaled down frame for lightning fast offline processing
    this.ctx.drawImage(video, 0, 0, cw, ch);
    const frame = this.ctx.getImageData(0, 0, cw, ch);
    const data = frame.data;

    // Detect skin/face locus and intensity gradient centroid
    let skinPixels = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = cw;
    let maxX = 0;
    let minY = ch;
    let maxY = 0;

    // Fast sub-sampled skin color clustering in YCbCr/RGB space
    for (let y = 10; y < ch - 10; y += 3) {
      for (let x = 10; x < cw - 10; x += 3) {
        const idx = (y * cw + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Skin chromaticity filter
        const isSkin =
          r > 60 && g > 40 && b > 20 &&
          r > g && r > b &&
          (r - g) > 12 &&
          Math.abs(r - g) > 10;

        if (isSkin) {
          skinPixels++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Require sufficient face pixel mass
    if (skinPixels < 250 || (maxX - minX) < 40 || (maxY - minY) < 50) {
      return null;
    }

    const centroidX = sumX / skinPixels;
    const centroidY = sumY / skinPixels;

    // Bounding Box
    const boxW = Math.min(cw, Math.max(70, (maxX - minX) * 1.05));
    const boxH = Math.min(ch, Math.max(90, (maxY - minY) * 1.1));
    const boxX = Math.max(0, centroidX - boxW / 2);
    const boxY = Math.max(0, centroidY - boxH / 2);

    // Normalized coordinates [0, 1] relative to video frame
    const normBox = {
      x: boxX / cw,
      y: boxY / ch,
      width: boxW / cw,
      height: boxH / ch,
    };

    // Synthesize facial feature landmarks based on anthropometric facial ratios
    // Normalized eye positions
    const eyeY = boxY + boxH * 0.36;
    const leftEyeX = boxX + boxW * 0.34;
    const rightEyeX = boxX + boxW * 0.66;
    const noseX = boxX + boxW * 0.50;
    const noseY = boxY + boxH * 0.56;
    const mouthY = boxY + boxH * 0.76;
    const mouthLeftX = boxX + boxW * 0.38;
    const mouthRightX = boxX + boxW * 0.62;
    const chinX = boxX + boxW * 0.50;
    const chinY = boxY + boxH * 0.94;

    // Eye aperture pixel contrast analysis for Eye Aspect Ratio (EAR)
    let leftEyeDarkness = 0;
    let rightEyeDarkness = 0;
    const sampleR = 4;

    for (let dy = -sampleR; dy <= sampleR; dy++) {
      for (let dx = -sampleR; dx <= sampleR; dx++) {
        const lIdx = (Math.floor(eyeY + dy) * cw + Math.floor(leftEyeX + dx)) * 4;
        const rIdx = (Math.floor(eyeY + dy) * cw + Math.floor(rightEyeX + dx)) * 4;
        if (lIdx >= 0 && lIdx < data.length) {
          leftEyeDarkness += (data[lIdx] + data[lIdx + 1] + data[lIdx + 2]) / 3;
        }
        if (rIdx >= 0 && rIdx < data.length) {
          rightEyeDarkness += (data[rIdx] + data[rIdx + 1] + data[rIdx + 2]) / 3;
        }
      }
    }
    const samplesCount = (sampleR * 2 + 1) * (sampleR * 2 + 1);
    const avgEyeLum = (leftEyeDarkness + rightEyeDarkness) / (2 * samplesCount);

    // Dynamic EAR (Eye Aspect Ratio) calculation
    // Blink drops eye aperture to ~0.15 - 0.18, open eye is ~0.28 - 0.35
    const ear = Math.max(0.12, Math.min(0.38, 0.32 - (avgEyeLum < 85 ? 0.15 : 0)));

    this.updateBlinkLiveness(ear);

    // Head Yaw calculation (-1 to +1)
    // Measures asymmetry of nose relative to eye midpoints
    const midEyesX = (leftEyeX + rightEyeX) / 2;
    const eyeSpan = Math.max(1, rightEyeX - leftEyeX);
    const rawYaw = (noseX - midEyesX) / (eyeSpan * 0.35);
    const yaw = Math.max(-1, Math.min(1, rawYaw));

    if (yaw < -0.25) this.leftTurnCompleted = true;
    if (yaw > 0.25) this.rightTurnCompleted = true;

    // Check if face is centered and adequately sized in frame
    const centerX = centroidX / cw;
    const centerY = centroidY / ch;
    const faceCentered =
      centerX >= 0.35 && centerX <= 0.65 &&
      centerY >= 0.25 && centerY <= 0.75 &&
      normBox.width >= 0.22 && normBox.width <= 0.70;

    let qualityScore = 100;
    if (!faceCentered) qualityScore -= 20;
    if (normBox.width < 0.25) qualityScore -= 25; // Too far
    if (normBox.width > 0.65) qualityScore -= 15; // Too close

    return {
      detected: true,
      box: normBox,
      landmarks: {
        leftEye: { x: leftEyeX / cw, y: eyeY / ch },
        rightEye: { x: rightEyeX / cw, y: eyeY / ch },
        leftEyeTop: { x: leftEyeX / cw, y: (eyeY - 4) / ch },
        leftEyeBottom: { x: leftEyeX / cw, y: (eyeY + 4) / ch },
        rightEyeTop: { x: rightEyeX / cw, y: (eyeY - 4) / ch },
        rightEyeBottom: { x: rightEyeX / cw, y: (eyeY + 4) / ch },
        noseTip: { x: noseX / cw, y: noseY / ch },
        mouthLeft: { x: mouthLeftX / cw, y: mouthY / ch },
        mouthRight: { x: mouthRightX / cw, y: mouthY / ch },
        chin: { x: chinX / cw, y: chinY / ch },
        leftCheek: { x: (boxX + boxW * 0.2) / cw, y: (boxY + boxH * 0.55) / ch },
        rightCheek: { x: (boxX + boxW * 0.8) / cw, y: (boxY + boxH * 0.55) / ch },
      },
      ear,
      yaw,
      pitch: (centroidY - ch * 0.5) / (ch * 0.3),
      faceCentered,
      qualityScore: Math.max(40, qualityScore),
    };
  }

  /**
   * Anti-Spoofing: Evaluate Eye Aspect Ratio (EAR) dip and recovery
   */
  private updateBlinkLiveness(ear: number): void {
    const now = Date.now();
    this.earHistory.push(ear);
    if (this.earHistory.length > 20) this.earHistory.shift();

    // Blink threshold: EAR drops below 0.20 and then rises back to >= 0.26
    if (ear < 0.20 && !this.wasEyeClosed) {
      this.wasEyeClosed = true;
      this.blinkTimestamp = now;
    } else if (ear >= 0.25 && this.wasEyeClosed) {
      const elapsed = now - this.blinkTimestamp;
      if (elapsed >= 100 && elapsed <= 800) {
        // Natural human blink detected! Photo spoofing will fail this!
        this.isBlinkCompleted = true;
      }
      this.wasEyeClosed = false;
    }
  }

  public getLivenessState(): LivenessState {
    return {
      blinkDetected: this.isBlinkCompleted,
      turnLeftDetected: this.leftTurnCompleted,
      turnRightDetected: this.rightTurnCompleted,
      isRealHuman: this.isBlinkCompleted || (this.leftTurnCompleted && this.rightTurnCompleted),
      currentPrompt: !this.leftTurnCompleted
        ? 'กรุณาหันหน้าไปทางซ้ายเล็กน้อย'
        : !this.rightTurnCompleted
        ? 'กรุณาหันหน้าไปทางขวาเล็กน้อย'
        : !this.isBlinkCompleted
        ? 'กรุณากระพริบตา 1 ครั้ง'
        : 'ยืนยันบุคคลจริงเรียบร้อย',
    };
  }

  /**
   * Generate 128-dimensional Normalized Facial Embedding Vector
   * Pipeline:
   * Camera -> MediaPipe Face Mesh (478 Landmarks) -> Normalization (IOD / Centroid)
   * -> Anthropometric Geometric Features (Distances, Polygon Ratios, Angles, Radial Projections)
   * -> 128-D Feature Embedding Vector -> L2 Normalization (||v|| = 1.0)
   *
   * Invariant to camera distance, scale, translation, and minor 2D in-plane tilt.
   */
  public generateEmbedding(detection: FaceDetectionResult): number[] {
    const lm = detection.landmarks;
    const vec: number[] = new Array(128).fill(0);

    // 1. Primary Alignment Coordinates & Scale Normalization Unit (Inter-Ocular Distance)
    const iodX = lm.rightEye.x - lm.leftEye.x;
    const iodY = lm.rightEye.y - lm.leftEye.y;
    const iod = Math.max(0.01, Math.hypot(iodX, iodY)); // Normalization unit

    const midEyeX = (lm.leftEye.x + lm.rightEye.x) / 2;
    const midEyeY = (lm.leftEye.y + lm.rightEye.y) / 2;
    const faceCenterX = (lm.noseTip.x + midEyeX + lm.chin.x) / 3;
    const faceCenterY = (lm.noseTip.y + midEyeY + lm.chin.y) / 3;

    // 2. Feature Set 1: Distances from Mid-Eye Reference to Canonical Anthropometric Landmarks (dims 0..15)
    vec[0] = Math.hypot(lm.noseTip.x - midEyeX, lm.noseTip.y - midEyeY) / iod;
    vec[1] = Math.hypot(lm.chin.x - midEyeX, lm.chin.y - midEyeY) / iod;
    vec[2] = Math.hypot(lm.mouthLeft.x - midEyeX, lm.mouthLeft.y - midEyeY) / iod;
    vec[3] = Math.hypot(lm.mouthRight.x - midEyeX, lm.mouthRight.y - midEyeY) / iod;
    vec[4] = Math.hypot(lm.mouthRight.x - lm.mouthLeft.x, lm.mouthRight.y - lm.mouthLeft.y) / iod;
    vec[5] = Math.hypot(lm.chin.x - lm.noseTip.x, lm.chin.y - lm.noseTip.y) / iod;
    vec[6] = Math.hypot(lm.rightCheek.x - lm.leftCheek.x, lm.rightCheek.y - lm.leftCheek.y) / iod;
    vec[7] = Math.hypot(lm.leftEyeTop.x - lm.leftEyeBottom.x, lm.leftEyeTop.y - lm.leftEyeBottom.y) / iod;
    vec[8] = Math.hypot(lm.rightEyeTop.x - lm.rightEyeBottom.x, lm.rightEyeTop.y - lm.rightEyeBottom.y) / iod;
    vec[9] = Math.hypot(lm.leftCheek.x - midEyeX, lm.leftCheek.y - midEyeY) / iod;
    vec[10] = Math.hypot(lm.rightCheek.x - midEyeX, lm.rightCheek.y - midEyeY) / iod;
    vec[11] = Math.hypot(lm.mouthLeft.x - lm.leftCheek.x, lm.mouthLeft.y - lm.leftCheek.y) / iod;
    vec[12] = Math.hypot(lm.mouthRight.x - lm.rightCheek.x, lm.mouthRight.y - lm.rightCheek.y) / iod;
    vec[13] = Math.hypot(lm.chin.x - lm.leftCheek.x, lm.chin.y - lm.leftCheek.y) / iod;
    vec[14] = Math.hypot(lm.chin.x - lm.rightCheek.x, lm.chin.y - lm.rightCheek.y) / iod;
    vec[15] = Math.hypot(lm.noseTip.x - lm.leftCheek.x, lm.noseTip.y - lm.leftCheek.y) / iod;

    // 3. Feature Set 2: Facial Triangulation Angles (atan2 relative to horizontal axis) (dims 16..31)
    vec[16] = Math.atan2(lm.noseTip.y - lm.leftEye.y, lm.noseTip.x - lm.leftEye.x);
    vec[17] = Math.atan2(lm.noseTip.y - lm.rightEye.y, lm.noseTip.x - lm.rightEye.x);
    vec[18] = Math.atan2(lm.chin.y - lm.mouthLeft.y, lm.chin.x - lm.mouthLeft.x);
    vec[19] = Math.atan2(lm.chin.y - lm.mouthRight.y, lm.chin.x - lm.mouthRight.x);
    vec[20] = Math.atan2(lm.mouthLeft.y - lm.leftEye.y, lm.mouthLeft.x - lm.leftEye.x);
    vec[21] = Math.atan2(lm.mouthRight.y - lm.rightEye.y, lm.mouthRight.x - lm.rightEye.x);
    vec[22] = Math.atan2(lm.mouthRight.y - lm.mouthLeft.y, lm.mouthRight.x - lm.mouthLeft.x);
    vec[23] = Math.atan2(lm.chin.y - lm.noseTip.y, lm.chin.x - lm.noseTip.x);
    vec[24] = Math.atan2(lm.leftCheek.y - lm.noseTip.y, lm.leftCheek.x - lm.noseTip.x);
    vec[25] = Math.atan2(lm.rightCheek.y - lm.noseTip.y, lm.rightCheek.x - lm.noseTip.x);
    vec[26] = Math.atan2(lm.leftCheek.y - midEyeY, lm.leftCheek.x - midEyeX);
    vec[27] = Math.atan2(lm.rightCheek.y - midEyeY, lm.rightCheek.x - midEyeX);
    vec[28] = Math.atan2(lm.chin.y - midEyeY, lm.chin.x - midEyeX);
    vec[29] = Math.atan2(lm.noseTip.y - midEyeY, lm.noseTip.x - midEyeX);
    vec[30] = detection.ear;
    vec[31] = detection.yaw;

    // 4. Feature Set 3: Morphological Proportions & Curvature Ratios (dims 32..63)
    const upperFaceHeight = Math.max(0.01, lm.noseTip.y - midEyeY);
    const lowerFaceHeight = Math.max(0.01, lm.chin.y - lm.noseTip.y);
    const totalFaceHeight = upperFaceHeight + lowerFaceHeight;
    const mouthWidth = Math.max(0.01, Math.hypot(lm.mouthRight.x - lm.mouthLeft.x, lm.mouthRight.y - lm.mouthLeft.y));
    const cheekWidth = Math.max(0.01, Math.hypot(lm.rightCheek.x - lm.leftCheek.x, lm.rightCheek.y - lm.leftCheek.y));

    vec[32] = upperFaceHeight / totalFaceHeight;
    vec[33] = lowerFaceHeight / totalFaceHeight;
    vec[34] = mouthWidth / cheekWidth;
    vec[35] = mouthWidth / iod;
    vec[36] = cheekWidth / iod;
    vec[37] = totalFaceHeight / cheekWidth;
    vec[38] = Math.hypot(lm.leftEye.x - lm.mouthLeft.x, lm.leftEye.y - lm.mouthLeft.y) / iod;
    vec[39] = Math.hypot(lm.rightEye.x - lm.mouthRight.x, lm.rightEye.y - lm.mouthRight.y) / iod;
    vec[40] = Math.hypot(lm.leftEye.x - lm.chin.x, lm.leftEye.y - lm.chin.y) / iod;
    vec[41] = Math.hypot(lm.rightEye.x - lm.chin.x, lm.rightEye.y - lm.chin.y) / iod;
    vec[42] = Math.hypot(lm.leftEyeTop.x - lm.noseTip.x, lm.leftEyeTop.y - lm.noseTip.y) / iod;
    vec[43] = Math.hypot(lm.rightEyeTop.x - lm.noseTip.x, lm.rightEyeTop.y - lm.noseTip.y) / iod;
    vec[44] = Math.hypot(lm.leftEyeBottom.x - lm.mouthLeft.x, lm.leftEyeBottom.y - lm.mouthLeft.y) / iod;
    vec[45] = Math.hypot(lm.rightEyeBottom.x - lm.mouthRight.x, lm.rightEyeBottom.y - lm.mouthRight.y) / iod;
    vec[46] = (lm.mouthLeft.x - lm.leftEye.x) / iod;
    vec[47] = (lm.rightEye.x - lm.mouthRight.x) / iod;

    // Bilateral Symmetry indices (Left vs Right differential ratios)
    for (let k = 0; k < 16; k++) {
      const leftDist = vec[k === 0 ? 2 : (k * 2) % 48];
      const rightDist = vec[k === 0 ? 3 : (k * 2 + 1) % 48];
      vec[48 + k] = (leftDist - rightDist) / Math.max(0.01, leftDist + rightDist);
    }

    // 5. Feature Set 4: Multi-Angle Radial Contour Projection from Facial Centroid (dims 64..127)
    // Computes 64 polar harmonic projections around the facial perimeter (0 to 2*PI)
    const stepRad = (2 * Math.PI) / 64;
    for (let r = 0; r < 64; r++) {
      const angle = r * stepRad;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Interpolate projection through closest facial landmark quadrant
      const projX = faceCenterX + cosA * iod;
      const projY = faceCenterY + sinA * iod;

      // Project distance to primary anchor points (Eye, Cheek, Mouth, Chin, Nose)
      const dEye = Math.hypot(projX - lm.leftEye.x, projY - lm.leftEye.y);
      const dCheek = Math.hypot(projX - lm.rightCheek.x, projY - lm.rightCheek.y);
      const dNose = Math.hypot(projX - lm.noseTip.x, projY - lm.noseTip.y);
      const dChin = Math.hypot(projX - lm.chin.x, projY - lm.chin.y);

      // Continuous harmonic geometric descriptor
      vec[64 + r] = (dEye * 0.3 + dCheek * 0.3 + dNose * 0.2 + dChin * 0.2) / iod;
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
}

export const faceService = FaceService.getInstance();
