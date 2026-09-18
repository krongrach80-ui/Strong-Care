import os
import cv2
import numpy as np
import time
from app.core.config import settings

# Attempt MediaPipe import
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False


class FaceDetector:
    def __init__(self):
        self.mp_detector = None
        self.yunet_detector = None
        self._current_size = (320, 320)
        self.model_path = str(settings.MODELS_DIR / 'face_detection_yunet_2023mar.onnx')
        self.mp_model_path = str(settings.MODELS_DIR / 'blaze_face_short_range.tflite')
        self.load_models()

    def load_models(self):
        # 1. Initialize Google MediaPipe BlazeFace Detector
        if MEDIAPIPE_AVAILABLE and os.path.exists(self.mp_model_path):
            try:
                base_options = mp.tasks.BaseOptions(model_asset_path=self.mp_model_path)
                options = mp.tasks.vision.FaceDetectorOptions(
                    base_options=base_options,
                    min_detection_confidence=0.25
                )
                self.mp_detector = mp.tasks.vision.FaceDetector.create_from_options(options)
                print('[AI Detector] Google MediaPipe BlazeFace loaded successfully!')
            except Exception as e:
                print(f'[AI Detector] MediaPipe init failed: {e}')
                self.mp_detector = None

        # 2. Initialize YuNet ONNX Detector (Secondary / Fallback Engine)
        if os.path.exists(self.model_path) and os.path.getsize(self.model_path) > 10000:
            try:
                self.yunet_detector = cv2.FaceDetectorYN.create(
                    model=self.model_path,
                    config='',
                    input_size=self._current_size,
                    score_threshold=settings.DETECTION_SCORE_THRESHOLD,
                    nms_threshold=0.3,
                    top_k=5000
                )
                print('[AI Detector] YuNet model loaded successfully!')
            except Exception as e:
                print(f'[AI Detector] YuNet init failed: {e}')
                self.yunet_detector = None
        else:
            print('[AI Detector] Warning: YuNet model not found.')

    def detect(self, image_bgr: np.ndarray, score_thresh: float = None):
        '''
        Detects faces in BGR image using MediaPipe BlazeFace (primary), 
        falling back to YuNet ONNX or Haar Cascade.
        Returns:
            list of dict:
                {
                    'box': (x, y, w, h),
                    'confidence': float,
                    'landmarks': [[x, y], ...], # 5 landmarks
                    'orientation': str,
                    'orientation_th': str,
                    'yaw_deg': float,
                    'is_profile': bool,
                    'raw_face': np.ndarray, (for SFace alignment)
                    'engine': str
                }
        '''
        if image_bgr is None:
            return []

        h, w = image_bgr.shape[:2]
        thresh = score_thresh if score_thresh is not None else settings.DETECTION_SCORE_THRESHOLD

        # 1. Try MediaPipe BlazeFace
        if self.mp_detector is not None:
            try:
                return self._detect_mediapipe(image_bgr, thresh)
            except Exception as e:
                pass

        # 2. Try YuNet ONNX Detector
        if self.yunet_detector is not None:
            try:
                return self._detect_yunet(image_bgr, thresh)
            except Exception:
                pass

        # 3. Fallback to Haar Cascade
        return self._detect_haar(image_bgr)

    def _detect_mediapipe(self, image_bgr: np.ndarray, score_thresh: float):
        h, w = image_bgr.shape[:2]
        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        res = self.mp_detector.detect(mp_image)

        if not res or not res.detections or len(res.detections) == 0:
            return []

        results = []
        for det in res.detections:
            score = float(det.categories[0].score) if det.categories else 0.85
            if score < score_thresh:
                continue

            bb = det.bounding_box
            x = max(0, int(bb.origin_x))
            y = max(0, int(bb.origin_y))
            bw = min(w - x, int(bb.width))
            bh = min(h - y, int(bb.height))

            kps = det.keypoints or []
            if len(kps) >= 4:
                re_x, re_y = float(kps[0].x * w), float(kps[0].y * h)
                le_x, le_y = float(kps[1].x * w), float(kps[1].y * h)
                nt_x, nt_y = float(kps[2].x * w), float(kps[2].y * h)
                mc_x, mc_y = float(kps[3].x * w), float(kps[3].y * h)

                eye_span = max(1.0, abs(le_x - re_x))
                m_offset = eye_span * 0.28
                rcm_x, rcm_y = mc_x - m_offset, mc_y
                lcm_x, lcm_y = mc_x + m_offset, mc_y

                landmarks = [
                    [re_x, re_y],
                    [le_x, le_y],
                    [nt_x, nt_y],
                    [rcm_x, rcm_y],
                    [lcm_x, lcm_y]
                ]

                # Yaw and Profile calculation
                eye_mid_x = (re_x + le_x) / 2.0
                nose_offset = (nt_x - eye_mid_x) / eye_span
                approx_yaw = round(float(np.clip(nose_offset * 75.0, -90.0, 90.0)), 1)

                if nose_offset > 0.32:
                    orientation = 'TURN_RIGHT'
                    orientation_th = 'หันขวา'
                    is_profile = True
                elif nose_offset < -0.32:
                    orientation = 'TURN_LEFT'
                    orientation_th = 'หันซ้าย'
                    is_profile = True
                elif abs(nose_offset) > 0.16:
                    orientation = 'SEMI_PROFILE'
                    orientation_th = 'เอียงกึ่งข้าง'
                    is_profile = True
                else:
                    orientation = 'FRONTAL'
                    orientation_th = 'หน้าตรง'
                    is_profile = False

                raw_face = np.array([
                    x, y, bw, bh,
                    re_x, re_y,
                    le_x, le_y,
                    nt_x, nt_y,
                    rcm_x, rcm_y,
                    lcm_x, lcm_y,
                    score
                ], dtype=np.float32)
            else:
                landmarks = []
                orientation = 'FRONTAL'
                orientation_th = 'หน้าตรง'
                approx_yaw = 0.0
                is_profile = False
                raw_face = np.array([
                    x, y, bw, bh,
                    x + bw * 0.3, y + bh * 0.35,
                    x + bw * 0.7, y + bh * 0.35,
                    x + bw * 0.5, y + bh * 0.55,
                    x + bw * 0.35, y + bh * 0.75,
                    x + bw * 0.65, y + bh * 0.75,
                    score
                ], dtype=np.float32)

            results.append({
                'box': (x, y, bw, bh),
                'confidence': round(score, 4),
                'landmarks': landmarks,
                'orientation': orientation,
                'orientation_th': orientation_th,
                'yaw_deg': approx_yaw,
                'is_profile': is_profile,
                'raw_face': raw_face,
                'engine': 'mediapipe'
            })

        return results

    def _detect_yunet(self, image_bgr: np.ndarray, thresh: float):
        h, w = image_bgr.shape[:2]
        if (w, h) != self._current_size:
            self._current_size = (w, h)
            self.yunet_detector.setInputSize((w, h))

        self.yunet_detector.setScoreThreshold(thresh)
        _, faces = self.yunet_detector.detect(image_bgr)

        if faces is None or len(faces) == 0:
            # Low-light enhancement
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
            if gray.mean() < 70:
                lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(lab)
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
                cl = clahe.apply(l)
                enhanced_bgr = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2BGR)
                self.yunet_detector.setScoreThreshold(max(0.20, thresh * 0.7))
                _, faces = self.yunet_detector.detect(enhanced_bgr)

        if faces is None or len(faces) == 0:
            return []

        results = []
        for face in faces:
            x, y, bw, bh = int(face[0]), int(face[1]), int(face[2]), int(face[3])
            score = float(face[-1])
            re_x, re_y = float(face[4]), float(face[5])
            le_x, le_y = float(face[6]), float(face[7])
            nt_x, nt_y = float(face[8]), float(face[9])
            rcm_x, rcm_y = float(face[10]), float(face[11])
            lcm_x, lcm_y = float(face[12]), float(face[13])

            landmarks = [
                [re_x, re_y],
                [le_x, le_y],
                [nt_x, nt_y],
                [rcm_x, rcm_y],
                [lcm_x, lcm_y]
            ]

            eye_span = max(1.0, abs(le_x - re_x))
            eye_mid_x = (re_x + le_x) / 2.0
            nose_offset = (nt_x - eye_mid_x) / eye_span
            approx_yaw_deg = round(float(np.clip(nose_offset * 75.0, -90.0, 90.0)), 1)

            if nose_offset > 0.35:
                orientation = 'TURN_RIGHT'
                is_profile = True
                orientation_th = 'หันขวา'
            elif nose_offset < -0.35:
                orientation = 'TURN_LEFT'
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
                'raw_face': face,
                'engine': 'yunet'
            })
        return results

    def _detect_haar(self, image_bgr: np.ndarray):
        try:
            if not hasattr(cv2, 'data') or not hasattr(cv2.data, 'haarcascades'):
                return []
            cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
            if not os.path.exists(cascade_path):
                return []
            cascade = cv2.CascadeClassifier(cascade_path)
            if cascade.empty():
                return []
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
            boxes = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
            results = []
            for (x, y, w, h) in boxes:
                results.append({
                    'box': (int(x), int(y), int(w), int(h)),
                    'confidence': 0.85,
                    'landmarks': [],
                    'orientation': 'FRONTAL',
                    'orientation_th': 'หน้าตรง',
                    'yaw_deg': 0.0,
                    'is_profile': False,
                    'raw_face': np.array([x, y, w, h, x+w*0.3, y+h*0.3, x+w*0.7, y+h*0.3, x+w*0.5, y+h*0.5, x+w*0.35, y+h*0.75, x+w*0.65, y+h*0.75, 0.85], dtype=np.float32),
                    'engine': 'haar'
                })
            return results
        except Exception:
            return []


detector = FaceDetector()
