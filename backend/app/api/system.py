from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date, time as dtime
import os
import psutil

from app.core.database import get_db
from app.models import User, FaceProfile, Attendance
from app.schemas import SystemStatsOut
from ai.detector import detector
from ai.recognizer import recognizer

router = APIRouter(prefix='/system', tags=['System'])

@router.get('/health')
async def health():
    return {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}

@router.get('/stats')
async def system_stats(db: AsyncSession = Depends(get_db)):
    # User count
    user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    # Face profiles count
    face_count = (await db.execute(select(func.count(FaceProfile.id)))).scalar() or 0
    # Today attendance
    today_start = datetime.combine(date.today(), dtime.min)
    today_att = (await db.execute(
        select(func.count(Attendance.id)).where(Attendance.recognized_at >= today_start)
    )).scalar() or 0

    # Process metrics
    cpu = 0.0
    mem = 0.0
    try:
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent
    except Exception:
        pass

    return {
        'cpu_percent': cpu,
        'memory_percent': mem,
        'registered_users_count': user_count,
        'registered_faces_count': face_count,
        'today_attendance_count': today_att,
        'ai_engine_status': 'ONLINE' if (detector.detector and recognizer.recognizer) else 'DEGRADED',
        'detector_model': 'OpenCV YuNet ONNX (face_detection_yunet_2023mar.onnx)',
        'recognizer_model': 'OpenCV SFace ONNX (face_recognition_sface_2021dec.onnx)',
        'fps_estimate': 30.0
    }
