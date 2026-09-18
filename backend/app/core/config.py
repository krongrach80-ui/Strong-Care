from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "FaceVoice AI Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Storage and paths
    STORAGE_DIR: Path = BASE_DIR / "storage"
    FACES_DIR: Path = BASE_DIR / "storage" / "faces"
    VOICE_DIR: Path = BASE_DIR / "storage" / "voice"
    MODELS_DIR: Path = BASE_DIR / "ai" / "models"
    
    # Database (Default SQLite zero-config, can be switched to MariaDB/PostgreSQL via env)
    DATABASE_URL: str = f"sqlite+aiosqlite:///{STORAGE_DIR.as_posix()}/facevoice.db"
    
    # Security
    SECRET_KEY: str = "facevoice-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # AI Engine Thresholds
    DETECTION_SCORE_THRESHOLD: float = 0.40  # 0.40 enables robust detection of side-profile faces
    SIMILARITY_THRESHOLD: float = 0.62  # SFace cosine similarity for frontal faces
    PROFILE_SIMILARITY_THRESHOLD: float = 0.48  # SFace threshold for profile / side-turned faces
    TEMPORAL_CONFIRMATION_FRAMES: int = 3  # Must recognize same person N consecutive frames
    VOICE_COOLDOWN_SECONDS: float = 6.0  # Seconds before speaking again for same person
    
    # Voice Templates (Thai)
    TEMPLATE_GREETING: str = "สวัสดีครับ คุณ {name}"
    TEMPLATE_WELCOME: str = "ยินดีต้อนรับครับ {name}"
    TEMPLATE_ATTENDANCE: str = "บันทึกเวลาสำเร็จแล้วครับ {name}"
    DEFAULT_VOICE: str = "th-TH-PremwadeeNeural"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.FACES_DIR.mkdir(parents=True, exist_ok=True)
settings.VOICE_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)