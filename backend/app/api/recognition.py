from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models import RecognitionEvent, User
from app.schemas import RecognizeFrameRequest, RecognitionResult
from app.services.face_service import face_service
from app.services.recognition_service import recognition_service

router = APIRouter(prefix='/recognition', tags=['Recognition'])

@router.post('/recognize', response_model=RecognitionResult)
async def recognize_frame(req: RecognizeFrameRequest, db: AsyncSession = Depends(get_db)):
    img_bgr = face_service.decode_base64_image(req.image_base64)
    result = await recognition_service.process_frame(
        db=db,
        image_bgr=img_bgr,
        camera_id=req.camera_id,
        record_db=True
    )
    return result

@router.get('/events')
async def list_recent_events(limit: int = 50, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(RecognitionEvent, User.display_name, User.username)
        .outerjoin(User, RecognitionEvent.user_id == User.id)
        .order_by(RecognitionEvent.recognized_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    events = []
    for event, display_name, username in rows:
        events.append({
            'id': event.id,
            'user_id': event.user_id,
            'display_name': display_name or 'Unknown Face',
            'username': username,
            'confidence': event.confidence,
            'camera_id': event.camera_id,
            'processing_time_ms': event.processing_time_ms,
            'confirmed': event.confirmed,
            'recognized_at': event.recognized_at.isoformat()
        })
    return events

@router.post('/reset-tracker')
async def reset_tracker():
    recognition_service.tracker.reset()
    return {'success': True, 'message': 'Temporal tracker reset'}
