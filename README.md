# Strong Care

## AI-assisted Rehabilitation Monitoring Platform
### ระบบช่วยติดตามและวิเคราะห์การฝึกกายภาพด้วย AI
**“เพื่อการฝึกที่ปลอดภัย เหมาะสมกับผู้ใช้แต่ละราย และคำนึงถึงความเป็นส่วนตัว”**

- 🌐 **ทดลองใช้งานจริงออนไลน์ (Live Demo)**: [https://krongrach80-ui.github.io/Strong-Care/](https://krongrach80-ui.github.io/Strong-Care/)
- 📖 **เอกสารเกี่ยวกับระบบ (About)**: [ABOUT.md](file:///c:/Users/Devops/.gemini/antigravity-ide/scratch/StrongCare/ABOUT.md)

> **Master Pitch:**
> “Strong Care — แพลตฟอร์ม AI ช่วยติดตามและวิเคราะห์การฝึกกายภาพ เพื่อการฝึกที่ปลอดภัย เหมาะสมกับผู้ใช้แต่ละราย และคำนึงถึงความเป็นส่วนตัว”
> 
> “Strong Care is an AI-assisted rehabilitation monitoring platform that combines facial identity verification, liveness detection, pose and biomechanical analysis, real-time safety monitoring, adaptive recommendations, and human approval within a privacy-conscious offline-first architecture.”

### 🌟 ฟีเจอร์เด่นใหม่ (New Features):
1. **Vertical Fullscreen Smart-Mirror**: กล้องแนวตั้งเต็มจอสไตล์ Smart Rehab Mirror ล็อกจอ 100% Zero-Scroll เหมาะสำหรับผู้สูงอายุ
2. **Picture-in-Picture (PiP) Video Inset**: คลิปวิดีโอคุณหมอสาธิต (Dr. Fame) ฝังในหน้าจอกล้องโดยตรง สลับมุมซ้าย-ขวาได้ ไม่บังการเคลื่อนไหว
3. **11 Clinical Stretch Program**: โปรแกรมยืดเส้นกายภาพ 11 ท่า พร้อมระบบปรับเวลาค้างท่าอิสระ
4. **Senior-Friendly PIN & Face Auth**: ทางเลือกเข้าสู่ระบบด้วยรหัส PIN 6 หลัก หรือสแกนใบหน้าอัจฉริยะ (ทดลอง/Beta)
5. **Clinical Safety Watchdog**: ตรวจจับข้อต่อและมุมผิดรูป พร้อมเสียง AI ภาษาไทยแจ้งเตือนและสั่งหยุดพักฉุกเฉิน
6. **Resilient Offline-First Sync**: จัดเก็บข้อมูลลง IndexedDB และแคชสรุปย่อ พร้อมคิวซิงก์เดี่ยวอัตโนมัติ

---

## 1. CORE PRINCIPLE: HUMAN-IN-THE-LOOP CLINICAL GOVERNANCE

```text
AI วิเคราะห์ (Pose & Biomechanics)
     ↓
AI เสนอ (Adaptive Recommendation)
     ↓
มนุษย์ตรวจสอบ (Therapist / Caregiver Review)
     ↓
มนุษย์อนุมัติ (Approval Gate: อนุมัติ / ปรับแก้ / ปฏิเสธ)
     ↓
ระบบจึงเปลี่ยนแผน (Updated Configuration & Audit Trail)
```

> **ข้อกำหนดเด็ดขาด:** ห้าม AI เปลี่ยนแปลง Prescription เองโดยตรงเด็ดขาด! ทุกการปรับระดับต้องผ่าน Therapist / Caregiver Approval Gate เท่านั้น

---

## 2. MASTER ARCHITECTURE

```text
                         STRONG CARE
               AI-assisted Rehabilitation
                  Monitoring Platform
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
        IDENTIFY                             VERIFY
     Face Recognition                    Liveness Detection
     128-D Embedding                       EAR / Head Turn
            │                                   │
            └─────────────────┬─────────────────┘
                              ▼
                         CALIBRATE
                   5-Point Readiness Engine
              Light / Distance / Body / Stability
                              │
                              ▼
                           ANALYZE
                 Pose AI + Biomechanics Engine
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
             PROTECT                    EXERCISE
          Safety Engine                Rep / ROM
                │                           │
                └─────────────┬─────────────┘
                              ▼
                           IMPROVE
                       Progress Tracking
                   ΔReps / ΔROM / ΔAccuracy
                              │
                              ▼
                            ADAPT
                      AI Recommendation
                              │
                              ▼
                           APPROVE
                  Therapist / Caregiver Gate
                              │
                              ▼
                         NEW CONFIG
                    Updated Exercise Plan
                              │
                              ▼
                 IndexedDB / Sync Queue (StrongCareDB)
                              │
                              ▼
                    PHP REST API / MySQL (SQLite Fallback)
```

---

## 3. SYSTEM MODULES (17 MODULES)

1. **Face Authentication**: สแกนใบหน้าและแปลงเป็น 128-D Embedding (ไม่บันทึกภาพถ่ายดิบ)
2. **Liveness Detection**: ตรวจจับการกะพริบตา (EAR) และการหันศีรษะ (Yaw) ป้องกันภาพถ่ายนิ่ง
3. **Pose Detection**: MediaPipe Pose 33 จุดแลนด์มาร์กบน WebAssembly แบบเรียลไทม์
4. **Biomechanics Engine**: คำนวณองศาเวกเตอร์ข้อต่อ (Vector Dot Product θ = acos(BA·BC / |BA||BC|))
5. **Exercise / Repetition Engine**: State Machine นับรอบ (START → READY → MOVING → TARGET → HOLD → COMPLETE)
6. **Safety Engine**: ตรวจสอบ Over-ROM, ลำตัวเอียง (Trunk Lean), ไหล่เกร็งยก (Shoulder Hike), และความเร็วกระตุก
7. **Pre-Exercise Calibration**: 5-Point Readiness Check (Face, Light, Distance, Body, Stability)
8. **AI Voice Assistant**: เสียงนำทางภาษาไทย พร้อมระบบ Immediate Voice Preemption (Priority 10)
9. **Senior Mode**: ตัวหนังสือใหญ่ คอนทราสต์สูง ปุ่มขนาดใหญ่ 52px+ และปุ่มลอยตัว SOS ฉุกเฉิน
10. **Progress Tracking**: เปรียบเทียบผลย้อนหลัง (Previous vs Current vs Delta: ΔReps, ΔAccuracy, ΔROM)
11. **Adaptive Rehabilitation**: AI เสนอแนะการปรับระดับความยาก/ง่าย (Target ROM, Reps, Hold, Tolerance)
12. **Therapist / Caregiver Approval Gate**: หน้าต่างตัดสินใจ [อนุมัติ] [ปรับแก้] [ปฏิเสธ]
13. **Offline-first Storage**: จัดเก็บข้อมูลลง `StrongCareDB` (IndexedDB) พร้อม Offline Sync Queue
14. **Clinical Audit**: บันทึกเส้นทางการฝึกรายรอบ (Rep-by-Rep Trail), Peak Angles, Compensations และพิมพ์รายงาน
15. **Biometric Privacy**: เข้ารหัสเวกเตอร์ชีวมิติด้วย AES-GCM 256-bit พร้อมปุ่มล้างข้อมูล (Purge Biometrics)
16. **Simulation Mode**: โหมดจำลองข้อมูล Deterministic Replay สำหรับสาธิตโดยไม่ต้องใช้กล้องจริง
17. **Architecture / Competition Dashboard**: หน้าแดชบอร์ด 🔬 AI Pipeline และ Runbook 3-5 นาที

---

## 4. TECHNOLOGY STACK

- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS, Zustand, Recharts, Lucide Icons
- **Edge AI & Computer Vision**: MediaPipe Pose Landmarker, MediaPipe Face Mesh, WebAssembly (WASM), Web Audio API, Client-Side Biomechanics Algorithms
- **Backend API**: PHP 8.2 (REST API, PDO, MVC Controllers, JSON Output, CORS Middleware)
- **Database**: MySQL / MariaDB (XAMPP) พร้อม SQLite 3 Fallback อัตโนมัติ (รับประกัน 100% Uptime)
- **Local Storage**: IndexedDB (`StrongCareDB`), Offline FIFO Sync Queue
- **Design System**: Palette (#6FCF97 Primary, #3FAF70 Dark, #E8F8EF Light, #F8FAF9 Bg), Card 18px, Button 12px, Noto Sans Thai + Inter

---

## 5. REST API ENDPOINTS

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | ตรวจสอบสถานะเซิร์ฟเวอร์และไดรเวอร์ฐานข้อมูล (MySQL/SQLite) |
| `POST` | `/api/auth/enroll` | ลงทะเบียนเวกเตอร์ใบหน้า 128-D แบบเข้ารหัส (ไม่มีภาพดิบ) |
| `POST` | `/api/auth/face-login` | เข้าสู่ระบบด้วยใบหน้าผ่านการคำนวณ Cosine Similarity |
| `POST` | `/api/auth/logout` | ออกจากระบบ |
| `GET` | `/api/patients` | รายชื่อผู้ป่วยทั้งหมดในการดูแล |
| `GET` | `/api/patients/{id}` | ข้อมูลรายละเอียดของผู้ป่วย |
| `GET` | `/api/patients/{id}/history` | ประวัติการฝึกกายภาพทั้งหมดของผู้ป่วย |
| `GET` | `/api/exercises` | โปรแกรมท่ากายภาพบำบัดทั้งหมด |
| `GET` | `/api/exercises/{id}` | รายละเอียดท่าและการตั้งค่าองศาความปลอดภัย |
| `POST` | `/api/sessions` | บันทึกผลการฝึกเซสชันใหม่ พร้อมผลรายรอบและเหตุการณ์ความปลอดภัย |
| `POST` | `/api/sessions/{id}/results` | บันทึกผลลัพธ์ราย Repetition (Rep-by-Rep Trail) |
| `POST` | `/api/sessions/{id}/safety-events` | บันทึกเหตุการณ์หยุดฉุกเฉินและคำเตือนทางการแพทย์ |
| `GET` | `/api/reports/{id}` | ข้อมูลรายงานสรุปทางการแพทย์ (Clinical Session Audit) |
| `GET` | `/api/adaptive/recommendations/{id}` | ดึงคำแนะนำการปรับระดับของ AI สำหรับผู้ป่วย |
| `POST` | `/api/adaptive/approval` | บันทึกการอนุมัติ/ปรับแก้แผนของนักกายภาพบำบัด (Clinical Audit Trail) |
| `POST` | `/api/sync` | ซิงค์ข้อมูลจาก IndexedDB Offline Queue เข้าสู่เซิร์ฟเวอร์ |

---

## 6. QUICK START & RUNNING LOCALLY

### 1. วิธีเริ่มระบบด้วย Batch File (คลิกเดียว)

รันไฟล์ `run_strongcare.bat` ในโฟลเดอร์โปรเจกต์:
```cmd
run_strongcare.bat
```
ระบบจะเปิด:
- **Backend API**: `http://127.0.0.1:8000/api`
- **Frontend App**: `http://127.0.0.1:5173`

### 2. รันด้วยตนเองผ่าน Command Line

**เปิด PHP Backend:**
```powershell
php -S 127.0.0.1:8000 -t StrongCare/backend StrongCare/backend/index.php
```

**เปิด Frontend Vite:**
```powershell
cd StrongCare/frontend
npm run dev
```

---

## 7. COMPETITION DEMO RUNBOOK (3-5 MINUTES)

1. **① IDENTIFY (00:00 - 00:20)**: แสดงหน้าแรก คลิกปุ่ม **สแกนใบหน้า (Face Login)** โชว์การสแกน 128-D Vector
2. **② VERIFY (00:20 - 00:40)**: ทดสอบ Liveness (EAR Blink + Head Turn) แสดงการป้องกันรูปถ่ายนิ่ง
3. **③ CALIBRATE (00:40 - 01:20)**: เข้าสู่หน้า **เริ่มฝึก (Training)** แสดง 5-Point Calibration ตรวจแสง ระยะ ความเสถียร นับถอยหลัง 3..2..1
4. **④ ANALYZE (01:20 - 02:00)**: ทำท่า Shoulder Raise AI วัดองศาแบบเรียลไทม์ โชว์ State Machine และนับรอบอัตโนมัติ
5. **⑤ PROTECT (02:00 - 02:30)**: จงใจเอียงตัวหรือยกเกินพิกัด ระบบส่งเสียงตัดบททันที (Immediate Voice Preemption) และสั่ง Emergency Stop (พร้อมชี้ปุ่ม SOS ลอยตัว)
6. **⑥ IMPROVE (02:30 - 03:00)**: เปิดหน้า **ประวัติ & การอนุมัติ (History)** โชว์ Delta Progress (ΔReps, ΔAccuracy, ΔROM)
7. **⑦ ADAPT (03:00 - 03:20)**: แสดงการ์ด AI Adaptive Recommendation ที่เสนอปรับองศาแต่ยังไม่เปลี่ยนแผนเอง
8. **⑧ APPROVE (03:20 - 03:50)**: เปิด **Caregiver Approval Gate** กดอนุมัติหรือปรับแก้ค่า พร้อมแสดงบันทึก Audit Trail ครบ 8 Fields
9. **⑨ DASHBOARD & AUDIT (03:50 - 04:30)**: เปิดหน้า **รายงาน (Reports)** พิมพ์รายงานทางการแพทย์ และหน้า **แดชบอร์ด (Dashboard)** สรุปภาพรวม

---

## 8. CLINICAL GOVERNANCE STATEMENT

> **Strong Care ไม่ใช่เครื่องมือวินิจฉัยโรคทางการแพทย์** แต่เป็นระบบช่วยติดตามและวิเคราะห์การฝึกกายภาพด้วย AI เพื่อสนับสนุนผู้ป่วย ผู้ดูแล และนักกายภาพบำบัดให้ได้รับข้อมูลการฝึกที่แม่นยำ ปลอดภัย และโปร่งใสตรวจสอบได้ ภายใต้การควบคุมและตัดสินใจของมนุษย์เสมอ (Human-in-the-Loop)
