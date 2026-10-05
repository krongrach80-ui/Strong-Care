import {
  FilesetResolver,
  PoseLandmarker,
  PoseLandmarkerResult,
  HandLandmarker,
  HandLandmarkerResult,
  FaceLandmarker,
  FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { PoseLandmarks, HolisticDetectionResult } from '../types/pose';
import { LandmarkSmoother } from '../algorithms/smoothing';

export class PoseService {
  private static instance: PoseService;
  private landmarker: PoseLandmarker | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;

  private isInitializing: boolean = false;
  private smoother = new LandmarkSmoother(0.7);
  private isMockMode: boolean = false;
  private mockTime: number = 0;

  private lastHandResult: PoseLandmarks[] | null = null;
  private lastFaceResult: PoseLandmarks | null = null;
  private frameCount: number = 0;

  public static getInstance(): PoseService {
    if (!PoseService.instance) {
      PoseService.instance = new PoseService();
    }
    return PoseService.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.landmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      // 100% Offline: use local wasm in /models/pose/wasm
      const vision = await FilesetResolver.forVisionTasks('/models/pose/wasm');

      // 1. Initialize Pose Landmarker (Body & Joint Biomechanics)
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/pose/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        console.log('✅ Offline MediaPipe PoseLandmarker initialized successfully');
      } catch (err) {
        console.warn('⚠️ MediaPipe Pose GPU init fell back to CPU:', err);
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/pose/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
      }

      // 2. Initialize Hand Landmarker (Full 21-point 5-finger skeleton)
      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
        console.log('✅ Offline MediaPipe HandLandmarker initialized (21-joint 5 fingers)');
      } catch (handErr) {
        console.warn('⚠️ HandLandmarker GPU fallback to CPU:', handErr);
        try {
          this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
          });
        } catch (e2) {
          console.warn('HandLandmarker load warning:', e2);
        }
      }

      // 3. Initialize Face Landmarker (Full 478-point facial mesh & symmetry contours)
      try {
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.35,
          minFacePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
          outputFacialTransformationMatrixes: false,
        });
        console.log('✅ Offline MediaPipe FaceLandmarker initialized (Face mesh & proportions)');
      } catch (faceErr) {
        console.warn('⚠️ FaceLandmarker GPU fallback to CPU:', faceErr);
        try {
          this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/face_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
          });
        } catch (e3) {
          console.warn('FaceLandmarker load warning:', e3);
        }
      }

      this.isInitializing = false;
      this.isMockMode = false;
      return true;
    } catch (err) {
      console.warn('⚠️ Enabling synthetic rehab vision simulation for zero-camera/headless mode:', err);
      this.isInitializing = false;
      this.isMockMode = true;
      return true;
    }
  }

  public isReady(): boolean {
    return this.landmarker !== null || this.isMockMode;
  }

  public setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
  }

  public getIsMockMode(): boolean {
    return this.isMockMode;
  }

  /**
   * Complete Holistic AI Detection:
   * Returns Pose (33-pts), Hands (2x21-pts full 5 fingers), and Face (478-pts facial contours)
   */
  public detectHolistic(video: HTMLVideoElement, timestamp: number): HolisticDetectionResult | null {
    if (this.isMockMode) {
      return {
        poseLandmarks: this.generateSyntheticPose(),
        handLandmarks: null,
        faceLandmarks: null,
      };
    }

    if (!this.landmarker || video.readyState < 2) {
      return null;
    }

    this.frameCount++;

    // 1. Pose detection (Runs every frame for real-time exercise state machine & repetition tracking)
    let poseLandmarks: PoseLandmarks | null = null;
    try {
      const result: PoseLandmarkerResult = this.landmarker.detectForVideo(video, timestamp);
      if (result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0] as PoseLandmarks;
        poseLandmarks = this.smoother.smooth(rawLandmarks);
      }
    } catch (e) {
      // ignore frame error
    }

    // 2. Hand detection (Full 5 fingers for each hand with 21 joints)
    let handLandmarks: PoseLandmarks[] | null = this.lastHandResult;
    if (this.handLandmarker) {
      try {
        const handRes: HandLandmarkerResult = this.handLandmarker.detectForVideo(video, timestamp);
        if (handRes.landmarks && handRes.landmarks.length > 0) {
          handLandmarks = handRes.landmarks as PoseLandmarks[];
          this.lastHandResult = handLandmarks;
        } else {
          // Reset when hand leaves frame
          this.lastHandResult = null;
          handLandmarks = null;
        }
      } catch (e) {
        // ignore
      }
    }

    // 3. Face detection (Full 478 face mesh points & facial proportion alignment)
    let faceLandmarks: PoseLandmarks | null = this.lastFaceResult;
    if (this.faceLandmarker && (this.frameCount % 2 === 0 || !this.lastFaceResult)) {
      try {
        const faceRes: FaceLandmarkerResult = this.faceLandmarker.detectForVideo(video, timestamp);
        if (faceRes.faceLandmarks && faceRes.faceLandmarks.length > 0) {
          faceLandmarks = faceRes.faceLandmarks[0] as PoseLandmarks;
          this.lastFaceResult = faceLandmarks;
        } else {
          this.lastFaceResult = null;
          faceLandmarks = null;
        }
      } catch (e) {
        // ignore
      }
    }

    return {
      poseLandmarks,
      handLandmarks,
      faceLandmarks,
    };
  }

  public detectVideo(video: HTMLVideoElement, timestamp: number): PoseLandmarks | null {
    const res = this.detectHolistic(video, timestamp);
    return res ? res.poseLandmarks : null;
  }

  /**
   * Generates continuous synthetic biomechanics motion for headless/mock mode
   */
  public generateSyntheticPose(exerciseSlug: string = 'shoulder_raise'): PoseLandmarks {
    this.mockTime += 0.05;
    const phase = (Math.sin(this.mockTime) + 1) / 2; // 0.0 to 1.0

    const nose = { x: 0.5, y: 0.18, visibility: 0.99 };
    const leftEye = { x: 0.47, y: 0.15, visibility: 0.99 };
    const rightEye = { x: 0.53, y: 0.15, visibility: 0.99 };
    const leftEar = { x: 0.43, y: 0.16, visibility: 0.99 };
    const rightEar = { x: 0.57, y: 0.16, visibility: 0.99 };

    const leftShoulder = { x: 0.42, y: 0.35, visibility: 0.99 };
    const rightShoulder = { x: 0.58, y: 0.35, visibility: 0.99 };

    let leftElbow = { x: 0.38, y: 0.52, visibility: 0.98 };
    let leftWrist = { x: 0.37, y: 0.68, visibility: 0.98 };

    let rightElbow = { x: 0.62, y: 0.52, visibility: 0.98 };
    let rightWrist = { x: 0.63, y: 0.68, visibility: 0.98 };

    let leftHip = { x: 0.45, y: 0.65, visibility: 0.99 };
    let rightHip = { x: 0.55, y: 0.65, visibility: 0.99 };
    let leftKnee = { x: 0.45, y: 0.82, visibility: 0.99 };
    let rightKnee = { x: 0.55, y: 0.82, visibility: 0.99 };
    let leftAnkle = { x: 0.45, y: 0.96, visibility: 0.99 };
    let rightAnkle = { x: 0.55, y: 0.96, visibility: 0.99 };

    if (exerciseSlug === 'shoulder_raise') {
      const armAngle = 0.4 + phase * 1.2;
      const armLen = 0.16;
      rightElbow = {
        x: rightShoulder.x + Math.cos(armAngle) * armLen,
        y: rightShoulder.y + Math.sin(armAngle) * armLen,
        visibility: 0.99,
      };
      rightWrist = {
        x: rightElbow.x + Math.cos(armAngle) * armLen,
        y: rightElbow.y + Math.sin(armAngle) * armLen,
        visibility: 0.99,
      };
    } else if (exerciseSlug === 'bicep_curl') {
      rightElbow = { x: 0.60, y: 0.50, visibility: 0.99 };
      const curlAngle = 1.4 - phase * 1.5;
      rightWrist = {
        x: rightElbow.x + Math.cos(curlAngle) * 0.15,
        y: rightElbow.y + Math.sin(curlAngle) * 0.15,
        visibility: 0.99,
      };
    } else if (exerciseSlug === 'knee_squat') {
      const squatDip = phase * 0.1;
      leftHip.y += squatDip;
      rightHip.y += squatDip;
      leftKnee.x -= squatDip * 0.4;
      rightKnee.x += squatDip * 0.4;
    }

    const landmarks: PoseLandmarks = new Array(33).fill(null).map((_, idx) => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.5,
    }));

    landmarks[0] = nose;
    landmarks[2] = leftEye;
    landmarks[5] = rightEye;
    landmarks[7] = leftEar;
    landmarks[8] = rightEar;
    landmarks[11] = leftShoulder;
    landmarks[12] = rightShoulder;
    landmarks[13] = leftElbow;
    landmarks[14] = rightElbow;
    landmarks[15] = leftWrist;
    landmarks[16] = rightWrist;
    landmarks[23] = leftHip;
    landmarks[24] = rightHip;
    landmarks[25] = leftKnee;
    landmarks[26] = rightKnee;
    landmarks[27] = leftAnkle;
    landmarks[28] = rightAnkle;

    landmarks[17] = { x: leftWrist.x - 0.02, y: leftWrist.y + 0.04, visibility: 0.9 };
    landmarks[19] = { x: leftWrist.x, y: leftWrist.y + 0.05, visibility: 0.9 };
    landmarks[21] = { x: leftWrist.x + 0.02, y: leftWrist.y + 0.03, visibility: 0.9 };

    landmarks[18] = { x: rightWrist.x + 0.02, y: rightWrist.y + 0.04, visibility: 0.9 };
    landmarks[20] = { x: rightWrist.x, y: rightWrist.y + 0.05, visibility: 0.9 };
    landmarks[22] = { x: rightWrist.x - 0.02, y: rightWrist.y + 0.03, visibility: 0.9 };

    return landmarks;
  }
}

export const poseService = PoseService.getInstance();
