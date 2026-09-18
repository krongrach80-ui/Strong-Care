from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.face_service import face_service

router = APIRouter(prefix='/auth', tags=['Authentication'])

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = ''

class RegisterRequest(BaseModel):
    username: str
    display_name: str
    role: Optional[str] = 'USER'
    angle_label: Optional[str] = 'front'
    image_base64: str

@router.post('/login')
async def login(req: LoginRequest):
    role = 'ADMIN' if 'admin' in req.username.lower() else 'USER'
    return {
        'access_token': f'fake-token-for-{req.username}',
        'token_type': 'bearer',
        'user': {
            'username': req.username,
            'display_name': req.username.capitalize(),
            'role': role
        }
    }

@router.post('/register')
async def register_member(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    '''
    Dual membership registration endpoint (User / Admin) with face photo capture.
    Stores photos in structured folders by role and name.
    '''
    clean_username = req.username.strip().lower()
    clean_display_name = req.display_name.strip()
    clean_role = 'ADMIN' if req.role and req.role.upper() == 'ADMIN' else 'USER'

    if not clean_username or not clean_display_name:
        raise HTTPException(status_code=400, detail='กรุณากรอกชื่อผู้ใช้และชื่อที่ต้องการแสดง')

    if not req.image_base64:
        raise HTTPException(status_code=400, detail='กรุณาถ่ายภาพใบหน้าเพื่อใช้ในการลงทะเบียน')

    result = await face_service.register_face(
        db=db,
        username=clean_username,
        display_name=clean_display_name,
        role=clean_role,
        angle_label=req.angle_label or 'front',
        image_base64=req.image_base64
    )

    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])

    return {
        'success': True,
        'message': result['message'],
        'user': {
            'id': result['user_id'],
            'username': clean_username,
            'display_name': clean_display_name,
            'role': clean_role
        },
        'image_path': result['image_path'],
        'folder_location': result.get('folder_location')
    }

@router.get('/me')
async def get_current_user():
    return {
        'username': 'admin',
        'display_name': 'System Administrator',
        'role': 'ADMIN'
    }