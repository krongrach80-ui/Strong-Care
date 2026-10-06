export interface FaceLandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceDetectionResult {
  detected: boolean;
  box: FaceBoundingBox;
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
  yaw: number; // Head rotation left/right [-1, +1]
  pitch: number; // Head tilt up/down [-1, +1]
  faceCentered: boolean;
  qualityScore: number; // 0-100
}

export interface LivenessState {
  blinkDetected: boolean;
  turnLeftDetected: boolean;
  turnRightDetected: boolean;
  isRealHuman: boolean;
  currentPrompt: string;
}

export interface FaceEmbeddingRecord {
  id?: number;
  userId?: number;
  patientId: number;
  embedding: number[]; // 128-D vector
  encryptedEmbedding?: string;
  embeddingHash?: string;
  modelVersion: string;
  qualityScore: number;
  angleTag: string;
  createdAt: string;
}
