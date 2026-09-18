# 🩺 Strong Care - AI Face & Voice Healthcare Platform
> **Real-time Face Recognition + AI Voice Synthesizer for Senior Care & Smart Kiosk**  
> *Repository: https://github.com/krongrach80-ui/Strong-Care*
> *Contact: krongrach80@gmail.com*

---

## 🌟 จุดเด่นของระบบ (Competition Highlights)

1. **Anti-False Recognition System (ระบบป้องกันการทักทายผิด)**
   - **Detection Quality Check**: ตรวจจับความเบลอ (Laplacian Variance), ความสว่างของแสง, และขนาดของใบหน้าก่อนนำไปประมวลผล
   - **Temporal Multi-Frame Confirmation**: ต้องตรวจพบใบหน้าบุคคลเดิมต่อเนื่องตามจำนวนเฟรมที่กำหนด (ค่ามาตรฐาน: 3 เฟรม) ถึงจะเปลี่ยนสถานะเป็น **CONFIRMED** ช่วยขจัดปัญหา False Positives จากเฟรมที่มีการขยับหรือแสงสะท้อน
   - **Voice Cooldown**: มีระบบหน่วงเวลา (เช่น 6 วินาที) ไม่เรียกชื่อซ้ำเมื่อยังยืนอยู่หน้ากล้อง เพื่อความเป็นธรรมชาติของเสียงพูด

2. **AI Telemetry Debug Mode (HUD)**
   - แสดงตัวชี้วัดความเร็วแบบสดบนหน้าจอ:
     - **FPS (Camera vs AI Inference)**
     - **Detection Latency (ms)**: เวลาตรวจจับใบหน้าด้วย OpenCV YuNet (เฉลี่ย 4–6 ms)
     - **Embedding Latency (ms)**: เวลาสกัดเวกเตอร์ 128 มิติด้วย SFace (เฉลี่ย 8–12 ms)
     - **Vector Search Latency (ms)**: เวลาค้นหา Cosine Similarity ในหน่วยความจำ (เฉลี่ย 0.5–1 ms)
     - **Total Loop Latency (ms)**

3. **Multi-Angle Face Registration Wizard**
   - ถ่ายภาพและสกัดเวกเตอร์ 5 มุมมอง (หน้าตรง, ซ้าย 15°, ขวา 15°, เงยหน้าเล็กน้อย, ก้มหน้าเล็กน้อย)
   - สร้างโปรไฟล์รวมหลายเวกเตอร์ ทำให้จดจำใบหน้าได้แม่นยำแม้เอียงหน้า

4. **Hybrid AI Voice Synthesizer**
   - รองรับ **Web Speech API** (เสียงภาษาไทยชัดเจน ไม่มีดีเลย์ รันในเบราว์เซอร์ได้ทันที)
   - รองรับ **Edge-TTS / pyttsx3** บน Backend
   - ปรับแต่ง Template ข้อความเสียงได้เองผ่านหน้า Settings (เช่น "สวัสดีครับ คุณ {name}", "ยินดีต้อนรับครับ {name}")

5. **Auto Attendance Logging**
   - บันทึกเวลาเข้างาน/เข้าเรียนอัตโนมัติเมื่อยืนยันตัวตนสำเร็จ
   - ป้องกันการบันทึกซ้ำซ้อนภายในช่วงเวลา (Rate Limiting)
   - ส่งออกข้อมูลเป็นไฟล์ CSV ได้ทันที

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Glassmorphism Cyber Theme
- **Backend**: Python 3.11, FastAPI, Async WebSockets, SQLAlchemy, Pydantic v2
- **AI Models**:
  - Face Detection: **OpenCV YuNet ONNX** (`face_detection_yunet_2023mar.onnx`)
  - Face Embedding: **OpenCV SFace ONNX** (`face_recognition_sface_2021dec.onnx`)
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
