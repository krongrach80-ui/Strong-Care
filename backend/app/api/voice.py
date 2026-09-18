from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.schemas import VoiceSettingsUpdate, VoiceSpeakRequest
from app.services.voice_service import voice_service

router = APIRouter(prefix='/voice', tags=['Voice'])

@router.get('/settings')
async def get_voice_settings():
    return {
        'template_greeting': settings.TEMPLATE_GREETING,
        'template_welcome': settings.TEMPLATE_WELCOME,
        'template_attendance': settings.TEMPLATE_ATTENDANCE,
        'similarity_threshold': settings.SIMILARITY_THRESHOLD,
        'temporal_confirmation_frames': settings.TEMPORAL_CONFIRMATION_FRAMES,
        'voice_cooldown_seconds': settings.VOICE_COOLDOWN_SECONDS,
        'voice_name': settings.DEFAULT_VOICE
    }

@router.patch('/settings')
async def update_voice_settings(req: VoiceSettingsUpdate):
    if req.template_greeting is not None:
        settings.TEMPLATE_GREETING = req.template_greeting
    if req.template_welcome is not None:
        settings.TEMPLATE_WELCOME = req.template_welcome
    if req.template_attendance is not None:
        settings.TEMPLATE_ATTENDANCE = req.template_attendance
    if req.similarity_threshold is not None:
        settings.SIMILARITY_THRESHOLD = req.similarity_threshold
    if req.temporal_confirmation_frames is not None:
        settings.TEMPORAL_CONFIRMATION_FRAMES = req.temporal_confirmation_frames
    if req.voice_cooldown_seconds is not None:
        settings.VOICE_COOLDOWN_SECONDS = req.voice_cooldown_seconds
    if req.voice_name is not None:
        settings.DEFAULT_VOICE = req.voice_name

    return {'success': True, 'message': 'Settings updated successfully'}

@router.post('/speak')
async def speak(req: VoiceSpeakRequest):
    audio_path = await voice_service.generate_audio_file(req.text, req.voice)
    return {
        'success': True,
        'text': req.text,
        'audio_url': audio_path
    }
