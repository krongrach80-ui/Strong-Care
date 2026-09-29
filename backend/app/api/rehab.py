from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models import RehabSession, RehabQueue, PTClinicalAssessment, PTSoapNote, PTExercisePrescription

router = APIRouter(prefix="/rehab", tags=["Rehabilitation"])

class RehabSessionCreate(BaseModel):
    user_id: Optional[int] = None
    patient_name: Optional[str] = "คุณยายสมศรี มีสุข"
    exercise_id: str
    exercise_name_th: str
    reps_completed: int
    target_reps: int = 10
    sets_completed: int = 1
    total_sets: int = 3
    max_rom_deg: float
    target_rom_deg: float = 120.0
    accuracy_score: float = 90.0
    pain_score: int = 0
    calories_burned: float = 0.0
    duration_seconds: int = 0
    device_type: str = "MOBILE"
    notes: Optional[str] = None

class RehabQueueBook(BaseModel):
    patient_name: str
    patient_id: str = "HN-2567-0098"
    exercise_type: str = "shoulder_abduction"
    exercise_name_th: str = "กายภาพข้อไหล่ติด"
    time_slot: str = "10:00 - 10:30"
    assigned_station: Optional[str] = "ตู้กายภาพบำบัด AI หมายเลข 1"

class QueueStatusUpdate(BaseModel):
    status: str # WAITING, CALLING, IN_SESSION, COMPLETED, CANCELLED
    assigned_station: Optional[str] = None

class QueueCallRequest(BaseModel):
    ticket_number: str
    station_name: str = "ตู้กายภาพบำบัด AI หมายเลข 1"
    patient_name: str

class ClinicalAssessmentCreate(BaseModel):
    patient_id: str = "HN-2567-0098"
    patient_name: str = "คุณยายสมศรี มีสุข"
    clinic_specialty: str = "ORTHOPEDIC"
    bp_systolic: int = 120
    bp_diastolic: int = 80
    heart_rate: int = 72
    spo2: float = 98.0
    temperature: float = 36.6
    pain_score: int = 2
    tug_seconds: float = 9.8
    berg_balance_score: int = 52
    sts_5x_seconds: float = 12.4
    contraindication_flags: Optional[str] = None
    examiner_name: str = "กภ. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)"

class SoapNoteCreate(BaseModel):
    patient_id: str = "HN-2567-0098"
    patient_name: str = "คุณยายสมศรี มีสุข"
    clinic_specialty: str = "ORTHOPEDIC"
    subjective: str
    objective: str
    assessment: str
    plan: str
    therapist_name: str = "กภ. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)"

class PrescriptionCreate(BaseModel):
    patient_id: str = "HN-2567-0098"
    patient_name: str = "คุณยายสมศรี มีสุข"
    diagnosis: str
    exercises_json: str
    frequency_per_week: int = 3
    precautions: Optional[str] = None
    therapist_name: str = "กภ. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)"

@router.post("/sessions")
async def create_rehab_session(data: RehabSessionCreate, db: AsyncSession = Depends(get_db)):
    session = RehabSession(
        user_id=data.user_id,
        patient_name=data.patient_name,
        exercise_id=data.exercise_id,
        exercise_name_th=data.exercise_name_th,
        reps_completed=data.reps_completed,
        target_reps=data.target_reps,
        sets_completed=data.sets_completed,
        total_sets=data.total_sets,
        max_rom_deg=data.max_rom_deg,
        target_rom_deg=data.target_rom_deg,
        accuracy_score=data.accuracy_score,
        pain_score=data.pain_score,
        calories_burned=data.calories_burned,
        duration_seconds=data.duration_seconds,
        device_type=data.device_type,
        notes=data.notes,
        created_at=datetime.utcnow()
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {"status": "success", "session_id": session.id, "created_at": session.created_at}

@router.get("/sessions")
async def get_rehab_sessions(patient_name: Optional[str] = None, limit: int = 30, db: AsyncSession = Depends(get_db)):
    query = select(RehabSession).order_by(desc(RehabSession.created_at)).limit(limit)
    result = await db.execute(query)
    sessions = result.scalars().all()
    if patient_name:
        sessions = [s for s in sessions if s.patient_name and patient_name.lower() in s.patient_name.lower()]
    return sessions

@router.get("/queue")
async def get_rehab_queue(db: AsyncSession = Depends(get_db)):
    await ensure_mahidol_seed_data(db)
    query = select(RehabQueue).order_by(RehabQueue.id)
    result = await db.execute(query)
    queue = result.scalars().all()
    return queue

@router.post("/queue/book")
async def book_queue(data: RehabQueueBook, db: AsyncSession = Depends(get_db)):
    count_query = select(RehabQueue)
    res = await db.execute(count_query)
    total = len(res.scalars().all())
    ticket_num = f"PT-{str(total + 10).zfill(3)}"

    ticket = RehabQueue(
        ticket_number=ticket_num,
        patient_name=data.patient_name,
        patient_id=data.patient_id,
        exercise_type=data.exercise_type,
        exercise_name_th=data.exercise_name_th,
        time_slot=data.time_slot,
        status="WAITING",
        estimated_wait_minutes=max(5, (total + 1) * 10),
        assigned_station=data.assigned_station or "ตู้กายภาพบำบัด AI หมายเลข 1",
        created_at=datetime.utcnow()
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return {"status": "success", "ticket": ticket}

@router.patch("/queue/{ticket_id}/status")
async def update_queue_status(ticket_id: int, data: QueueStatusUpdate, db: AsyncSession = Depends(get_db)):
    query = select(RehabQueue).where(RehabQueue.id == ticket_id)
    res = await db.execute(query)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Queue ticket not found")
    
    ticket.status = data.status
    if data.assigned_station:
        ticket.assigned_station = data.assigned_station
    await db.commit()
    await db.refresh(ticket)
    return {"status": "success", "ticket": ticket}

@router.post("/queue/call")
async def call_queue_announcement(data: QueueCallRequest):
    # Generates standard Mahidol hospital queue chime & announcement text
    announcement_text = f"ขอเชิญหมายเลข {data.ticket_number} คุณ {data.patient_name} ที่ {data.station_name} ค่ะ"
    return {
        "status": "success",
        "ticket_number": data.ticket_number,
        "patient_name": data.patient_name,
        "station_name": data.station_name,
        "announcement_th": announcement_text,
        "chime": "ding_dong_hospital"
    }

# Clinical Assessments (Pre-exercise triage, TUG, BBS, Vital signs)
@router.post("/assessments")
async def create_assessment(data: ClinicalAssessmentCreate, db: AsyncSession = Depends(get_db)):
    # Calculate TUG risk level
    risk = "NORMAL"
    if data.tug_seconds > 20.0:
        risk = "HIGH_FALL_RISK"
    elif data.tug_seconds > 10.0:
        risk = "MODERATE_RISK"

    # Red flag safety checks
    red_flags = []
    if data.bp_systolic >= 160 or data.bp_diastolic >= 100:
        red_flags.append("ความดันโลหิตสูงเกินเกณฑ์ปลอดภัย (>160/100 mmHg)")
    if data.spo2 < 95.0:
        red_flags.append("ระดับออกซิเจนในเลือดต่ำ (<95%)")
    if data.heart_rate > 100 or data.heart_rate < 50:
        red_flags.append("อัตราการเต้นของหัวใจผิดปกติ (>100 หรือ <50 bpm)")
    if data.pain_score >= 8:
        red_flags.append("ระดับความเจ็บปวดรุนแรง (VAS >= 8)")

    flags_str = "; ".join(red_flags) if red_flags else None

    assessment = PTClinicalAssessment(
        patient_id=data.patient_id,
        patient_name=data.patient_name,
        clinic_specialty=data.clinic_specialty,
        bp_systolic=data.bp_systolic,
        bp_diastolic=data.bp_diastolic,
        heart_rate=data.heart_rate,
        spo2=data.spo2,
        temperature=data.temperature,
        pain_score=data.pain_score,
        tug_seconds=data.tug_seconds,
        tug_risk_level=risk,
        berg_balance_score=data.berg_balance_score,
        sts_5x_seconds=data.sts_5x_seconds,
        contraindication_flags=flags_str,
        examiner_name=data.examiner_name,
        created_at=datetime.utcnow()
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return {"status": "success", "assessment": assessment, "is_safe_to_exercise": len(red_flags) == 0}

@router.get("/assessments")
async def get_assessments(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    await ensure_mahidol_seed_data(db)
    query = select(PTClinicalAssessment).order_by(desc(PTClinicalAssessment.created_at))
    if patient_id:
        query = query.where(PTClinicalAssessment.patient_id == patient_id)
    res = await db.execute(query)
    return res.scalars().all()

# SOAP Notes
@router.post("/soap")
async def create_soap_note(data: SoapNoteCreate, db: AsyncSession = Depends(get_db)):
    note = PTSoapNote(
        patient_id=data.patient_id,
        patient_name=data.patient_name,
        clinic_specialty=data.clinic_specialty,
        subjective=data.subjective,
        objective=data.objective,
        assessment=data.assessment,
        plan=data.plan,
        therapist_name=data.therapist_name,
        created_at=datetime.utcnow()
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return {"status": "success", "soap_note": note}

@router.get("/soap")
async def get_soap_notes(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    await ensure_mahidol_seed_data(db)
    query = select(PTSoapNote).order_by(desc(PTSoapNote.created_at))
    if patient_id:
        query = query.where(PTSoapNote.patient_id == patient_id)
    res = await db.execute(query)
    return res.scalars().all()

# PT Prescriptions
@router.post("/prescriptions")
async def create_prescription(data: PrescriptionCreate, db: AsyncSession = Depends(get_db)):
    rx = PTExercisePrescription(
        patient_id=data.patient_id,
        patient_name=data.patient_name,
        diagnosis=data.diagnosis,
        exercises_json=data.exercises_json,
        frequency_per_week=data.frequency_per_week,
        precautions=data.precautions,
        therapist_name=data.therapist_name,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(rx)
    await db.commit()
    await db.refresh(rx)
    return {"status": "success", "prescription": rx}

@router.get("/prescriptions")
async def get_prescriptions(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    await ensure_mahidol_seed_data(db)
    query = select(PTExercisePrescription).order_by(desc(PTExercisePrescription.created_at))
    if patient_id:
        query = query.where(PTExercisePrescription.patient_id == patient_id)
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/patients")
async def get_patients(db: AsyncSession = Depends(get_db)):
    await ensure_mahidol_seed_data(db)
    # Group patient records from assessments, soap notes, and prescriptions
    assessments_res = await db.execute(select(PTClinicalAssessment).order_by(desc(PTClinicalAssessment.created_at)))
    assessments = assessments_res.scalars().all()

    soap_res = await db.execute(select(PTSoapNote).order_by(desc(PTSoapNote.created_at)))
    soaps = soap_res.scalars().all()

    rx_res = await db.execute(select(PTExercisePrescription).order_by(desc(PTExercisePrescription.created_at)))
    rxs = rx_res.scalars().all()

    patients_dict = {}
    for a in assessments:
        if a.patient_id not in patients_dict:
            patients_dict[a.patient_id] = {
                "id": a.patient_id,
                "name": a.patient_name,
                "clinic_specialty": a.clinic_specialty,
                "latest_assessment": a,
                "latest_soap": None,
                "latest_prescription": None,
                "total_sessions": 0
            }

    for s in soaps:
        if s.patient_id in patients_dict and not patients_dict[s.patient_id]["latest_soap"]:
            patients_dict[s.patient_id]["latest_soap"] = s
        elif s.patient_id not in patients_dict:
            patients_dict[s.patient_id] = {
                "id": s.patient_id,
                "name": s.patient_name,
                "clinic_specialty": s.clinic_specialty,
                "latest_assessment": None,
                "latest_soap": s,
                "latest_prescription": None,
                "total_sessions": 0
            }

    for r in rxs:
        if r.patient_id in patients_dict and not patients_dict[r.patient_id]["latest_prescription"]:
            patients_dict[r.patient_id]["latest_prescription"] = r

    return list(patients_dict.values())

@router.post("/seed")
async def trigger_seed(db: AsyncSession = Depends(get_db)):
    seeded = await ensure_mahidol_seed_data(db, force=True)
    return {"status": "success", "seeded": seeded}

async def ensure_mahidol_seed_data(db: AsyncSession, force: bool = False):
    # Check if SOAP notes exist
    check = await db.execute(select(PTSoapNote))
    existing = check.scalars().first()
    if existing and not force:
        return False

    now = datetime.utcnow()

    # 1. Clinical Assessments
    assessments = [
        PTClinicalAssessment(
            patient_id="HN-2567-0098",
            patient_name="คุณยายสมศรี มีสุข",
            clinic_specialty="ORTHOPEDIC",
            bp_systolic=124,
            bp_diastolic=82,
            heart_rate=74,
            spo2=98.5,
            temperature=36.6,
            pain_score=3,
            tug_seconds=9.8,
            tug_risk_level="NORMAL",
            berg_balance_score=52,
            sts_5x_seconds=11.2,
            contraindication_flags=None,
            examiner_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            created_at=now
        ),
        PTClinicalAssessment(
            patient_id="HN-2567-0104",
            patient_name="คุณตาประสิทธิ์ เจริญพร",
            clinic_specialty="GERIATRIC",
            bp_systolic=134,
            bp_diastolic=84,
            heart_rate=76,
            spo2=97.0,
            temperature=36.5,
            pain_score=5,
            tug_seconds=13.6,
            tug_risk_level="MODERATE_RISK",
            berg_balance_score=46,
            sts_5x_seconds=15.4,
            contraindication_flags=None,
            examiner_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            created_at=now
        ),
        PTClinicalAssessment(
            patient_id="HN-2567-0112",
            patient_name="นายเกียรติศักดิ์ มั่นคง",
            clinic_specialty="ORTHOPEDIC",
            bp_systolic=118,
            bp_diastolic=76,
            heart_rate=70,
            spo2=99.0,
            temperature=36.7,
            pain_score=6,
            tug_seconds=7.9,
            tug_risk_level="NORMAL",
            berg_balance_score=56,
            sts_5x_seconds=8.6,
            contraindication_flags=None,
            examiner_name="กภ. นภาภรณ์ ศิริแพทย์ (ว.ก.บ. 5120)",
            created_at=now
        ),
        PTClinicalAssessment(
            patient_id="HN-2567-0078",
            patient_name="นางมาลี อัศวเมฆินทร์",
            clinic_specialty="CARDIOPULMONARY",
            bp_systolic=122,
            bp_diastolic=78,
            heart_rate=80,
            spo2=96.5,
            temperature=36.6,
            pain_score=1,
            tug_seconds=11.5,
            tug_risk_level="MODERATE_RISK",
            berg_balance_score=50,
            sts_5x_seconds=13.0,
            contraindication_flags=None,
            examiner_name="กภ. นภาภรณ์ ศิริแพทย์ (ว.ก.บ. 5120)",
            created_at=now
        ),
        PTClinicalAssessment(
            patient_id="HN-2567-0125",
            patient_name="นายอนุสรณ์ ธีระพันธ์",
            clinic_specialty="NEUROLOGICAL",
            bp_systolic=136,
            bp_diastolic=86,
            heart_rate=72,
            spo2=98.0,
            temperature=36.5,
            pain_score=2,
            tug_seconds=18.4,
            tug_risk_level="HIGH_FALL_RISK",
            berg_balance_score=38,
            sts_5x_seconds=18.2,
            contraindication_flags="ต้องมีผู้ดูแลประคองขณะยืน ฝึกการถ่ายน้ำหนัก",
            examiner_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            created_at=now
        )
    ]
    for a in assessments:
        db.add(a)

    # 2. SOAP Notes
    soap_notes = [
        PTSoapNote(
            patient_id="HN-2567-0098",
            patient_name="คุณยายสมศรี มีสุข",
            clinic_specialty="ORTHOPEDIC",
            subjective="ผู้ป่วยหญิงไทยอายุ 68 ปี บ่นปวดตึงข้อไหล่ขวาเรื้อรัง 3 เดือน ไม่สามารถเอื้อมมือรูดซิปหลังหรือสระผมได้ ปวดมากขึ้นเวลานอนตะแคงทับข้างขวา คะแนนความปวด VAS = 3/10 (ขณะพัก) และ 6/10 (ขณะยกแขนสุด)",
            objective="BP: 124/82 mmHg, HR: 74 bpm. Active ROM: Shoulder Abduction 85° (ปกติ 180°), Flexion 95°, External Rotation 30°. Tenderness at anterior joint capsule and bicipital groove. MMT Deltoid = 4/5, Supraspinatus = 4-/5. Special tests: Neer's test (+), Hawkins-Kennedy (+), Speed's test (-).",
            assessment="Adhesive Capsulitis of Right Shoulder (Frozen shoulder stage 2 - Freezing phase) with Subacromial Impingement. Functional limitation: Dressing and grooming.",
            plan="1. Moist heat pack 15 mins to right shoulder\n2. Ultrasound therapy (1 MHz, 1.2 W/cm², continuous, 5 mins) to anterior & inferior capsule\n3. Glenohumeral joint mobilization Grade II-III (Inferior & Posterior glide)\n4. AI Kiosk Exercise Therapy: Shoulder Abduction (target ROM 120°, 3 sets x 10 reps)\n5. Pendulum exercises & Wand exercises for home program 2 times/day",
            therapist_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            created_at=now
        ),
        PTSoapNote(
            patient_id="HN-2567-0104",
            patient_name="คุณตาประสิทธิ์ เจริญพร",
            clinic_specialty="GERIATRIC",
            subjective="ผู้ป่วยชายไทยอายุ 72 ปี มีอาการปวดและเสียวข้อเข่าทั้ง 2 ข้าง (ข้างขวามากกว่าข้างซ้าย) เวลาเดินขึ้น-ลงบันได และเมื่อลุกจากเก้าอี้ มีอาการข้อฝืดตึงตอนตื่นนอนเช้าประมาณ 15 นาที VAS = 5/10",
            objective="Gait: Mild antalgic gait on right leg. Both knees show mild varus deformity and bony enlargement. Crepitus palpable on active flexion-extension. Active Knee Extension: Right -12° lag, Left -8° lag. Knee Flexion: Right 110°, Left 120°. MMT Quadriceps: Right 3+/5, Left 4/5. Patellar grind test (+).",
            assessment="Bilateral Primary Knee Osteoarthritis (Right KL Grade 3, Left KL Grade 2) with Quadriceps Arthrogenic Muscle Inhibition and moderate fall risk (TUG 13.6s).",
            plan="1. TENS (100 Hz, 20 mins) for pain modulation\n2. Patellar mobilization and soft tissue release to iliotibial band\n3. Closed-chain strengthening: Seated knee extension & Sit-to-Stand functional training (3 sets x 10 reps)\n4. Dynamic balance training on balance cushion\n5. Quad isometric setting home program & knee unloading advice",
            therapist_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            created_at=now
        ),
        PTSoapNote(
            patient_id="HN-2567-0112",
            patient_name="นายเกียรติศักดิ์ มั่นคง",
            clinic_specialty="ORTHOPEDIC",
            subjective="ชายไทยอายุ 42 ปี ทำงานด้านไอที นั่งหน้าจอคอมพิวเตอร์เฉลี่ยวันละ 9-10 ชั่วโมง มีอาการปวดตึงกล้ามเนื้อคอ บ่า สะบักซ้ายเรื้อรัง 5 เดือน และมีอาการปวดร้าวขึ้นท้ายทอยข้างขมับช่วงบ่าย VAS = 6/10",
            objective="Posture: Forward head posture, Protracted shoulders, Increased thoracic kyphosis. Active Trigger Points with jump sign at Right Upper Trapezius, Levator Scapulae, and Infraspinatus. Cervical ROM: Extension limited by 20%, Rotation left 60° (restricted with pain). Spurling's test (-).",
            assessment="Myofascial Pain Syndrome (MPS) of Upper Trapezius and Levator Scapulae associated with Postural Cervical-Thoracic Dysfunction (Office Syndrome).",
            plan="1. High-Power Laser Therapy (HPLT) at trigger points\n2. Deep friction massage & myofascial trigger point release\n3. Scapular retraction and Chin-tuck posture correction training (3 sets x 10 reps)\n4. Ergonomic workspace re-arrangement and scheduled micro-break stretching",
            therapist_name="กภ. นภาภรณ์ ศิริแพทย์ (ว.ก.บ. 5120)",
            created_at=now
        ),
        PTSoapNote(
            patient_id="HN-2567-0078",
            patient_name="นางมาลี อัศวเมฆินทร์",
            clinic_specialty="CARDIOPULMONARY",
            subjective="หญิงไทยอายุ 65 ปี มีประวัติปอดอักเสบเมื่อ 2 เดือนก่อน ปัจจุบันมีอาการหายใจตื้น เหนื่อยง่ายเมื่อเดินขึ้นบันได 1 ชั้น หรือทำงานบ้านต่อเนื่อง 20 นาที SpO2 พัก 96.5%",
            objective="Thoracic excursion at xiphoid level = 2.4 cm (normal > 4 cm). Breathing pattern: Upper chest predominant with auxiliary muscle usage. Breath sounds: Decreased vesicular breath sounds at bilateral lower lung zones. 6-Minute Walk Test = 340 meters without desaturation.",
            assessment="Restrictive ventilatory impairment post-pulmonary infection with deconditioning and reduced chest cage compliance.",
            plan="1. Diaphragmatic breathing re-education in semi-fowler position\n2. Pursed-lip breathing training during exertion\n3. Thoracic expansion exercises with upper limb elevation (3 sets x 10 reps)\n4. Active cycle of breathing technique (ACBT) for mucus clearance\n5. Low-intensity interval aerobic walking program (RPE 11-13)",
            therapist_name="กภ. นภาภรณ์ ศิริแพทย์ (ว.ก.บ. 5120)",
            created_at=now
        ),
        PTSoapNote(
            patient_id="HN-2567-0125",
            patient_name="นายอนุสรณ์ ธีระพันธ์",
            clinic_specialty="NEUROLOGICAL",
            subjective="ชายไทยอายุ 58 ปี ผู้ป่วยโรคหลอดเลือดสมองตีบ (Right MCA Infarction) 6 เดือน มีภาวะอ่อนแรงซีกซ้าย ปัจจุบันต้องการฝึกเดินโดยไม่ใช้ไม้เท้าและฝึกการใช้งานมือซ้ายในการหยิบจับแก้วน้ำ",
            objective="Left Hemiparesis (Brunnstrom Stage: Arm IV, Hand IV, Leg IV). Spasticity: Modified Ashworth Scale 1+ at left elbow flexors and gastrocnemius. Ambulation: Walks with quad cane, Circumduction gait pattern with reduced heel strike. Berg Balance Scale: 38/56. TUG: 18.4s.",
            assessment="Left Hemiparesis secondary to Right MCA Ischemic Stroke with spastic hemiplegic gait and high fall risk.",
            plan="1. Bobath approach for tone inhibition and pelvic alignment\n2. Weight-bearing and weight-shifting on hemiplegic leg\n3. Sit-to-Stand functional transfer training with symmetrical weight distribution\n4. MediaPipe AI Arm & Elbow flexion/extension tracking (3 sets x 8 reps)\n5. Gait training with auditory and visual biofeedback",
            therapist_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            created_at=now
        )
    ]
    for s in soap_notes:
        db.add(s)

    # 3. Prescriptions
    prescriptions = [
        PTExercisePrescription(
            patient_id="HN-2567-0098",
            patient_name="คุณยายสมศรี มีสุข",
            diagnosis="Adhesive Capsulitis (Frozen Shoulder) of Right Shoulder",
            exercises_json='[{"id":"shoulder_abduction","nameTh":"กายภาพข้อไหล่ติด กางแขน (Shoulder Abduction)","reps":10,"sets":3,"targetAngle":120,"holdSeconds":1.5},{"id":"shoulder_flexion","nameTh":"กายภาพยกแขนไปข้างหน้า (Shoulder Flexion)","reps":10,"sets":3,"targetAngle":130,"holdSeconds":1.5}]',
            frequency_per_week=3,
            precautions="หลีกเลี่ยงการกระตุกแขนหรือยกแขนจนมีอาการเจ็บแปลบ (Pain limit VAS <= 4)",
            therapist_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            is_active=True,
            created_at=now
        ),
        PTExercisePrescription(
            patient_id="HN-2567-0104",
            patient_name="คุณตาประสิทธิ์ เจริญพร",
            diagnosis="Bilateral Knee Osteoarthritis with Quadriceps Weakness",
            exercises_json='[{"id":"knee_extension","nameTh":"เหยียดเข่าฟื้นฟูกำลังขา (Seated Knee Extension)","reps":10,"sets":3,"targetAngle":155,"holdSeconds":2.0},{"id":"sit_to_stand","nameTh":"ฝึกการลุกยืน-นั่ง (Sit to Stand Functional Training)","reps":8,"sets":3,"targetAngle":170,"holdSeconds":1.0}]',
            frequency_per_week=4,
            precautions="ห้ามบิดหมุนข้อเข่าขณะลงน้ำหนัก หากมีอาการบวมตึงให้ประคบเย็นทันที",
            therapist_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            is_active=True,
            created_at=now
        ),
        PTExercisePrescription(
            patient_id="HN-2567-0112",
            patient_name="นายเกียรติศักดิ์ มั่นคง",
            diagnosis="Myofascial Pain Syndrome & Office Syndrome (Upper Trapezius)",
            exercises_json='[{"id":"balance_posture","nameTh":"ปรับสมดุลแนวกระดูกสันหลัง (Spine Alignment & Core)","reps":10,"sets":3,"targetAngle":180,"holdSeconds":3.0},{"id":"shoulder_flexion","nameTh":"กายภาพยกแขนไปข้างหน้า (Shoulder Flexion)","reps":10,"sets":3,"targetAngle":130,"holdSeconds":1.5}]',
            frequency_per_week=5,
            precautions="รักษาระนาบคอให้ตรงเสมอ ห้ามแอ่นหลังช่วงล่างชดเชย",
            therapist_name="กภ. นภาภรณ์ ศิริแพทย์ (ว.ก.บ. 5120)",
            is_active=True,
            created_at=now
        ),
        PTExercisePrescription(
            patient_id="HN-2567-0078",
            patient_name="นางมาลี อัศวเมฆินทร์",
            diagnosis="Restrictive Ventilatory Impairment Post-Lung Infection",
            exercises_json='[{"id":"chest_expansion","nameTh":"ฝึกการขยายปอดและการหายใจลึก (Chest & Breathing PT)","reps":10,"sets":3,"targetAngle":110,"holdSeconds":3.0}]',
            frequency_per_week=5,
            precautions="หยุดพักทันทีหากมีอาการเวียนศีรษะหรือแน่นหน้าอก (Monitor SpO2 >= 95%)",
            therapist_name="กภ. นภาภรณ์ ศิริแพทย์ (ว.ก.บ. 5120)",
            is_active=True,
            created_at=now
        ),
        PTExercisePrescription(
            patient_id="HN-2567-0125",
            patient_name="นายอนุสรณ์ ธีระพันธ์",
            diagnosis="Post-Stroke Left Hemiparesis (Brunnstrom Stage IV)",
            exercises_json='[{"id":"elbow_flexion","nameTh":"บริหารข้อศอกและแขนท่อนบน (Elbow Flexion)","reps":8,"sets":3,"targetAngle":50,"holdSeconds":1.0},{"id":"sit_to_stand","nameTh":"ฝึกการลุกยืน-นั่ง (Sit to Stand Functional Training)","reps":8,"sets":3,"targetAngle":170,"holdSeconds":1.0}]',
            frequency_per_week=3,
            precautions="ต้องมีนักกายภาพบำบัดหรือผู้ดูแลประกบข้างซ้ายตลอดเวลาเพื่อป้องกันการเสียหลัก",
            therapist_name="กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)",
            is_active=True,
            created_at=now
        )
    ]
    for r in prescriptions:
        db.add(r)

    # 4. Queues
    q_check = await db.execute(select(RehabQueue))
    if not q_check.scalars().first():
        queues = [
            RehabQueue(
                ticket_number="PT-012",
                patient_name="คุณยายสมศรี มีสุข",
                patient_id="HN-2567-0098",
                exercise_type="shoulder_abduction",
                exercise_name_th="กายภาพข้อไหล่ติด (กางแขน 120°)",
                time_slot="10:00 - 10:30",
                status="CALLING",
                estimated_wait_minutes=0,
                assigned_station="ตู้กายภาพบำบัด AI หมายเลข 1",
                created_at=now
            ),
            RehabQueue(
                ticket_number="PT-013",
                patient_name="คุณตาประสิทธิ์ เจริญพร",
                patient_id="HN-2567-0104",
                exercise_type="knee_extension",
                exercise_name_th="เหยียดเข่าฟื้นฟูกำลังขา (ข้อเข่าเสื่อม)",
                time_slot="10:30 - 11:00",
                status="WAITING",
                estimated_wait_minutes=10,
                assigned_station="ตู้กายภาพบำบัด AI หมายเลข 1",
                created_at=now
            ),
            RehabQueue(
                ticket_number="PT-014",
                patient_name="นายเกียรติศักดิ์ มั่นคง",
                patient_id="HN-2567-0112",
                exercise_type="balance_posture",
                exercise_name_th="ปรับแนวกระดูกสันหลัง (ออฟฟิศซินโดรม)",
                time_slot="11:00 - 11:30",
                status="WAITING",
                estimated_wait_minutes=25,
                assigned_station="ห้องกายภาพบำบัด 2 (คลินิกกระดูกและกล้ามเนื้อ)",
                created_at=now
            ),
            RehabQueue(
                ticket_number="PT-015",
                patient_name="นางมาลี อัศวเมฆินทร์",
                patient_id="HN-2567-0078",
                exercise_type="chest_expansion",
                exercise_name_th="ฝึกการขยายปอดและการหายใจลึก (ปอด/หัวใจ)",
                time_slot="11:30 - 12:00",
                status="WAITING",
                estimated_wait_minutes=40,
                assigned_station="ห้องกายภาพบำบัด 3 (คลินิกปอดและหัวใจ)",
                created_at=now
            ),
            RehabQueue(
                ticket_number="PT-016",
                patient_name="นายอนุสรณ์ ธีระพันธ์",
                patient_id="HN-2567-0125",
                exercise_type="sit_to_stand",
                exercise_name_th="ฝึกการลุกยืนและการทรงตัว (ผู้ป่วยหลอดเลือดสมอง)",
                time_slot="13:00 - 13:30",
                status="WAITING",
                estimated_wait_minutes=70,
                assigned_station="ห้องกายภาพบำบัด 4 (คลินิกโรคระบบประสาท)",
                created_at=now
            )
        ]
        for q in queues:
            db.add(q)

    await db.commit()
    return True


