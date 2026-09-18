import os
import time
import asyncio
from pathlib import Path
from app.core.config import settings

class VoiceService:
    def __init__(self):
        self.cooldown_tracker = {}  # {user_id: last_timestamp}

    def can_trigger_voice(self, user_id: int) -> bool:
        if user_id is None:
            return False
        now = time.time()
        last_time = self.cooldown_tracker.get(user_id, 0)
        if now - last_time >= settings.VOICE_COOLDOWN_SECONDS:
            return True
        return False

    def mark_voice_triggered(self, user_id: int):
        self.cooldown_tracker[user_id] = time.time()

    def format_text(self, template_type: str, name: str) -> str:
        name_str = name if name else 'ผู้ใช้งาน'
        if template_type == 'GREETING':
            return settings.TEMPLATE_GREETING.format(name=name_str)
        elif template_type == 'WELCOME':
            return settings.TEMPLATE_WELCOME.format(name=name_str)
        elif template_type == 'ATTENDANCE':
            return settings.TEMPLATE_ATTENDANCE.format(name=name_str)
        return f'สวัสดีครับ คุณ {name_str}'

    async def generate_audio_file(self, text: str, voice: str = None) -> str:
        '''
        Synthesizes audio using edge-tts and stores to mp3.
        Returns file path.
        '''
        if not voice:
            voice = settings.DEFAULT_VOICE

        filename = f'tts_{int(time.time() * 1000)}.mp3'
        filepath = settings.VOICE_DIR / filename
        
        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(str(filepath))
            return f'/storage/voice/{filename}'
        except Exception as e:
            print(f'[VoiceService] Edge-TTS error: {e}')
            return None

voice_service = VoiceService()
