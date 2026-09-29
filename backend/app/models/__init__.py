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

class RehabSession(Base):
    __tablename__ = 'rehab_sessions'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    patient_name = Column(String(150), nullable=True)
    exercise_id = Column(String(100), nullable=False)
    exercise_name_th = Column(String(200), nullable=False)
    reps_completed = Column(Integer, default=0)
    target_reps = Column(Integer, default=10)
    sets_completed = Column(Integer, default=1)
    total_sets = Column(Integer, default=3)
    max_rom_deg = Column(Float, default=0.0)
    target_rom_deg = Column(Float, default=120.0)
    accuracy_score = Column(Float, default=90.0)
    pain_score = Column(Integer, default=0)  # 0..10
    calories_burned = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    device_type = Column(String(50), default='MOBILE')  # MOBILE, MACHINE_KIOSK
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RehabQueue(Base):
    __tablename__ = 'rehab_queues'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_name = Column(String(150), nullable=False)
    patient_id = Column(String(100), default='HN-0001')
    exercise_type = Column(String(100), default='shoulder_abduction')
    exercise_name_th = Column(String(200), default='กายภาพข้อไหล่ติด')
    time_slot = Column(String(100), default='10:00 - 10:30')
    status = Column(String(50), default='WAITING')  # WAITING, CALLING, IN_SESSION, COMPLETED, CANCELLED
    estimated_wait_minutes = Column(Integer, default=10)
    assigned_station = Column(String(100), default='ตู้กายภาพบำบัดหมายเลข 1')
    created_at = Column(DateTime, default=datetime.utcnow)

class PTClinicalAssessment(Base):
    __tablename__ = 'pt_clinical_assessments'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(100), index=True, nullable=False)
    patient_name = Column(String(150), nullable=False)
    clinic_specialty = Column(String(100), default='ORTHOPEDIC')
    bp_systolic = Column(Integer, default=120)
    bp_diastolic = Column(Integer, default=80)
    heart_rate = Column(Integer, default=75)
    spo2 = Column(Float, default=98.0)
    temperature = Column(Float, default=36.6)
    pain_score = Column(Integer, default=0)
    tug_seconds = Column(Float, default=0.0)
    tug_risk_level = Column(String(50), default='NORMAL')
    berg_balance_score = Column(Integer, default=56)
    sts_5x_seconds = Column(Float, default=0.0)
    contraindication_flags = Column(Text, nullable=True)
    examiner_name = Column(String(150), default='กภ. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)')
    created_at = Column(DateTime, default=datetime.utcnow)

class PTSoapNote(Base):
    __tablename__ = 'pt_soap_notes'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(100), index=True, nullable=False)
    patient_name = Column(String(150), nullable=False)
    clinic_specialty = Column(String(100), default='ORTHOPEDIC')
    subjective = Column(Text, nullable=False)
    objective = Column(Text, nullable=False)
    assessment = Column(Text, nullable=False)
    plan = Column(Text, nullable=False)
    therapist_name = Column(String(150), default='กภ. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)')
    created_at = Column(DateTime, default=datetime.utcnow)

class PTExercisePrescription(Base):
    __tablename__ = 'pt_exercise_prescriptions'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(100), index=True, nullable=False)
    patient_name = Column(String(150), nullable=False)
    diagnosis = Column(String(255), nullable=False)
    exercises_json = Column(Text, nullable=False)
    frequency_per_week = Column(Integer, default=3)
    precautions = Column(Text, nullable=True)
    therapist_name = Column(String(150), default='กภ. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


