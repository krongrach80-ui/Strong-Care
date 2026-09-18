from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models import User, FaceProfile
from app.schemas import UserCreate, UserUpdate, UserOut
from app.services.face_service import face_service

router = APIRouter(prefix='/users', tags=['Users'])

@router.get('/', response_model=List[UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.face_profiles)).order_by(User.id.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users

@router.get('/{user_id}', response_model=UserOut)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.face_profiles)).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user

@router.post('/', response_model=UserOut)
async def create_user(req: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate
    stmt = select(User).where(User.username == req.username)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail='Username already exists')

    user = User(username=req.username, display_name=req.display_name, role=req.role, status=req.status)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.delete('/{user_id}')
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    await db.delete(user)
    await db.commit()
    await face_service.reload_cache(db)
    return {'success': True, 'message': 'User deleted successfully'}
