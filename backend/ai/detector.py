import os
import cv2
import numpy as np
import time
from app.core.config import settings

class FaceDetector:
    def __init__(self):
        self.model_path = str(settings.MODELS_DIR / 'face_detection_yunet_2023mar.onnx')
        self.detector = None
        self._current_size = (320, 320)
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path) and os.path.getsize(self.model_path) > 10000:
            self.detector = cv2.FaceDetectorYN.create(
                model=self.model_path,
                config='',
                input_size=self._current_size,
                score_threshold=settings.DETECTION_SCORE_THRESHOLD,
                nms_threshold=0.3,
                top_k=5000
            )
            print('[AI Detector] YuNet model loaded.')
        else:
            print('[AI Detector] Warning: YuNet model not found, falling back to Haar Cascade.')
            self.detector = None

    def detect(self, image_bgr: np.ndarray, score_thresh: float = None):
        '''
        Detects faces in BGR image.
        Returns:
            list of dict:
                {
                    'box': (x, y, w, h),
                    'confidence': float,
                    'landmarks': [[x, y], ...], # 5 landmarks
                    'raw_face': np.ndarray (for SFace alignment)
                }
        '''
        if image_bgr is None:
            return []

        h, w = image_bgr.shape[:2]
        if self.detector is None:
            return self._detect_haar(image_bgr)

        # Update input size if changed
        if (w, h) != self._current_size:
            self._current_size = (w, h)
            self.detector.setInputSize((w, h))

        thresh = score_thresh if score_thresh is not None else settings.DETECTION_SCORE_THRESHOLD
        self.detector.setScoreThreshold(thresh)

        _, faces = self.detector.detect(image_bgr)
        if faces is None or len(faces) == 0:
            return []

        results = []
        for face in faces:
            # face structure: [x1, y1, w, h, x_re, y_re, x_le, y_le, x_nt, y_nt, x_rcm, y_rcm, x_lcm, y_lcm, score]
            x, y, bw, bh = int(face[0]), int(face[1]), int(face[2]), int(face[3])
            score = float(face[-1])
            re_x, re_y = float(face[4]), float(face[5])
            le_x, le_y = float(face[6]), float(face[7])
            nt_x, nt_y = float(face[8]), float(face[9])
            rcm_x, rcm_y = float(face[10]), float(face[11])
            lcm_x, lcm_y = float(face[12]), float(face[13])

            landmarks = [
                [re_x, re_y],    # Right eye
                [le_x, le_y],    # Left eye
                [nt_x, nt_y],    # Nose tip
                [rcm_x, rcm_y],  # Right mouth corner
                [lcm_x, lcm_y]   # Left mouth corner
            ]

            # Head Pose & Yaw Profile Analysis (ตรวจสอบการหันข้าง)
            eye_span = max(1.0, abs(le_x - re_x))
            eye_mid_x = (re_x + le_x) / 2.0
            nose_offset = (nt_x - eye_mid_x) / eye_span
            approx_yaw_deg = round(float(np.clip(nose_offset * 75.0, -90.0, 90.0)), 1)

            if nose_offset > 0.35:
                orientation = 'TURN_RIGHT'  # หันขวา
                is_profile = True
                orientation_th = 'หันขวา'
            elif nose_offset < -0.35:
                orientation = 'TURN_LEFT'   # หันซ้าย
                is_profile = True
                orientation_th = 'หันซ้าย'
            elif abs(nose_offset) > 0.18:
                orientation = 'SEMI_PROFILE'
                is_profile = True
                orientation_th = 'เอียงกึ่งข้าง'
            else:
                orientation = 'FRONTAL'
                is_profile = False
                orientation_th = 'หน้าตรง'

            results.append({
                'box': (max(0, x), max(0, y), max(1, bw), max(1, bh)),
                'confidence': round(score, 4),
                'landmarks': landmarks,
                'orientation': orientation,
                'orientation_th': orientation_th,
                'yaw_deg': approx_yaw_deg,
                'is_profile': is_profile,
                'raw_face': face
            })
        return results

    def _detect_haar(self, image_bgr: np.ndarray):
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        boxes = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
        results = []
        for (x, y, w, h) in boxes:
            results.append({
                'box': (int(x), int(y), int(w), int(h)),
                'confidence': 0.85,
                'landmarks': [],
                'raw_face': np.array([x, y, w, h, x+w*0.3, y+h*0.3, x+w*0.7, y+h*0.3, x+w*0.5, y+h*0.5, x+w*0.35, y+h*0.75, x+w*0.65, y+h*0.75, 0.85], dtype=np.float32)
            })
        return results

detector = FaceDetector()
