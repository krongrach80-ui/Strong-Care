from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models import FaceProfile
from app.schemas import RegisterFaceRequest
from app.services.face_service import face_service

router = APIRouter(prefix='/faces', tags=['Faces'])

@router.post('/register')
async def register_face(req: RegisterFaceRequest, db: AsyncSession = Depends(get_db)):
    result = await face_service.register_face(
        db=db,
        username=req.username.strip(),
        display_name=req.display_name.strip(),
        role=req.role or 'OPERATOR',
        angle_label=req.angle_label or 'front',
        image_base64=req.image_base64
    )
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    return result

@router.delete('/{profile_id}')
async def delete_face_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(FaceProfile).where(FaceProfile.id == profile_id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail='Face profile not found')

    await db.delete(profile)
    await db.commit()
    await face_service.reload_cache(db)
    return {'success': True, 'message': 'Face profile deleted successfully'}
