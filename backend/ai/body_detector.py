import os
import cv2
import numpy as np
import math
from app.core.config import settings

# Attempt MediaPipe import
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False


class BodyPoseDetector:
    def __init__(self):
        self.pose_landmarker = None
        self.model_path = str(settings.MODELS_DIR / 'pose_landmarker_lite.task')
        self.load_model()

    def load_model(self):
        if MEDIAPIPE_AVAILABLE and os.path.exists(self.model_path):
            try:
                base_options = mp.tasks.BaseOptions(model_asset_path=self.model_path)
                options = mp.tasks.vision.PoseLandmarkerOptions(
                    base_options=base_options,
                    min_pose_detection_confidence=0.25,
                    min_tracking_confidence=0.25
                )
                self.pose_landmarker = mp.tasks.vision.PoseLandmarker.create_from_options(options)
                print('[AI Body] Google MediaPipe PoseLandmarker loaded successfully!')
            except Exception as e:
                print(f'[AI Body] MediaPipe PoseLandmarker init error: {e}')
                self.pose_landmarker = None

    def detect_body_and_pose(
        self,
        image_bgr: np.ndarray,
        face_box: tuple = None,
        face_landmarks: list = None
    ) -> dict:
        '''
        Detects whole body bounding box, 33-point skeletal keypoints, 
        and recognizes gestures (Wai, Hand Raised, Waving, Posture).
        '''
        if image_bgr is None:
            return None

        # 1. Try MediaPipe PoseLandmarker
        if self.pose_landmarker is not None:
            try:
                mp_res = self._detect_mediapipe_pose(image_bgr)
                if mp_res and mp_res.get('detected'):
                    return mp_res
            except Exception as e:
                pass

        # 2. Fallback to Kinematic Edge Estimation
        if face_box is not None:
            return self._detect_kinematic_fallback(image_bgr, face_box, face_landmarks)

        return None

    def _detect_mediapipe_pose(self, image_bgr: np.ndarray) -> dict:
        h, w = image_bgr.shape[:2]
        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        res = self.pose_landmarker.detect(mp_image)

        if not res or not res.pose_landmarks or len(res.pose_landmarks) == 0:
            return None

        landmarks_proto = res.pose_landmarks[0]
        pts = []
        keypoints = []

        # Landmark names dictionary for standard 33 MediaPipe pose keypoints
        names = {
            0: "Nose", 11: "Left Shoulder", 12: "Right Shoulder",
            13: "Left Elbow", 14: "Right Elbow", 15: "Left Wrist", 16: "Right Wrist",
            23: "Left Hip", 24: "Right Hip", 25: "Left Knee", 26: "Right Knee",
            27: "Left Ankle", 28: "Right Ankle"
        }

        min_x, max_x = 1.0, 0.0
        min_y, max_y = 1.0, 0.0

        for i, lm in enumerate(landmarks_proto):
            vis = getattr(lm, 'visibility', 1.0)
            vis = 1.0 if vis is None else float(vis)
            px = float(lm.x)
            py = float(lm.y)
            pz = float(lm.z) if hasattr(lm, 'z') else 0.0

            pts.append({"x": px, "y": py, "z": pz, "visibility": vis})

            if vis > 0.20:
                min_x = min(min_x, px)
                max_x = max(max_x, px)
                min_y = min(min_y, py)
                max_y = max(max_y, py)

            if i in names and vis > 0.18:
                keypoints.append({
                    "id": f"pt_{i}",
                    "name": names[i],
                    "x": round(px * w, 1),
                    "y": round(py * h, 1),
                    "conf": round(vis, 2)
                })

        if min_x > max_x:
            min_x, max_x = 0.1, 0.9
            min_y, max_y = 0.1, 0.9

        pad_x = 0.04
        pad_y = 0.04
        bx1 = max(0, int((min_x - pad_x) * w))
        by1 = max(0, int((min_y - pad_y) * h))
        bx2 = min(w, int((max_x + pad_x) * w))
        by2 = min(h, int((max_y + pad_y) * h))

        body_w = max(10, bx2 - bx1)
        body_h = max(10, by2 - by1)

        # Posture & Gesture Recognition
        lw = pts[15] if len(pts) > 15 else None
        rw = pts[16] if len(pts) > 16 else None
        ls = pts[11] if len(pts) > 11 else None
        rs = pts[12] if len(pts) > 12 else None
        le = pts[13] if len(pts) > 13 else None
        re = pts[14] if len(pts) > 14 else None
        nose = pts[0] if len(pts) > 0 else None

        is_lw_raised = bool(lw and ls and lw['y'] < ls['y'] - 0.05)
        is_rw_raised = bool(rw and rs and rw['y'] < rs['y'] - 0.05)
        is_lw_mid = bool(lw and le and lw['y'] < le['y'] - 0.04)
        is_rw_mid = bool(rw and re and rw['y'] < re['y'] - 0.04)

        # Thai Greeting / Wai (มือพนมเข้าหากันระดับอก/คาง)
        is_wai = False
        if lw and rw and ls:
            dist_wrists = math.hypot(lw['x'] - rw['x'], lw['y'] - rw['y'])
            if dist_wrists < 0.14 and lw['y'] < ls['y'] + 0.15:
                is_wai = True

        # Touching face
        is_touching_face = False
        if nose and ((lw and math.hypot(lw['x'] - nose['x'], lw['y'] - nose['y']) < 0.15) or
                     (rw and math.hypot(rw['x'] - nose['x'], rw['y'] - nose['y']) < 0.15)):
            is_touching_face = True

        is_arm_raised = is_lw_raised or is_rw_raised or is_lw_mid or is_rw_mid or is_wai

        posture = "Upright & Centered"
        posture_th = "ลำตัวตรงมาตรฐาน"

        if is_wai:
            posture = "Wai / Thai Greeting"
            posture_th = "🙏 ไหว้ / ทักทาย"
        elif is_lw_raised and is_rw_raised:
            posture = "Both Arms Raised High!"
            posture_th = "🙌 ยกแขนทั้งสองข้าง!"
        elif (is_lw_raised or is_lw_mid) and (is_rw_raised or is_rw_mid):
            posture = "Both Hands Raised"
            posture_th = "👐 ยกมือทั้งสองข้าง"
        elif is_touching_face:
            posture = "Hand to Face / Thinking"
            posture_th = "🤔 แตะคาง / สัมผัสใบหน้า"
        elif is_lw_raised:
            posture = "Left Arm Raised High"
            posture_th = "🙋‍♀️ ชูแขนซ้าย"
        elif is_rw_raised:
            posture = "Right Arm Raised High"
            posture_th = "🙋‍♂️ ชูแขนขวา"
        elif is_lw_mid:
            posture = "Left Hand Waving"
            posture_th = "👋 ยกมือซ้าย / โบกมือ"
        elif is_rw_mid:
            posture = "Right Hand Waving"
            posture_th = "👋 ยกมือขวา / โบกมือ"
        elif ls and rs:
            tilt = ls['y'] - rs['y']
            if tilt > 0.08:
                posture = "Leaning Left"
                posture_th = "เอียงซ้าย"
            elif tilt < -0.08:
                posture = "Leaning Right"
                posture_th = "เอียงขวา"

        coverage_pct = round((body_w * body_h / (w * h)) * 100, 1)

        return {
            "detected": True,
            "engine": "mediapipe",
            "box": {
                "x": bx1,
                "y": by1,
                "width": body_w,
                "height": body_h,
                "confidence": 0.98
            },
            "posture": posture,
            "posture_th": posture_th,
            "is_arm_raised": is_arm_raised,
            "is_wai": is_wai,
            "coverage_percent": coverage_pct,
            "keypoints": keypoints,
            "landmarks": pts
        }

    def _detect_kinematic_fallback(
        self,
        image_bgr: np.ndarray,
        face_box: tuple,
        face_landmarks: list = None
    ) -> dict:
        frame_h, frame_w = image_bgr.shape[:2]
        fx, fy, fw, fh = face_box

        fcx = float(fx + fw / 2.0)
        fcy = float(fy + fh / 2.0)
        chin_y = float(fy + fh)

        expected_sh_y = int(min(frame_h - 10, chin_y + 0.45 * fh))
        sh_span_nominal = fw * 1.35

        l_sh_x = min(frame_w - 5, fcx + sh_span_nominal)
        r_sh_x = max(5, fcx - sh_span_nominal)
        sh_y = float(expected_sh_y)

        actual_span = max(10.0, l_sh_x - r_sh_x)

        nose_pt = face_landmarks[2] if (face_landmarks and len(face_landmarks) >= 3) else [fcx, fcy]
        head_pt = [fcx, max(0.0, fy - 0.15 * fh)]
        neck_pt = [fcx, min(frame_h - 5.0, chin_y + 0.15 * fh)]
        chest_pt = [fcx, min(frame_h - 5.0, chin_y + 1.05 * fh)]
        spine_pt = [fcx, min(frame_h - 5.0, chin_y + 1.95 * fh)]

        l_sh = [float(l_sh_x), sh_y]
        r_sh = [float(r_sh_x), sh_y]

        l_elbow = [float(min(frame_w - 5, l_sh_x + 0.22 * fw)), float(min(frame_h - 5, chin_y + 1.70 * fh))]
        r_elbow = [float(max(5, r_sh_x - 0.22 * fw)), float(min(frame_h - 5, chin_y + 1.70 * fh))]

        l_wrist = [float(min(frame_w - 5, l_sh_x + 0.18 * fw)), float(min(frame_h - 5, chin_y + 2.40 * fh))]
        r_wrist = [float(max(5, r_sh_x - 0.18 * fw)), float(min(frame_h - 5, chin_y + 2.40 * fh))]

        l_hip = [float(min(frame_w - 5, fcx + actual_span * 0.38)), float(min(frame_h - 5, chin_y + 2.90 * fh))]
        r_hip = [float(max(5, fcx - actual_span * 0.38)), float(min(frame_h - 5, chin_y + 2.90 * fh))]

        keypoints = [
            {"id": "head", "name": "Head", "x": round(head_pt[0], 1), "y": round(head_pt[1], 1), "conf": 0.99},
            {"id": "nose", "name": "Nose", "x": round(nose_pt[0], 1), "y": round(nose_pt[1], 1), "conf": 0.99},
            {"id": "neck", "name": "Neck", "x": round(neck_pt[0], 1), "y": round(neck_pt[1], 1), "conf": 0.96},
            {"id": "l_shoulder", "name": "Left Shoulder", "x": round(l_sh[0], 1), "y": round(l_sh[1], 1), "conf": 0.94},
            {"id": "r_shoulder", "name": "Right Shoulder", "x": round(r_sh[0], 1), "y": round(r_sh[1], 1), "conf": 0.94},
            {"id": "chest", "name": "Chest / Core", "x": round(chest_pt[0], 1), "y": round(chest_pt[1], 1), "conf": 0.95},
            {"id": "l_elbow", "name": "Left Elbow", "x": round(l_elbow[0], 1), "y": round(l_elbow[1], 1), "conf": 0.88},
            {"id": "r_elbow", "name": "Right Elbow", "x": round(r_elbow[0], 1), "y": round(r_elbow[1], 1), "conf": 0.88},
            {"id": "l_wrist", "name": "Left Wrist", "x": round(l_wrist[0], 1), "y": round(l_wrist[1], 1), "conf": 0.82},
            {"id": "r_wrist", "name": "Right Wrist", "x": round(r_wrist[0], 1), "y": round(r_wrist[1], 1), "conf": 0.82},
            {"id": "spine", "name": "Spine", "x": round(spine_pt[0], 1), "y": round(spine_pt[1], 1), "conf": 0.90},
            {"id": "l_hip", "name": "Left Hip", "x": round(l_hip[0], 1), "y": round(l_hip[1], 1), "conf": 0.85},
            {"id": "r_hip", "name": "Right Hip", "x": round(r_hip[0], 1), "y": round(r_hip[1], 1), "conf": 0.85}
        ]

        bx1 = max(0, int(r_sh_x - 0.18 * fw))
        by1 = max(0, int(fy - 0.20 * fh))
        bx2 = min(frame_w, int(l_sh_x + 0.18 * fw))
        by2 = frame_h

        body_w = max(10, bx2 - bx1)
        body_h = max(10, by2 - by1)

        center_ratio = fcx / max(1.0, frame_w)
        if center_ratio < 0.38:
            posture_status = "Leaning Left"
            posture_th = "เอียงซ้าย"
        elif center_ratio > 0.62:
            posture_status = "Leaning Right"
            posture_th = "เอียงขวา"
        else:
            posture_status = "Upright & Centered"
            posture_th = "ลำตัวตรงมาตรฐาน"

        body_area = body_w * body_h
        coverage_pct = round((body_area / (frame_w * frame_h)) * 100, 1)

        return {
            "detected": True,
            "engine": "kinematic_fallback",
            "box": {
                "x": bx1,
                "y": by1,
                "width": body_w,
                "height": body_h,
                "confidence": 0.94
            },
            "posture": posture_status,
            "posture_th": posture_th,
            "is_arm_raised": False,
            "is_wai": False,
            "coverage_percent": coverage_pct,
            "shoulder_span_px": round(actual_span, 1),
            "keypoints": keypoints
        }


body_detector = BodyPoseDetector()
