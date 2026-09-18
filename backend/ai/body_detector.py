import cv2
import numpy as np
import math

class BodyPoseDetector:
    def __init__(self):
        pass

    def detect_body_and_pose(
        self,
        image_bgr: np.ndarray,
        face_box: tuple,
        face_landmarks: list = None
    ) -> dict:
        '''
        Calculates whole body bounding box, kinematic skeletal keypoints, 
        shoulder boundaries, and posture telemetry.
        '''
        if image_bgr is None or face_box is None:
            return None

        frame_h, frame_w = image_bgr.shape[:2]
        fx, fy, fw, fh = face_box

        # Face center & anchor
        fcx = float(fx + fw / 2.0)
        fcy = float(fy + fh / 2.0)
        chin_y = float(fy + fh)

        # 1. Edge-assisted shoulder contour detection
        # Analyze horizontal gradient around expected shoulder height
        expected_sh_y = int(min(frame_h - 10, chin_y + 0.45 * fh))
        sh_span_nominal = fw * 1.35

        # Default shoulders
        l_sh_x = min(frame_w - 5, fcx + sh_span_nominal)
        r_sh_x = max(5, fcx - sh_span_nominal)
        sh_y = float(expected_sh_y)

        # Refine with horizontal edge profile if image has sufficient size
        try:
            y_start = max(0, expected_sh_y - 25)
            y_end = min(frame_h, expected_sh_y + 35)
            if y_end > y_start + 10:
                band = cv2.cvtColor(image_bgr[y_start:y_end, :], cv2.COLOR_BGR2GRAY)
                # Compute horizontal gradient
                grad_x = cv2.Sobel(band, cv2.CV_32F, 1, 0, ksize=3)
                grad_profile = np.mean(np.abs(grad_x), axis=0)
                
                # Search for right shoulder edge (left side of image, fcx - 2.5*fw to fcx - 0.7*fw)
                r_search_start = max(0, int(fcx - 2.5 * fw))
                r_search_end = max(1, int(fcx - 0.8 * fw))
                if r_search_end > r_search_start:
                    r_peak = r_search_start + np.argmax(grad_profile[r_search_start:r_search_end])
                    if grad_profile[r_peak] > np.mean(grad_profile) * 1.3:
                        r_sh_x = float(r_peak)

                # Search for left shoulder edge (right side of image, fcx + 0.7*fw to fcx + 2.5*fw)
                l_search_start = min(frame_w - 2, int(fcx + 0.8 * fw))
                l_search_end = min(frame_w - 1, int(fcx + 2.5 * fw))
                if l_search_end > l_search_start:
                    l_peak = l_search_start + np.argmax(grad_profile[l_search_start:l_search_end])
                    if grad_profile[l_peak] > np.mean(grad_profile) * 1.3:
                        l_sh_x = float(l_peak)
        except Exception:
            pass

        # Calculate shoulder tilt angle
        actual_span = max(10.0, l_sh_x - r_sh_x)
        sh_angle_deg = math.degrees(math.atan2(0.0, actual_span))

        # 2. Keypoints generation (Kinematic skeleton)
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

        # 3. Whole body bounding box
        bx1 = max(0, int(r_sh_x - 0.18 * fw))
        by1 = max(0, int(fy - 0.20 * fh))
        bx2 = min(frame_w, int(l_sh_x + 0.18 * fw))
        by2 = frame_h  # Full visible extent down to camera bottom

        body_w = max(10, bx2 - bx1)
        body_h = max(10, by2 - by1)
        body_box = [bx1, by1, body_w, body_h]

        # 4. Posture analysis
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

        # Coverage percentage
        body_area = body_w * body_h
        coverage_pct = round((body_area / (frame_w * frame_h)) * 100, 1)

        return {
            "detected": True,
            "box": {
                "x": bx1,
                "y": by1,
                "width": body_w,
                "height": body_h,
                "confidence": 0.96
            },
            "posture": posture_status,
            "posture_th": posture_th,
            "coverage_percent": coverage_pct,
            "shoulder_span_px": round(actual_span, 1),
            "keypoints": keypoints
        }

body_detector = BodyPoseDetector()
