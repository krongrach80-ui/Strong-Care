import time
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import numpy as np

from app.core.config import settings
from app.models import RecognitionEvent, Attendance, User
from ai.detector import detector
from ai.recognizer import recognizer
from ai.body_detector import body_detector
from app.services.face_service import face_service
from app.services.voice_service import voice_service

class TemporalTracker:
    def __init__(self):
        self.candidate_user_id = None
        self.candidate_name = None
        self.consecutive_hits = 0
        self.last_seen_time = 0.0
        self.has_fired = False
        self.confirmed_user_id = None
        self.confirmed_name = None
        self.confirmed_until = 0.0
        self.last_known_box = None
        self.last_known_landmarks = None
        self.last_confidence = 0.0
        self.last_orientation = 'FRONTAL'
        self.last_orientation_th = 'หน้าตรง'
        self.last_yaw_deg = 0.0

    def update(
        self,
        user_id: int,
        name: str,
        target_hits: int = 3,
        is_profile: bool = False,
        box: tuple = None,
        landmarks: list = None,
        confidence: float = 0.0,
        orientation: str = 'FRONTAL',
        orientation_th: str = 'หน้าตรง',
        yaw_deg: float = 0.0
    ) -> tuple[bool, int, bool]:
        '''
        Returns: (is_confirmed, current_hits, newly_confirmed_flag)
        '''
        now = time.time()

        if box is not None:
            self.last_known_box = box
            self.last_known_landmarks = landmarks
            self.last_confidence = confidence
            self.last_orientation = orientation
            self.last_orientation_th = orientation_th
            self.last_yaw_deg = yaw_deg
            self.last_seen_time = now

        # Reset confirmed identity if no face has been seen for over 2.5 seconds
        if now - self.last_seen_time > 2.5:
            self.candidate_user_id = None
            self.candidate_name = None
            self.confirmed_user_id = None
            self.confirmed_name = None
            self.consecutive_hits = 0
            self.has_fired = False
            self.last_known_box = None

        # Check if user is within the confirmed identity hold window
        is_still_held = (
            self.confirmed_user_id is not None
            and now < self.confirmed_until
            and (now - self.last_seen_time < 2.0)
        )

        if user_id is None:
            if is_still_held:
                # Retain confirmed identity through momentary side-profile turns
                return (True, max(target_hits, self.consecutive_hits), False)
            else:
                self.consecutive_hits = max(0, self.consecutive_hits - 1)
                return (False, self.consecutive_hits, False)

        # Matched a recognized user
        if user_id == self.candidate_user_id or (is_still_held and user_id == self.confirmed_user_id):
            self.consecutive_hits += 1
            self.candidate_user_id = user_id
            self.candidate_name = name
        else:
            self.candidate_user_id = user_id
            self.candidate_name = name
            self.consecutive_hits = 1
            self.has_fired = False

        is_confirmed = (self.consecutive_hits >= target_hits) or is_still_held
        newly_confirmed = False

        if is_confirmed:
            self.confirmed_user_id = self.candidate_user_id
            self.confirmed_name = self.candidate_name
            # Hold identity for 4.0s during continuous interaction
            self.confirmed_until = now + 4.0

            if not self.has_fired:
                newly_confirmed = True
                self.has_fired = True

        return (is_confirmed, self.consecutive_hits, newly_confirmed)

    def get_recent_held_state(self) -> dict | None:
        '''
        Returns persistent state if a face was seen within the last 0.8s,
        preventing flickering when turning the head completely sideways.
        '''
        now = time.time()
        if self.last_known_box and (now - self.last_seen_time < 0.8):
            is_confirmed = self.confirmed_user_id is not None and now < self.confirmed_until
            return {
                'box': self.last_known_box,
                'landmarks': self.last_known_landmarks,
                'confidence': self.last_confidence,
                'orientation': self.last_orientation,
                'orientation_th': self.last_orientation_th,
                'yaw_deg': self.last_yaw_deg,
                'user_id': self.confirmed_user_id or self.candidate_user_id,
                'name': self.confirmed_name or self.candidate_name,
                'confirmed': is_confirmed
            }
        return None

    def reset(self):
        self.candidate_user_id = None
        self.candidate_name = None
        self.confirmed_user_id = None
        self.confirmed_name = None
        self.consecutive_hits = 0
        self.has_fired = False
        self.last_known_box = None
        self.confirmed_until = 0.0

class RecognitionService:
    def __init__(self):
        self.tracker = TemporalTracker()

    async def process_frame(
        self,
        db: AsyncSession,
        image_bgr: np.ndarray,
        camera_id: str = 'default_webcam',
        record_db: bool = True
    ) -> dict:
        total_start = time.perf_counter()

        if image_bgr is None:
            return {
                'status': 'no_frame',
                'confidence': 0.0,
                'confirmed': False,
                'confirmation_count': 0,
                'confirmation_target': settings.TEMPORAL_CONFIRMATION_FRAMES,
                'telemetry': {'total_ms': 0}
            }

        frame_h, frame_w = image_bgr.shape[:2]

        # 1. Detection
        t0 = time.perf_counter()
        faces = detector.detect(image_bgr)
        detection_ms = round((time.perf_counter() - t0) * 1000, 2)

        if not faces:
            # Check for recent held state (0.8s grace period for profile head turns)
            held = self.tracker.get_recent_held_state()
            if held:
                total_ms = round((time.perf_counter() - total_start) * 1000, 2)
                return {
                    'status': 'recognized' if held['confirmed'] else ('unknown' if not held['name'] else 'confirming'),
                    'faces_detected': 1,
                    'user_id': held['user_id'],
                    'name': held['name'],
                    'confidence': held['confidence'],
                    'confirmed': held['confirmed'],
                    'confirmation_count': settings.TEMPORAL_CONFIRMATION_FRAMES if held['confirmed'] else 1,
                    'confirmation_target': settings.TEMPORAL_CONFIRMATION_FRAMES,
                    'frame_width': frame_w,
                    'frame_height': frame_h,
                    'is_profile': True,
                    'orientation': held['orientation'],
                    'orientation_th': held['orientation_th'],
                    'yaw_deg': held['yaw_deg'],
                    'distance_eval': {
                        'status': 'PERFECT',
                        'is_optimal': True,
                        'size_ratio': 0.35,
                        'center_x': 0.5,
                        'center_y': 0.5,
                        'message': 'กำลังติดตาม (หันข้าง)'
                    },
                    'box': {
                        'x': held['box'][0],
                        'y': held['box'][1],
                        'width': held['box'][2],
                        'height': held['box'][3],
                        'confidence': held['confidence'],
                        'landmarks': held['landmarks']
                    },
                    'body': None,
                    'voice_triggered': False,
                    'voice_text': None,
                    'attendance_recorded': False,
                    'timestamp': datetime.utcnow().isoformat(),
                    'telemetry': {
                        'detection_ms': detection_ms,
                        'embedding_ms': 0.0,
                        'search_ms': 0.0,
                        'total_ms': total_ms,
                        'fps': round(1000.0 / max(1.0, total_ms), 1)
                    }
                }

            self.tracker.update(None, None)
            total_ms = round((time.perf_counter() - total_start) * 1000, 2)
            return {
                'status': 'no_face',
                'faces_detected': 0,
                'body': None,
                'confidence': 0.0,
                'confirmed': False,
                'confirmation_count': 0,
                'confirmation_target': settings.TEMPORAL_CONFIRMATION_FRAMES,
                'frame_width': frame_w,
                'frame_height': frame_h,
                'distance_eval': {
                    'status': 'NO_FACE',
                    'is_optimal': False,
                    'size_ratio': 0.0,
                    'center_x': 0.5,
                    'center_y': 0.5,
                    'message': 'กรุณาวางใบหน้าให้อยู่ในกรอบวงกลม'
                },
                'telemetry': {
                    'detection_ms': detection_ms,
                    'embedding_ms': 0.0,
                    'search_ms': 0.0,
                    'total_ms': total_ms,
                    'fps': round(1000.0 / max(1.0, total_ms), 1)
                }
            }

        # Focus on the most prominent / largest face
        primary_face = max(faces, key=lambda f: f['box'][2] * f['box'][3])
        box = primary_face['box']
        raw_face = primary_face['raw_face']
        det_confidence = primary_face['confidence']
        landmarks = primary_face['landmarks']
        orientation = primary_face.get('orientation', 'FRONTAL')
        orientation_th = primary_face.get('orientation_th', 'หน้าตรง')
        yaw_deg = primary_face.get('yaw_deg', 0.0)
        is_profile = primary_face.get('is_profile', False)

        # Calculate Distance & Centering Evaluation
        box_x = float(box[0])
        box_y = float(box[1])
        box_w = float(box[2])
        box_h = float(box[3])
        face_center_x = (box_x + box_w / 2.0) / float(max(1, frame_w))
        face_center_y = (box_y + box_h / 2.0) / float(max(1, frame_h))
        face_size_ratio = max(box_w, box_h) / float(max(1, min(frame_w, frame_h)))

        if face_size_ratio < 0.20:
            distance_status = 'TOO_FAR'
            distance_msg = 'อยู่ไกลเกินไป กรุณาขยับเข้าใกล้กล้องอีกนิด'
        elif face_size_ratio > 0.65:
            distance_status = 'TOO_CLOSE'
            distance_msg = 'อยู่ใกล้เกินไป กรุณาถอยห่างจากกล้องอีกนิด'
        elif abs(face_center_x - 0.5) > 0.25 or abs(face_center_y - 0.5) > 0.25:
            distance_status = 'OFF_CENTER'
            distance_msg = 'กรุณาวางใบหน้าให้อยู่กึ่งกลางวงกลม'
        else:
            distance_status = 'PERFECT'
            distance_msg = f'ระยะพอดี ({orientation_th})'

        distance_eval = {
            'status': distance_status,
            'is_optimal': distance_status == 'PERFECT',
            'size_ratio': round(face_size_ratio, 3),
            'center_x': round(face_center_x, 3),
            'center_y': round(face_center_y, 3),
            'message': distance_msg
        }

        # 1.5 Body & Pose Detection (Whole Body Tracking)
        body_info = body_detector.detect_body_and_pose(image_bgr, box, landmarks)

        # 2. Embedding Extraction
        t1 = time.perf_counter()
        feature = recognizer.extract_feature(image_bgr, raw_face)
        embedding_ms = round((time.perf_counter() - t1) * 1000, 2)

        # 3. Vector Match Search with Adaptive Profile Threshold
        t2 = time.perf_counter()
        if not face_service.cached_profiles and db:
            await face_service.reload_cache(db)

        # When turning sideways (profile), relax threshold slightly to maintain identification
        effective_thresh = (
            settings.PROFILE_SIMILARITY_THRESHOLD
            if is_profile
            else settings.SIMILARITY_THRESHOLD
        )

        matched_user_id, matched_name, similarity = recognizer.search_best_match(
            feature,
            face_service.cached_profiles,
            threshold=effective_thresh
        )
        search_ms = round((time.perf_counter() - t2) * 1000, 2)

        # 4. Anti-False Temporal Confirmation Logic
        target_hits = settings.TEMPORAL_CONFIRMATION_FRAMES
        is_confirmed, current_hits, newly_confirmed = self.tracker.update(
            user_id=matched_user_id,
            name=matched_name,
            target_hits=target_hits,
            is_profile=is_profile,
            box=box,
            landmarks=landmarks,
            confidence=similarity or det_confidence,
            orientation=orientation,
            orientation_th=orientation_th,
            yaw_deg=yaw_deg
        )

        voice_triggered = False
        voice_text = None
        attendance_recorded = False

        # If identity is held during side profile, populate matched info
        display_user_id = matched_user_id or self.tracker.confirmed_user_id
        display_name = matched_name or self.tracker.confirmed_name

        if display_user_id is not None and is_confirmed:
            status = 'recognized'
            # Trigger voice if newly confirmed or cooldown allows
            if newly_confirmed or voice_service.can_trigger_voice(display_user_id):
                if voice_service.can_trigger_voice(display_user_id):
                    voice_service.mark_voice_triggered(display_user_id)
                    voice_triggered = True
                    voice_text = voice_service.format_text('GREETING', display_name)

                # Auto check-in attendance once per hour
                if db and newly_confirmed:
                    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
                    stmt = select(Attendance).where(
                        Attendance.user_id == display_user_id,
                        Attendance.recognized_at >= one_hour_ago
                    )
                    res = await db.execute(stmt)
                    existing_att = res.scalar_one_or_none()
                    if not existing_att:
                        attendance = Attendance(
                            user_id=display_user_id,
                            type='CHECK_IN',
                            confidence=similarity,
                            status='PRESENT',
                            recognized_at=datetime.utcnow()
                        )
                        db.add(attendance)
                        attendance_recorded = True

                # Record recognition event
                if db and newly_confirmed:
                    rec_event = RecognitionEvent(
                        user_id=display_user_id,
                        confidence=similarity,
                        camera_id=camera_id,
                        processing_time_ms=round((time.perf_counter() - total_start) * 1000, 2),
                        confirmed=True,
                        recognized_at=datetime.utcnow()
                    )
                    db.add(rec_event)
                    await db.commit()
        else:
            status = 'unknown' if display_user_id is None else 'confirming'

        total_ms = round((time.perf_counter() - total_start) * 1000, 2)

        return {
            'status': status,
            'faces_detected': len(faces),
            'user_id': display_user_id,
            'name': display_name,
            'confidence': similarity,
            'confirmed': is_confirmed,
            'confirmation_count': min(current_hits, target_hits),
            'confirmation_target': target_hits,
            'frame_width': frame_w,
            'frame_height': frame_h,
            'is_profile': is_profile,
            'orientation': orientation,
            'orientation_th': orientation_th,
            'yaw_deg': yaw_deg,
            'distance_eval': distance_eval,
            'box': {
                'x': box[0],
                'y': box[1],
                'width': box[2],
                'height': box[3],
                'confidence': det_confidence,
                'landmarks': landmarks
            },
            'body': body_info,
            'voice_triggered': voice_triggered,
            'voice_text': voice_text,
            'attendance_recorded': attendance_recorded,
            'timestamp': datetime.utcnow().isoformat(),
            'telemetry': {
                'detection_ms': detection_ms,
                'embedding_ms': embedding_ms,
                'search_ms': search_ms,
                'total_ms': total_ms,
                'fps': round(1000.0 / max(1.0, total_ms), 1)
            }
        }

recognition_service = RecognitionService()
