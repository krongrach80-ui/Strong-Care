from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    display_name = Column(String(150), nullable=False)
    role = Column(String(50), default='OPERATOR')  # ADMIN, OPERATOR, VIEWER
    status = Column(String(50), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    face_profiles = relationship('FaceProfile', back_populates='user', cascade='all, delete-orphan')
    attendance_records = relationship('Attendance', back_populates='user', cascade='all, delete-orphan')
    recognition_events = relationship('RecognitionEvent', back_populates='user', cascade='all, delete-orphan')

class FaceProfile(Base):
    __tablename__ = 'face_profiles'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    embedding = Column(Text, nullable=False)  # JSON array string of float vector
    model_version = Column(String(50), default='SFace_2021dec')
    angle_label = Column(String(50), default='front')  # front, left, right, up, down
    quality_score = Column(Float, default=1.0)
    image_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship('User', back_populates='face_profiles')

class RecognitionEvent(Base):
    __tablename__ = 'recognition_events'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    confidence = Column(Float, nullable=False)
    camera_id = Column(String(50), default='default_webcam')
    processing_time_ms = Column(Float, default=0.0)
    confirmed = Column(Boolean, default=True)
    recognized_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', back_populates='recognition_events')

class Attendance(Base):
    __tablename__ = 'attendance'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(50), default='CHECK_IN')  # CHECK_IN, CHECK_OUT
    confidence = Column(Float, nullable=False)
    status = Column(String(50), default='PRESENT')
    recognized_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', back_populates='attendance_records')

class VoiceEvent(Base):
    __tablename__ = 'voice_events'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    text = Column(Text, nullable=False)
    voice = Column(String(100), default='default')
    status = Column(String(50), default='played')
    created_at = Column(DateTime, default=datetime.utcnow)

class Camera(Base):
    __tablename__ = 'cameras'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    source = Column(String(255), default='0')
    status = Column(String(50), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemLog(Base):
    __tablename__ = 'system_logs'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    level = Column(String(20), default='INFO')  # INFO, WARNING, ERROR
    event = Column(String(100), nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
