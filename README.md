# 🩺 Strong Care - AI Face & Voice Healthcare Platform
> **Real-time Face Recognition + AI Voice Synthesizer for Senior Care & Smart Kiosk**  
> *Repository: https://github.com/krongrach80-ui/Strong-Care*
> *Contact: krongrach80@gmail.com*

---

## 🌟 จุดเด่นของระบบ (Competition Highlights)

1. **Full-Stack Google MediaPipe AI Engine (60 FPS Real-time Inference)**
   - **Google MediaPipe BlazeFace**: ตรวจจับใบหน้าและจุดชีวมิติระดับไมโคร ความเร็วสูงสุด **2.78 ms** ปราศจาก CDN (Zero-CDN Same-Origin Assets)
   - **Google MediaPipe PoseLandmarker (33 จุดชีวมิติ)**: ตรวจจับโครงกระดูกร่างกาย 33 จุดแบบ 3 มิติ ติดตามการเคลื่อนไหวแบบ 1:1

2. **ระบบตรวจจับแยกส่วนสรีระ 4 มิติ (4-Part Multi-Anatomical Tracking & HUD)**
   - 🧠 **โครงหน้า (Face Structure)**: กรอบหน้า สันจมูก เบ้าตา ปาก มุมองศาใบหน้า (Holo Cyan `#38BDF8`)
   - 🎽 **ลำตัว (Torso & Core)**: ไหล่ สะโพก แกนกระดูกสันหลัง (Spine) และ Cyber Mesh โปร่งแสง (Emerald `#10B981`)
   - 💪 **แขนและมือ (Arms & Hands)**: ต้นแขน ปลายแขน ข้อศอก ข้อมือ ฝ่ามือ นิ้วมือ (Laser Orange `#F59E0B`)
   - 🦵 **ขาและเท้า (Legs & Feet)**: สะโพก ข้อต่อหัวเข่า หน้าแข้ง ข้อเท้า ส้นเท้า และปลายเท้า (Cyber Purple `#A855F7`)
   - **Live 4-Part Status Capsule**: แสดงสถานะการตรวจจับ 4 ส่วนแบบเรียลไทม์ `[ 🧠 โครงหน้า ] [ 🎽 ลำตัว ] [ 💪 แขน ] [ 🦵 ขา ]`

3. **Smart Gesture Recognition & Thai Voice Reaction**
   - ตรวจจับท่าทางสรีระอัตโนมัติ:
     - 🙏 **การไหว้ (Thai Greeting / Wai)**: ตรวจจับการพนมมือระดับอก/คาง ระบบ Chime และกล่าวต้อนรับภาษาไทยทันที
     - 🙋‍♂️ / 🙋‍♀️ **การยกแขน / ชูมือ**: ตรวจจับความสูงของข้อมือเทียบกับระดับไหล่
     - 👋 **การโบกมือ (Waving)**: ตรวจจับการยกและโบกมือทักทาย
     - 🤔 **การสัมผัสใบหน้า / แตะคาง (Thinking)**
     - 👉 / 👈 **การเอียงตัวซ้าย / ขวา (Leaning)**
     - 🧍 **ลำตัวตั้งตรงมาตรฐาน (Upright & Centered)**

4. **ระบบตรวจจับใบหน้า e-KYC สไตล์ธนาคาร (Bank Smart Kiosk)**
   - **Smooth Gradual Progress**: นับเปอร์เซ็นต์ชีวมิติ 0% → 100% อย่างต่อเนื่องนุ่มนวล
   - **Face Distance Guidance**: คำนวณระยะห่างใบหน้าอัตโนมัติ แจ้งเตือน *"🔍 กรุณาเอาหน้าเข้ามาชิด"* พร้อมเสียงพูดภาษาไทยแนะนำ
   - **6-Point Live Verification Checklist**: ตรวจสอบเกณฑ์ 6 จุดสดบนหน้าจอ (โครงหน้า, ลำตัว, แขน, ขา, ระยะห่าง, กึ่งกลางวงกลม)
   - **Auto-Capture & Instant Register**: บันทึกภาพถ่ายชีวมิติอัตโนมัติเมื่อแถบความคืบหน้าครบ 100%

5. **Anti-False Recognition & Temporal Multi-Frame Confirmation**
   - ต้องตรวจพบใบหน้าบุคคลเดิมต่อเนื่องตามจำนวนเฟรมที่กำหนด (ค่ามาตรฐาน: 3 เฟรม) ถึงจะเปลี่ยนสถานะเป็น **CONFIRMED** ช่วยขจัดปัญหา False Positives จากแสงสะท้อนหรือการเคลื่อนไหวเร็ว
   - **Voice Cooldown**: มีระบบหน่วงเวลาป้องกันการทักทายซ้ำซ้อน

6. **Hybrid AI Voice Synthesizer**
   - รองรับ **Web Speech API** (เสียงภาษาไทยชัดเจน รันบน Client 100%)
   - รองรับ **Edge-TTS / pyttsx3** บน Backend
   - ปรับแต่ง Template ข้อความเสียงได้อิสระ

7. **📱 One-Stop Service บนโทรศัพท์มือถือ (Mobile One-Stop Hub)**
   - **Digital Patient Card & QR Pass**: บัตรประจำตัวผู้ป่วยดิจิทัล พร้อม QR Code ขนาดใหญ่สำหรับแตะสแกนเข้าตู้ทำกายภาพทันทีโดยไม่ต้องกรอกข้อมูล
   - **AI Home PT Studio**: เปิดกล้องมือถือ (รองรับสลับกล้องหน้า/หลัง) ฝึกกายภาพบำบัดที่บ้าน ตรวจจับ 33 จุดสรีระ คำนวณองศา Range of Motion (ROM) และนับจำนวนครั้งอัตโนมัติ
   - **Smart Queue & Booking**: ระบบกดจองคิวเครื่องทำกายภาพล่วงหน้า พร้อม Live Queue Radar แสดงสถานะคิวที่กำลังเรียกแบบเรียลไทม์
   - **Health Records & ROM Trends**: บันทึกสถิติการฟื้นฟู กราฟแนวโน้มองศาข้อต่อ และประเมินระดับความปวด (VAS 0-10)

8. **🏥 One-Stop Service ในเครื่องทำกายภาพบำบัด (PT Machine Kiosk Station)**
   - **Contactless Dual Check-In**: เช็คอินอัตโนมัติด้วย **สแกนใบหน้า e-KYC** หรือ **สแกน QR Code จากโทรศัพท์มือถือ** โหลดโปรแกรมที่แพทย์สั่งขึ้นจอทันที
   - **AI Interactive Workout Station**: หน้าจอ HUD ขนาดใหญ่ แสดง 3D Hologram Skeleton พร้อม Virtual Coach ท่าต้นแบบ, ตัววัดองศาข้อต่อขนาดใหญ่, และระบบแจ้งเตือนความปลอดภัยป้องกันการเสียสมดุล/หกล้ม
   - **One-Stop Checkout & Auto-Sync to Mobile**: สรุปจำนวนครั้ง องศาความยืดหยุ่น คะแนนความถูกต้อง แคลอรี่ และ**ส่งผลการรักษาเข้าโทรศัพท์มือถือของผู้ป่วยอัตโนมัติทันที**

9. **🏛️ ระบบกายภาพบำบัด โรงพยาบาลมหิดล (Faculty of Physical Therapy, Mahidol University System)**
   - **Pre-PT Triage & Vital Signs Safety Clearance**: บันทึกสัญญาณชีพก่อนทำหัตถการ (BP, HR, SpO2, Temp, VAS Pain 0-10) พร้อมระบบตรวจสอบข้อห้าม/สัญญาณอันตราย (Red Flag Alert) ตามเกณฑ์ปลอดภัยของ ม.มหิดล
   - **Fall Risk & Functional Assessment Tests**:
     - **TUG Test (Timed Up & Go)**: ตัวจับเวลาสดวิเคราะห์ความเสี่ยงล้ม (<10s ปกติ, 10-20s เสี่ยงปานกลาง, >20s เสี่ยงสูง)
     - **Berg Balance Scale (BBS)**: แบบประเมินการทรงตัว 14 หัวข้อ คะแนนเต็ม 56
     - **5-Times Sit to Stand (5xSTS)**: ประเมินแรงกล้ามเนื้อขาส่วนล่าง
   - **5 คลินิกกายภาพบำบัดเฉพาะทาง ม.มหิดล**:
     1. คลินิกกระดูกและกล้ามเนื้อ (Orthopedic PT)
     2. คลินิกโรคระบบประสาทและหลอดเลือดสมอง (Neurological PT - Stroke / Parkinson's)
     3. คลินิกปอด หัวใจ และทรวงอก (Cardiopulmonary PT)
     4. คลินิกผู้สูงอายุและชะลอความเสื่อม (Geriatric PT)
     5. คลินิกเวชศาสตร์การกีฬาและการฟื้นฟู (Sports PT)
   - **Mahidol PT SOAP Clinical Notes (เวชระเบียนมาตรฐานวิชาชีพ ม.มหิดล)**:
     - บันทึกเวชระเบียนครบ 4 มิติ: S (Subjective), O (Objective), A (Assessment), P (Plan) พร้อมลงนามนักกายภาพบำบัดวิชาชีพ (ว.ก.บ.)
   - **PT Exercise Prescription & Protocol Dispatch (ระบบใบสั่งการรักษา)**:
     - ออกใบสั่งโปรแกรมท่าบริหาร AI เฉพาะบุคคล กำหนด Reps, Sets, Target Angle ROM, Precautions
     - ส่งตรงเข้า **ตู้กายภาพบำบัด AI (PT Machine Kiosk)** และ **มือถือผู้ป่วย (Mobile Home PT)**
     - พิมพ์ใบสั่งการรักษาทางการแพทย์มาตรฐานมหิดล (Print Official Mahidol PT Prescription) พร้อม QR Code
   - **Hospital Smart Queue & Vocal Caller (ระบบคิวและเสียงประกาศโรงพยาบาลแท้)**:
     - เสียงระฆังโรงพยาบาลคู่ (Two-tone Hospital Chime) พร้อมเสียงประกาศเรียกชื่อผู้ป่วยภาษาไทยมาตรฐานโรงพยาบาลศิริราช-รามาธิบดี
   - **Mahidol Motion & Goniometry Lab (ห้องแล็บชีวกลศาสตร์)**:
     - เครื่องมือจำลองวัดมุมข้อต่อดิจิทัล (Interactive Goniometer Simulator) เปรียบเทียบเกณฑ์ Normal ROM ของ ม.มหิดล

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, MediaPipe WASM/WebGL
- **Backend**: Python 3.11, FastAPI, Async WebSockets, SQLAlchemy, Pydantic v2
- **AI Engines & Models**:
  - **Google MediaPipe BlazeFace** (`blaze_face_short_range.tflite`) - Face & Keypoints
  - **Google MediaPipe PoseLandmarker** (`pose_landmarker_lite.task`) - 33 Skeletal Keypoints & Gestures
  - **OpenCV SFace ONNX** (`face_recognition_sface_2021dec.onnx`) - 128-D Face Embeddings
  - **OpenCV YuNet ONNX** (`face_detection_yunet_2023mar.onnx`) - High-Resolution Face Detector
- **Database**:
  - ค่าเริ่มต้น: **SQLite (WAL Mode)** รันได้ทันที **100% Zero-Config**
  - รองรับการสลับไปใช้ **MariaDB/MySQL (XAMPP)** หรือ **PostgreSQL** เพียงเปลี่ยน `DATABASE_URL` ใน `.env`

---

## 🚀 วิธีการเปิดใช้งาน (One-Click Start)

### วิธีที่ 1: รันผ่านไฟล์ Script
ดับเบิลคลิกไฟล์:
- **`run_all.bat`**: เปิดทั้ง Backend และ Frontend พร้อมเปิดเบราว์เซอร์ให้อัตโนมัติ

หรือเปิดแยกหน้าต่าง:
- **`run_backend.bat`**: รัน FastAPI Server บน `http://localhost:8000`
- **`run_frontend.bat`**: รัน Vite Frontend บน `http://localhost:3000`

---

## 🌐 URLs ระบบ

- **Web Application**: `http://localhost:3000` (หรือ `http://localhost:8000`)
- **Interactive API Docs (Swagger UI)**: `http://localhost:8000/docs`
- **WebSocket Live Stream**: `ws://localhost:8000/api/v1/ws/live`
