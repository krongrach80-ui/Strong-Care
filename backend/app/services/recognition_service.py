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
        self.last_seen_time = 0
        self.has_fired = False

    def update(self, user_id: int, name: str, target_hits: int = 3) -> tuple[bool, int, bool]:
        '''
        Returns: (is_confirmed, current_hits, newly_confirmed_flag)
        '''
        now = time.time()
        # Reset if no face seen for more than 1.5 seconds
        if now - self.last_seen_time > 1.5:
            self.consecutive_hits = 0
            self.has_fired = False

        self.last_seen_time = now

        if user_id is None:
            self.consecutive_hits = max(0, self.consecutive_hits - 1)
            return (False, self.consecutive_hits, False)

        if user_id == self.candidate_user_id:
            self.consecutive_hits += 1
        else:
            self.candidate_user_id = user_id
            self.candidate_name = name
            self.consecutive_hits = 1
            self.has_fired = False

        is_confirmed = self.consecutive_hits >= target_hits
        newly_confirmed = False
        if is_confirmed and not self.has_fired:
            newly_confirmed = True
            self.has_fired = True

        return (is_confirmed, self.consecutive_hits, newly_confirmed)

    def reset(self):
        self.candidate_user_id = None
        self.candidate_name = None
        self.consecutive_hits = 0
        self.has_fired = False

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

        # Calculate Distance & Centering Evaluation
        box_x = float(box[0])
        box_y = float(box[1])
        box_w = float(box[2])
        box_h = float(box[3])
        face_center_x = (box_x + box_w / 2.0) / float(max(1, frame_w))
        face_center_y = (box_y + box_h / 2.0) / float(max(1, frame_h))
        face_size_ratio = max(box_w, box_h) / float(max(1, min(frame_w, frame_h)))

        if face_size_ratio < 0.22:
            distance_status = 'TOO_FAR'
            distance_msg = 'อยู่ไกลเกินไป กรุณาขยับเข้าใกล้กล้องอีกนิด'
        elif face_size_ratio > 0.62:
            distance_status = 'TOO_CLOSE'
            distance_msg = 'อยู่ใกล้เกินไป กรุณาถอยห่างจากกล้องอีกนิด'
        elif abs(face_center_x - 0.5) > 0.22 or abs(face_center_y - 0.5) > 0.22:
            distance_status = 'OFF_CENTER'
            distance_msg = 'กรุณาวางใบหน้าให้อยู่กึ่งกลางวงกลม'
        else:
            distance_status = 'PERFECT'
            distance_msg = 'ระยะพอดีแล้ว กรุณานิ่งไว้'

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

        # 3. Vector Match Search
        t2 = time.perf_counter()
        if not face_service.cached_profiles and db:
            await face_service.reload_cache(db)

        matched_user_id, matched_name, similarity = recognizer.search_best_match(
            feature,
            face_service.cached_profiles,
            threshold=settings.SIMILARITY_THRESHOLD
        )
        search_ms = round((time.perf_counter() - t2) * 1000, 2)

        # 4. Anti-False Temporal Confirmation Logic
        target_hits = settings.TEMPORAL_CONFIRMATION_FRAMES
        is_confirmed, current_hits, newly_confirmed = self.tracker.update(
            matched_user_id,
            matched_name,
            target_hits=target_hits
        )

        voice_triggered = False
        voice_text = None
        attendance_recorded = False

        if matched_user_id is not None and is_confirmed:
            status = 'recognized'
            # Trigger voice if newly confirmed or cooldown allows
            if newly_confirmed or voice_service.can_trigger_voice(matched_user_id):
                if voice_service.can_trigger_voice(matched_user_id):
                    voice_service.mark_voice_triggered(matched_user_id)
                    voice_triggered = True
                    voice_text = voice_service.format_text('GREETING', matched_name)

                # Auto check-in attendance once per hour
                if db and newly_confirmed:
                    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
                    stmt = select(Attendance).where(
                        Attendance.user_id == matched_user_id,
                        Attendance.recognized_at >= one_hour_ago
                    )
                    res = await db.execute(stmt)
                    existing_att = res.scalar_one_or_none()
                    if not existing_att:
                        attendance = Attendance(
                            user_id=matched_user_id,
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
                        user_id=matched_user_id,
                        confidence=similarity,
                        camera_id=camera_id,
                        processing_time_ms=round((time.perf_counter() - total_start) * 1000, 2),
                        confirmed=True,
                        recognized_at=datetime.utcnow()
                    )
                    db.add(rec_event)
                    await db.commit()
        else:
            status = 'unknown' if matched_user_id is None else 'confirming'

        total_ms = round((time.perf_counter() - total_start) * 1000, 2)

        return {
            'status': status,
            'faces_detected': len(faces),
            'user_id': matched_user_id,
            'name': matched_name,
            'confidence': similarity,
            'confirmed': is_confirmed,
            'confirmation_count': min(current_hits, target_hits),
            'confirmation_target': target_hits,
            'frame_width': frame_w,
            'frame_height': frame_h,
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
