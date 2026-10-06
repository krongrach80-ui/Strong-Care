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

#### 3. 🧘‍♂️ โปรแกรมยืดเส้นกายภาพบำบัด 11 ท่า (11 Clinical Stretch Program & Posture Evaluator)
- ครอบคลุมกล้ามเนื้อส่วนบน คอ บ่า ไหล่ แขน และสะบักครบถ้วนทั้ง 11 ท่า
- **Stretch Posture Evaluator**: ตรวจวัดองศาข้อต่อตามหลักสรีรศาสตร์แบบเรียลไทม์ ยืนยันว่าผู้ป่วยอยู่ในท่าทางที่ถูกต้องจริงก่อนนับเวลาค้างท่า
- ระบบเลือกเวลาและท่าทาง: กำหนดเวลาค้างท่าแต่ละท่าได้อิสระ (เช่น 15 วินาที, 20 วินาที, 30 วินาที)
- นับถอยหลังเตรียมพร้อม 3-2-1 และแจ้งเตือนสลับข้างซ้าย-ขวาอัตโนมัติ

#### 4. 🔐 ระบบยืนยันตัวตนชีวมิติอัจฉริยะ (Smart Biometric Authentication & Liveness Detection)
- **สแกนใบหน้าอัจฉริยะ (Face Login & Enrollment)**:
  - ขับเคลื่อนด้วย **MediaPipe FaceLandmarker (478 Dense Canonical Facial Mesh Landmarks)** จริง
  - คำนวณ Bounding Box ของใบหน้าจริงจากจุด Landmarks ทั้งหมด 478 จุด พร้อม Margin 8%
  - **Head Yaw Pose Estimation**: คำนวณมุมหันศีรษะจากพิกัดปลายจมูก (Landmark 1) เทียบกับโหนกแก้มซ้าย-ขวา (Landmarks 234, 454) พร้อมชดเชยการกลับภาพกล้องหน้า (Mirrored CSS compensation) เพื่อความแม่นยำ
  - **Neural Blendshape Blink Detection**: ตรวจจับการกะพริบตาผ่าน Blendshapes (`eyeBlinkLeft`, `eyeBlinkRight`) ตรวจสอบช่วงเวลาหลับตา 100–900ms เพื่อป้องกันการหลอกกล้องด้วยภาพถ่ายนิ่ง (Anti-Spoofing Liveness)
  - **128-D Biometric Geometric Feature Vector**: สร้างเวกเตอร์เรขาคณิต 128 มิติที่อิงจุดศูนย์กลางและปรับสเกลด้วย Inter-Ocular Distance (IOD) และทำ L2-normalization ($||v|| = 1.0$)
  - **Euclidean Distance Matching**: คำนวณระยะห่างทางคณิตศาสตร์ใน Backend ($\le 0.60$) ไม่เก็บภาพถ่ายใบหน้าจริงของผู้ป่วย เป็นไปตามมาตรฐาน PDPA/HIPAA
- **รหัส PIN ตัวเลข 6 หลัก (Senior PIN Mode)**: ใช้งานง่าย ไม่ต้องจำตัวอักษรซับซ้อน ออกแบบเพื่อผู้สูงอายุโดยเฉพาะ
- **รหัสผ่านปกติ (Password)** สำหรับเจ้าหน้าที่และบุคลากรทางการแพทย์

#### 5. 🛡️ Clinical Safety Watchdog (ระบบความปลอดภัยชีวกลศาสตร์เรียลไทม์)
- **Exercise-Specific Landmark Visibility**: ประเมินความมั่นใจของจุดข้อต่อเฉพาะที่จำเป็นในแต่ละท่า (เช่น ท่ายกแขนดูไหล่-ศอก, ท่าสควอตดูสะโพก-เข่า-ข้อเท้า) โดยไม่หยุดนับหากข้อต่อที่ไม่เกี่ยวข้องถูกบดบัง
- **Smooth 2D Trigonometry**: คำนวณมุมข้อต่อบนระนาบ 2D เพื่อลดสัญญาณรบกวนจากมิติความลึก (Z-depth noise) ของเว็บแคม
- **Active Arm Lock**: ล็อกข้างแขนที่เริ่มเคลื่อนไหวตลอดเซ็ต ป้องกันปัญหามุมสลับข้างไปมา
- **Non-Sticking RepetitionEngine**: จัดการสถานะ HOLD อย่างต่อเนื่องเมื่องอลึกกว่าเป้าหมาย (Deep ROM) และมีระบบ Time-out 700ms รีเซ็ตหากผ่อนแรงหลุดจากช่วงปลอดภัย
- **Dynamic Rest/Trigger Thresholds**: รองรับท่าที่เริ่มจากศอกงอ เช่น `elbow_extension` (Rest $95^\circ$, Trigger $105^\circ$)
- ตรวจจับภาวะอันตราย:
  - มุมข้อต่อเกินช่วงปลอดภัย (Over-ROM)
  - ลำตัวเอียงชดเชยรุนแรง (Spine Lean $> 22^\circ$)
  - การยกบ่าเกร็งกล้ามเนื้อ (Shoulder Hike $> 18^\circ$)
  - การเคลื่อนไหวกระตุกเร็วผิดปกติ (Erratic Velocity $> 220^\circ$/s)
- **Smart Pause & Auto-Resume**: หากผู้ป่วยหลุดจากกรอบกล้อง (`OUT_OF_FRAME`) ระบบจะเปลี่ยนเป็นสถานะ `CAUTION` / `NO_DATA` เพื่อหยุดนับรอบชั่วคราว และกลับมานับต่อทันทีเมื่อก้าวกลับเข้าสู่เฟรม

#### 6. 💾 Resilient Offline-First & Privacy Architecture
- ทำงานได้ทั้งแบบมีเซิร์ฟเวอร์ และแบบ Static บน GitHub Pages ผ่านระบบ Fallback อัตโนมัติ
- จัดเก็บข้อมูลลง IndexedDB (`StrongCareDB`) อย่างละเอียดครบทุกรอบ และแคชสรุปย่อใน `localStorage`
- คิวซิงก์เดี่ยวอัตโนมัติ (Single Sync Queue) เมื่อเซิร์ฟเวอร์กลับมาออนไลน์
- รองรับสิทธิการลืมข้อมูล (**Right to be Forgotten**): ฟังก์ชัน Purge Patient Data ลบทั้งเวกเตอร์ใบหน้า ผลรายรอบ และประวัติทั้งหมดอย่างปลอดภัย

#### 7. 🩺 ส่งรายงานสรุปถึงนักกายภาพบำบัด (Therapist Report)
- บันทึกองศา ROM สูงสุด คะแนนความแม่นยำ (%) และจำนวนครั้งที่ทำได้สำเร็จ ส่งผลสรุปตรงถึงนักกายภาพบำบัด พร้อมช่องระบุบันทึกอาการจากผู้ป่วย

---

### 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)
- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS, Lucide Icons, Canvas-Confetti, Zustand
- **Computer Vision & AI**: Google MediaPipe Pose Landmarker (WebAssembly / WASM 0.10.35), MediaPipe FaceLandmarker (478 Canonical Facial Mesh Landmarks & Blendshapes)
- **Design System**: Strong Care Mint Aesthetic (#1E8A4C, #6FD67F, #E9FCEB), WCAG AAA High Contrast
- **Backend API**: PHP 8.2 REST API, PDO, MVC Architecture (Output Buffering & Content-Length streaming)
- **Database**: SQLite 3 / MySQL พร้อม IndexedDB Offline-First Fallback
