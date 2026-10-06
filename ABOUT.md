# เกี่ยวกับ Strong Care (About Strong Care)

## AI-assisted Rehabilitation Monitoring Platform
**แพลตฟอร์มช่วยติดตามและวิเคราะห์การฝึกกายภาพบำบัดด้วย AI อัจฉริยะ**
*“เพื่อการฟื้นฟูสมรรถภาพร่างกายที่ปลอดภัย ถูกต้องตามหลักชีวกลศาสตร์ และเข้าถึงง่ายสำหรับผู้สูงอายุ”*

---

### 🌐 ลิงก์ระบบออนไลน์ (Live Deployment)
- **GitHub Pages (Live Demo)**: [https://krongrach80-ui.github.io/Strong-Care/](https://krongrach80-ui.github.io/Strong-Care/)
- **GitHub Repository**: [https://github.com/krongrach80-ui/Strong-Care](https://github.com/krongrach80-ui/Strong-Care)

---

### 💡 จุดเด่นและนวัตกรรมหลัก (Key Innovations)

#### 1. 🪞 Vertical Fullscreen Smart-Mirror (กล้องกายภาพแนวตั้งเต็มจอ)
- หน้าจอกล้องจำลองกระจกกายภาพบำบัดอัจฉริยะ (Smart Rehab Mirror) แบบแนวตั้งเต็มจอ 100dvh
- แสดงโครงร่างกระดูก AI (MediaPipe WASM 33 จุด) แบบเรียลไทม์ ชัดเจนตั้งแต่ศีรษะถึงเท้า
- ล็อกความสูงพอดี 1 จอ 100% (**Zero-Scroll Design**) ผู้สูงอายุไม่ต้องเดินมาเลื่อนเมาส์หรือปัดหน้าจอขึ้นลงระหว่างฝึก

#### 2. 👨‍⚕️ Picture-in-Picture (PiP) Doctor's Guidance (คลิปวิดีโอคุณหมอสาธิตในกล้อง)
- ฝังคลิปวิดีโอสาธิตท่าทางของคุณหมอ (นพ. กฤติณห์ / หมอเฟม จากหมอชวนฟิต DeDoctor) ซ้อนอยู่ในหน้าจอกล้องโดยตรง
- ผู้ป่วยสามารถมองเห็นต้นแบบที่ถูกต้องไปพร้อมกับส่องท่าทางของตนเองในกระจกได้พร้อมกัน
- **สลับมุมซ้าย-ขวา (`⇄`) ได้ทันที**: ป้องกันไม่ให้คลิปวิดีโอบดบังแขนหรือข้อต่อข้างที่กำลังยกฝึก
- **ปุ่มย่อ-ขยาย (`—`)**: ย่อคลิปเป็นปุ่มลอยเพื่อดูกระจกเต็มจอ หรือขยายกลับมาได้ตลอดเวลา

#### 3. 🧘‍♂️ โปรแกรมยืดเส้นกายภาพบำบัด 11 ท่า (11 Clinical Stretch Program)
- ครอบคลุมกล้ามเนื้อส่วนบน คอ บ่า ไหล่ แขน และสะบักครบถ้วน
- ระบบเลือกเวลาและท่าทาง: กำหนดเวลาค้างท่าแต่ละท่าได้อิสระ (เช่น 15 วินาที, 20 วินาที, 30 วินาที)
- นับถอยหลังเตรียมพร้อม 3-2-1 และแจ้งเตือนสลับข้างซ้าย-ขวาอัตโนมัติ

#### 4. 🔐 ระบบยืนยันตัวตนยืดหยุ่น เข้าถึงง่ายสำหรับผู้สูงอายุ (Multi-Method Authentication)
- **รหัสผ่านปกติ (Password)** สำหรับเจ้าหน้าที่หรือผู้ใช้งานทั่วไป
- **รหัส PIN ตัวเลข 6 หลัก (PIN Mode)**: ใช้งานง่าย ไม่ต้องจำตัวอักษรซับซ้อน ออกแบบเพื่อผู้สูงอายุโดยเฉพาะ
- **สแกนใบหน้าอัจฉริยะ (Face Login - ทดลอง/Beta)**: ตรวจจับเวกเตอร์ใบหน้า 128 มิติ พร้อม Liveness Detection ป้องกันภาพถ่ายนิ่ง

#### 5. 🛡️ Clinical Safety Watchdog (ระบบดูแลความปลอดภัยเรียลไทม์)
- ตรวจจับองศาข้อต่อที่ผิดรูป (Over-ROM), การเอียงลำตัวชดเชย (Trunk Lean), และการยกไหล่เกร็ง (Shoulder Hike)
- มีเสียง AI ผู้ช่วยภาษาไทยแจ้งเตือนและสั่งหยุดพักชั่วคราวเพื่อความปลอดภัยทันที

#### 6. 💾 Resilient Offline-First & Privacy Architecture
- ทำงานได้ทั้งแบบมีเซิร์ฟเวอร์ และแบบ Static บน GitHub Pages ผ่านระบบ Fallback อัตโนมัติ
- จัดเก็บข้อมูลลง IndexedDB (`StrongCareDB`) อย่างละเอียดครบทุกรอบ และแคชสรุปย่อใน `localStorage`
- คิวซิงก์เดี่ยวอัตโนมัติ (Single Sync Queue) เมื่อเซิร์ฟเวอร์กลับมาออนไลน์
- รองรับสิทธิการลืมข้อมูล (**Right to be Forgotten**): ฟังก์ชัน Purge Patient Data ลบทั้งเวกเตอร์ใบหน้า ผลรายรอบ และประวัติทั้งหมดอย่างปลอดภัย

#### 7. 🩺 ปุ่มแจ้งนักกายภาพบำบัด (Therapist Report)
- บันทึกองศา ROM สูงสุด คะแนนความแม่นยำ (%) และจำนวนครั้งที่ทำได้สำเร็จ ส่งผลสรุปตรงถึงนักกายภาพบำบัด

---

### 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)
- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS, Lucide Icons, Canvas-Confetti, Zustand
- **Computer Vision & AI**: Google MediaPipe Pose Landmarker (WebAssembly / WASM), MediaPipe Face Mesh, Web Audio API
- **Design System**: Strong Care Mint Aesthetic (#1E8A4C, #6FD67F, #E9FCEB), WCAG AAA High Contrast
- **Backend API**: PHP 8.2 REST API, PDO, MVC Architecture
- **Database**: SQLite 3 / MySQL พร้อม IndexedDB Offline-First Fallback
