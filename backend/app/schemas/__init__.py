from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    display_name: str
    role: Optional[str] = 'OPERATOR'
    status: Optional[str] = 'active'

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class FaceProfileOut(BaseModel):
    id: int
    user_id: int
    angle_label: str
    quality_score: float
    image_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserOut(UserBase):
    id: int
    created_at: datetime
    face_profiles: List[FaceProfileOut] = []

    class Config:
        from_attributes = True

class RegisterFaceRequest(BaseModel):
    username: str
    display_name: str
    role: Optional[str] = 'OPERATOR'
    angle_label: Optional[str] = 'front'
    image_base64: str  # Data URL or base64 jpeg/png

class RecognizeFrameRequest(BaseModel):
    image_base64: str
    camera_id: Optional[str] = 'default_webcam'

class FaceBoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    confidence: float
    landmarks: List[List[float]] = []

class RecognitionResult(BaseModel):
    status: str  # 'recognized', 'unknown', 'no_face'
    user_id: Optional[int] = None
    name: Optional[str] = None
    confidence: float = 0.0
    confirmed: bool = False
    confirmation_count: int = 0
    confirmation_target: int = 3
    box: Optional[FaceBoundingBox] = None
    voice_triggered: bool = False
    voice_text: Optional[str] = None
    attendance_recorded: bool = False
    timestamp: str = ''
    telemetry: Dict[str, Any] = {}

class AttendanceOut(BaseModel):
    id: int
    user_id: int
    display_name: Optional[str] = None
    type: str
    confidence: float
    status: str
    recognized_at: datetime

    class Config:
        from_attributes = True

class VoiceSettingsUpdate(BaseModel):
    template_greeting: Optional[str] = None
    template_welcome: Optional[str] = None
    template_attendance: Optional[str] = None
    similarity_threshold: Optional[float] = None
    temporal_confirmation_frames: Optional[int] = None
    voice_cooldown_seconds: Optional[float] = None
    voice_name: Optional[str] = None

class VoiceSpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = None

class SystemStatsOut(BaseModel):
    cpu_percent: float
    memory_percent: float
    registered_users_count: int
    registered_faces_count: int
    today_attendance_count: int
    ai_engine_status: str
    detector_model: str
    recognizer_model: str
    fps_estimate: float
