# 🏆 STRONG CARE v1.0 — COMPETITION PLAYBOOK & DEFENSE KIT
> **Project Phase:** `FEATURE FREEZE 🔒 COMPETITION FINAL BUILD`  
> **Core Value Proposition:** *“Strong Care ไม่ได้สร้าง AI เพื่อแทนที่นักกายภาพ แต่สร้าง AI เพื่อช่วยให้นักกายภาพเห็นข้อมูลที่ละเอียดขึ้น ตัดสินใจได้ดีขึ้น และมี Safety Gate คอยป้องกันไม่ให้ AI เปลี่ยนแผนการรักษาโดยไม่มีมนุษย์อนุมัติ”*

---

## ⏱ 1. DETERMINISTIC 5-MINUTE DEMO SCRIPT (00:00 - 05:00)

| Timestamp | Phase / Action | สิ่งที่แสดงบนหน้าจอ | บทพูดภาษาไทย (Presenter Script) | คำที่ห้ามพูดเด็ดขาด ❌ |
|---|---|---|---|---|
| **00:00 – 00:20** | **เปิด Strong Care** | Home Dashboard, เลือกผู้ป่วย "สมศักดิ์ ชัยชนะ" | *“สวัสดีครับคณะกรรมการ Strong Care v1.0 เป็นแพลตฟอร์มช่วยติดตามและวิเคราะห์การฝึกกายภาพด้วย AI สำหรับผู้สูงอายุและผู้ป่วยฟื้นฟูสมรรถภาพ โดยมีหัวใจหลักคือความปลอดภัยทางการแพทย์ การรักษาความเป็นส่วนตัวตามหลัก Privacy by Design และมีมนุษย์เป็นผู้ตัดสินใจสูงสุด (Human Oversight)”* | AI วินิจฉัยผู้ป่วย, ระบบปลอดภัย 100%, PDPA Compliant |
| **00:20 – 00:40** | **Face Authentication** | Face Mesh 478 จุด, 128-D Vector, Match 98% | *“ก่อนเริ่มฝึก ระบบยืนยันตัวตนคนไข้ด้วย 128-D Anthropometric Geometric Projection คำนวณจากสัดส่วนกายวิภาค เช่น ระยะห่างระหว่างม่านตา (IOD) และความสมมาตร โดยไม่มีการส่งภาพถ่ายใบหน้าขึ้นคลาวด์แม้แต่ภาพเดียว”* | เก็บรูปถ่ายคนไข้ไว้บน Cloud, landmarks.slice(0, 128) |
| **00:40 – 01:00** | **Liveness Verification** | Dynamic EAR Dip, Head Yaw Turn, EAR 0.31 | *“เพื่อป้องกัน Presentation Attack ระบบตรวจจับการกะพริบตาธรรมชาติด้วย Eye Aspect Ratio และตรวจการเอียงศีรษะ หากมีผู้นำภาพถ่ายนิ่งหรือหน้าจอมือถือมาหลอก ระบบจะ Reject ปฏิเสธทันที”* | ไม่มีทางโดนหลอก 100% |
| **01:00 – 01:20** | **5-Point Calibration** | Checklist 5 ข้อ: แสงสว่าง, ระยะ 2m, ร่างกายครบ, นับถอยหลัง | *“ก่อนขยับ ระบบจะเข้าสู่ 5-Point Calibration เพื่อเตรียมสิ่งแวดล้อมให้พร้อม แสงสว่างพอ และเห็นข้อต่อครบ 33 จุด หากคนไข้ยืนไม่ตรงหรือมีสิ่งกีดขวาง ระบบจะไม่เริ่มนับรอบ”* | ใครๆ ก็ฝึกได้ทันทีโดยไม่ต้องตรวจ |
| **01:20 – 02:00** | **Live Pose & Biomechanics** | 33 Skeleton Keypoints, Joint Angle 108°, 9/10 Reps | *“ระหว่างการฝึก Engine จะวิเคราะห์ชีวกลศาสตร์แบบเรียลไทม์บนเครื่อง ทั้งมุมองศา Active ROM และความเร็วเชิงมุม โดยมีกฎเหล็กว่า หากความมั่นใจต่ำกว่าเกณฑ์ ระบบจะไม่ตัดสินผล และไม่เพิ่มจำนวนรอบเด็ดขาด”* | ระบบคำนวณถูกต้อง 100% ทุกมุม |
| **02:00 – 02:30** | **Safety Event Real Halt** | Trunk Lean 24° > 22° → STOPPED, Timer หยุด, Voice Preemption | *“นี่คือจุดสำคัญด้านความปลอดภัยครับ เมื่อคนไข้เกิดการเอียงตัวชดเชย 24 องศา เกินเกณฑ์ระบบ 22 องศา ระบบจะสั่งหยุดฉุกเฉินจริง ตัวนับรอบหยุด ตัวจับเวลาหยุด และเสียงเตือนจะแทรกบทพูดปกติทันที”* | 22° คือมาตรฐานการแพทย์สากลที่ทุกโรงพยาบาลใช้ |
| **02:30 – 03:00** | **Progress & Baseline** | Baseline 82° → 108° (+31.7%), Accuracy +23% | *“ในด้านพัฒนาการ Strong Care ไม่ได้บอกว่าคนไข้หายแล้ว แต่แสดงเป็น Performance Trend เชิงประจักษ์ เปรียบเทียบจาก Baseline แรกรับ 82 องศา สู่ 108 องศาในปัจจุบัน ซึ่งพัฒนาขึ้น 31.7%”* | AI รู้ว่าคนไข้หายดีแล้ว, ผู้ป่วยหายเป็นปกติแล้ว |
| **03:00 – 03:30** | **Explainable AI (XAI)** | AI Recommendation: เสนอปรับ ROM 110° → 115° พร้อมเหตุผล 3 ข้อ | *“เมื่อระบบเสนอปรับเป้าหมายจาก 110 เป็น 115 องศา ระบบสามารถตอบคำถามกรรมการได้ทันทีว่า ทำไมถึงแนะนำเช่นนี้ เพราะ Accuracy สูงกว่า 90% มีพัฒนาการองศาเพิ่มขึ้นต่อเนื่อง และไม่มี Safety Event ใน 3 เซสชันล่าสุด”* | AI รู้ใจคนไข้, AI สั่งจ่ายยาเอง |
| **03:30 – 04:00** | **Therapist Approval Gate** | ปุ่ม APPROVE / MODIFY / REJECT, Digital Audit Receipt | *“จุดขายสำคัญด้าน Governance คือ AI เสนอได้ แต่ไม่มีสิทธิ์เปลี่ยนแผนการรักษาเองเด็ดขาด ข้อเสนอจะถูกกักไว้ที่ Approval Gate เพื่อให้นักกายภาพเป็นผู้กด Approve หรือปรับเปลี่ยน พร้อมบันทึก Digital Audit Trail กำกับทุกครั้ง”* | AI อัปเดตแผนการรักษาลงฐานข้อมูลอัตโนมัติ |
| **04:00 – 04:30** | **Offline / Sync** | StrongCareDB (IndexedDB), Offline Mode Badge | *“แม้สัญญาณอินเทอร์เน็ตจะขาดหาย Core Rehabilitation ของ Strong Care ก็ยังทำงานได้สมบูรณ์บนเครื่อง ข้อมูลจะถูกพักไว้ใน StrongCareDB และซิงค์ขึ้นระบบเฉพาะสรุปผลเมื่อกลับมาออนไลน์”* | ต้องต่ออินเทอร์เน็ตความเร็วสูงตลอดเวลา |
| **04:30 – 05:00** | **Fail-Safe Matrix & สรุป** | 10/10 Fail-Safe Passed, 0 Failures, ปิดการนำเสนอ | *“สุดท้ายนี้ เราไม่ได้แค่พูดว่าระบบปลอดภัย แต่เรามี Automated Fail-Safe Test Suite ที่ทดสอบผ่านจริง 10 จาก 10 ด่านความปลอดภัย Strong Care จึงไม่ใช่แค่เว็บตรวจจับท่าทาง แต่เป็น AI Rehabilitation Platform ที่พร้อมใช้งานอย่างรับผิดชอบ ขอบคุณครับ”* | เราเป็นระบบที่ดีที่สุดในโลก |

---

## ⚖️ 2. JUDGE Q&A DEFENSE MASTER (10 คำถาม-คำตอบ กรรมการ)

### Q1: AI สามารถเปลี่ยนแผนการรักษาเองไหม?
* **คำตอบสั้น (Soundbite):** *“ไม่ครับ AI ของ Strong Care ทำหน้าที่วิเคราะห์และเสนอ Recommendation เท่านั้น การเปลี่ยน Prescription ต้องผ่าน Therapist/Caregiver Approval Gate และถูกบันทึกใน Clinical Governance Audit Trail ครับ”*
* **เหตุผลทางเทคนิค:** ระบบวาง Security Boundary กักข้อเสนอไว้ที่สถานะ `PENDING_CLINICAL_APPROVAL` และไม่มี Direct DB Write จาก AI สู่ตาราง Prescription
* **กับดักที่ห้ามตอบ ❌:** ห้ามตอบว่า "เปลี่ยนได้เฉพาะเคสง่ายๆ" หรือ "เปลี่ยนล่วงหน้าแล้วให้ตรวจย้อนหลัง"

### Q2: ถ้า AI มองไม่เห็นตัวผู้ป่วยหรือความมั่นใจต่ำ ระบบจะทำอย่างไร?
* **คำตอบสั้น (Soundbite):** *“ระบบจะลด Confidence Score และเข้าสู่ Fail-Safe ทันที โดยใช้กฎ NO DECISION, NO REP, NO RECOMMENDATION ครับ”*
* **เหตุผลทางเทคนิค:** มี Confidence Gatekeeper หาก Visibility เฉลี่ย < 50% หรือหลุดเฟรม State Machine จะล็อกตัวนับรอบ และ Safety Watchdog จะติดสลักเตือนจัดท่าใหม่
* **กับดักที่ห้ามตอบ ❌:** ห้ามตอบว่า "ระบบจะเดาตำแหน่งข้อต่อให้" หรือ "ใช้ AI เติมส่วนที่แหว่งไป"

### Q3: ถ้า Internet หลุดระหว่างฝึก?
* **คำตอบสั้น (Soundbite):** *“Core rehabilitation monitoring ยังทำงานต่อบนเครื่องได้ตามปกติ ข้อมูลจะถูกเก็บใน StrongCareDB และเข้าคิว Sync อัตโนมัติเมื่อต่อเน็ตครับ”*
* **เหตุผลทางเทคนิค:** MediaPipe และ Biomechanics Engine รันบน Client-Side WebAssembly ในเบราว์เซอร์ ข้อมูลเก็บลง IndexedDB บนเครื่อง 100%
* **กับดักที่ห้ามตอบ ❌:** ห้ามพูดว่า "ระบบต้องสตรีมวิดีโอขึ้นคลาวด์ตลอดเวลา"

### Q4: ข้อมูลใบหน้าถูกส่งขึ้น Cloud ไหม?
* **คำตอบสั้น (Soundbite):** *“ไม่มีการส่งภาพถ่ายใบหน้าขึ้น Cloud ครับ สถาปัตยกรรมทำงานแบบ Local-First และบันทึกเฉพาะเวกเตอร์ 128 มิติที่เข้ารหัสแล้ว”*
* **เหตุผลทางเทคนิค:** ออกแบบตามหลัก Privacy by Design ภาพจากกล้องประมวลผลบน RAM ชั่วคราวเพื่อคำนวณเวกเตอร์ 128 มิติ แล้วทิ้ง Frame ทันที
* **กับดักที่ห้ามตอบ ❌:** ห้ามเคลมว่า "ผ่านรับรอง PDPA 100%" ให้ใช้คำว่า "Privacy-oriented architecture / Privacy by Design"

### Q5: ค่า Trunk Lean 22° เป็นมาตรฐานทางการแพทย์สากลหรือ?
* **คำตอบสั้น (Soundbite):** *“ไม่ใช่ universal clinical standard ครับ แต่เป็น System-configured safety threshold ที่สามารถปรับแต่งได้ตามระดับความเสี่ยงของคนไข้ครับ”*
* **เหตุผลทางเทคนิค:** 22° คือเกณฑ์เริ่มต้นใน Configuration ป้องกันการเอียงตัวชดเชย ซึ่งนักกายภาพสามารถปรับลดลงเป็น 15° หรือเพิ่มขึ้นตามสรีระคนไข้ได้
* **กับดักที่ห้ามตอบ ❌:** อย่าอ้างว่าเป็น "มาตรฐานกระทรวงสาธารณสุข" หรือ "กฎสากลที่ทุกโรงพยาบาลบังคับ"

### Q6: 128-D Face Embedding คำนวณมาจากไหน?
* **คำตอบสั้น (Soundbite):** *“สร้างจาก MediaPipe 478 landmarks ผ่าน Anthropometric Geometric Projection แล้วทำ L2 Normalization ไม่ใช่การ mock slice ครับ”*
* **เหตุผลทางเทคนิค:** คำนวณระยะห่างกายวิภาคเทียบกับ IOD (Inter-Ocular Distance), มุมตรีโกณมิติ atan2, อัตราส่วนความกว้างยาวใบหน้า, ดัชนีความสมมาตร และ Polar Harmonic Projections 64 จุดรอบศูนย์กลางใบหน้า
* **กับดักที่ห้ามตอบ ❌:** อย่าตอบคลุมเครือ ต้องระบุ IOD Normalization และ Geometric Projection

### Q7: ทำไมต้องใช้ AI ในเมื่อดูคลิปวิดีโอทั่วไปเพื่อออกกำลังกายก็ได้?
* **คำตอบสั้น (Soundbite):** *“เพราะวิดีโอทั่วไปไม่มี Real-time Biofeedback และไม่มี Safety Watchdog คอยเตือนเมื่อเกิดท่าทางชดเชยที่เสี่ยงอันตรายครับ”*
* **เหตุผลทางเทคนิค:** ผู้สูงอายุมักไม่รู้ตัวว่าเอียงหลังหรือเกร็งบ่า Strong Care ทำหน้าที่เป็นกระจกชีวกลศาสตร์ที่ให้เสียงเตือนทันที และสั่งหยุดก่อนเกิดการบาดเจ็บ
* **กับดักที่ห้ามตอบ ❌:** อย่าตอบว่า "เพื่อแทนที่นักกายภาพบำบัดในโรงพยาบาล"

### Q8: ระบบรู้ได้อย่างไรว่าผู้ป่วยมีพัฒนาการดีขึ้นจริง?
* **คำตอบสั้น (Soundbite):** *“เปรียบเทียบ Baseline แรกเข้า กับ Session ปัจจุบัน ผ่านตัวชี้วัดเชิงปริมาณ เช่น ROM Delta, Accuracy, และ Form Stability เป็น Performance Trend ครับ”*
* **เหตุผลทางเทคนิค:** แสดงกราฟพัฒนาการเปรียบเทียบจากวันแรก 82° สู่ 108° อย่างเป็นรูปธรรม
* **กับดักที่ห้ามตอบ ❌:** ห้ามพูดว่า "AI รู้ว่าคนไข้หายดีแล้ว" ให้ใช้ "มี Performance Trend ดีขึ้นในมิติชีวกลศาสตร์"

### Q9: ถ้าหาก AI แนะนำเพิ่มองศาการฝึกผิดพลาด จะเกิดอันตรายไหม?
* **คำตอบสั้น (Soundbite):** *“ไม่เกิดอันตรายครับ เพราะข้อเสนอถูกกักที่ Approval Gate และระหว่างฝึกยังมี Safety Watchdog คอยคุมเพดานความปลอดภัยอีกชั้นครับ”*
* **เหตุผลทางเทคนิค:** มี Dual Safety Layer: 1) มนุษย์ต้องอนุมัติก่อน และ 2) แม้เป้าหมายใหม่จะสูงขึ้น หากยกเกินพิกัดปลอดภัย (Over-ROM) ระบบจะตัดการฝึกทันที
* **กับดักที่ห้ามตอบ ❌:** อย่าตอบว่า "AI ของเราแม่นยำ 100% จนไม่มีทางแนะนำผิด"

### Q10: จุดเด่นที่แท้จริงของ Strong Care ที่ต่างจาก Pose Estimation ทั่วไปคืออะไร?
* **คำตอบสั้น (Soundbite):** *“Strong Care เป็นระบบปิดครบวงจรตั้งแต่ Identify → Verify → Calibrate → Analyze → Protect → Adapt → Approve โดยมี Safety และ Human Oversight เป็นแกนหลักครับ”*
* **เหตุผลทางเทคนิค:** โปรเจกต์ทั่วไปทำแค่ตรวจจับแล้วนับจำนวนครั้ง แต่ Strong Care มี Liveness ตรวจสอบบุคคลจริง, 5-Point Calibration, Emergency Stop สั่งหยุดจริง, XAI และ Approval Gate
* **กับดักที่ห้ามตอบ ❌:** อย่าตอบแค่เรื่อง "UI สวย" หรือ "มีฟีเจอร์เยอะ" ให้เน้นเรื่อง Closed-Loop Safety & Clinical Governance

---

## 🛡 3. VOCABULARY GUARDRAILS (คู่มือคำพูดปลอดภัย)

| ห้ามพูดเด็ดขาด ❌ (Forbidden) | คำที่ต้องใช้แทน ✅ (Safe & Defensible) |
|---|---|
| AI สามารถ **วินิจฉัย** ผู้ป่วย | ระบบเป็น **AI-assisted** ช่วยติดตามและวิเคราะห์ทางชีวกลศาสตร์ |
| AI รู้ว่าผู้ป่วย **หายดีแล้ว / หายป่วย** | ข้อมูลแสดง **Performance Trend** ที่มีพัฒนาการเชิงบวก |
| 22° คือ **มาตรฐานทางการแพทย์สากล** | 22° คือ **System-configured safety threshold** ของระบบ |
| ระบบปลอดภัย **100%** | ระบบมี **Clinical Fail-Safe Architecture** |
| ระบบผ่านการรับรอง **PDPA Compliant** | สถาปัตยกรรมออกแบบตามหลัก **Privacy by Design** |
| AI **สั่งปรับยา / สั่งเปลี่ยนแผนการรักษา** | AI เสนอ **Recommendation** ซึ่งต้องผ่าน **Therapist Approval Gate** |

---

## 📹 4. REAL CAMERA E2E TEST & STAGE FAILOVER PROTOCOL

### Protocol A: กล้องจริง (Live Camera E2E Test)
1. ตรวจสอบไฟและแสงสว่างในห้อง (ไม่ย้อนแสง)
2. ถอยห่างจากกล้อง $1.8 - 2.5$ เมตร ให้กล้องจับได้ตั้งแต่ศีรษะถึงสะโพก
3. เข้าหน้าฝึกกายภาพ (`/training`)
4. ให้ระบบทำ 5-Point Calibration จนขึ้นสีเขียว 5 จุด
5. ยกแขนทำท่า Shoulder Flexion 1-2 ครั้ง สังเกต Dial องศาหมุนตามจริง
6. **สาธิต Safety Event:** แกล้งเอียงลำตัวไปด้านข้าง $25^\circ$ → สังเกตตัวนับรอบล็อกเป็น `STOP`, ตัวจับเวลาหยุด และมีเสียงเตือนฉุกเฉินดังขึ้นทันที

### Protocol B: แผนสำรองหน้างาน (1-Click Simulation Failover)
> *หากกล้องบนเวทีมีปัญหา แสงมืด หรือมีสิ่งรบกวนสัญญาณ:*
1. **ไม่ต้องตกใจและไม่ต้องพยายามซ่อมกล้องหน้างาน**
2. กดไอคอนถ้วยรางวัล `[ 🏆 Competition Demo ]` ที่มุมขวาบน
3. ระบบจะเปิด **Competition Runbook & Simulator** ทันที
4. ดำเนินการสาธิตทั้ง 11 ขั้นตอนผ่าน Deterministic Simulator พร้อมป้าย `[ DEMO DATA ]` ที่ชัดเจนและโปร่งใส

---

## ✅ 5. FINAL QA STATUS MATRIX

| หมวดหมู่ | รายการตรวจสอบ | สถานะ | หลักฐานเชิงประจักษ์ |
|---|---|:---:|---|
| **Biometrics** | 128-D Face Embedding Pipeline | 🟢 PASSED | Anthropometric Geometric Projection + $L_2$ Normalization |
| **Anti-Spoofing**| Dynamic EAR & Head Yaw Liveness | 🟢 PASSED | ตรวจจับการกะพริบตาและการหันศีรษะ ปฏิเสธภาพถ่ายนิ่ง |
| **Confidence** | Landmark Confidence Gating | 🟢 PASSED | Visibility < 50% บล็อก Rep, บล็อก Decision ทันที |
| **Safety Engine**| Emergency Stop Real Halt | 🟢 PASSED | Trunk Lean > 22° หยุด Rep, หยุด Timer, แทรกเสียงเตือน |
| **Governance** | Therapist Approval Gate | 🟢 PASSED | AI ไม่มี Direct DB Write, ต้องมีใบรับรอง Audit Trail |
| **Offline** | Edge AI + StrongCareDB | 🟢 PASSED | IndexedDB จัดคิวออฟไลน์ ซิงค์เฉพาะ Summary |
| **Automated QA**| Fail-Safe Matrix 10/10 Test Suite | 🟢 10/10 | รันผ่าน CLI `npm test` และ Live UI Runner 0 Failures |
| **Build & Code** | TypeScript & Production Bundle | 🟢 PASSED | `tsc --noEmit` 0 errors, `vite build` สำเร็จใน 9.96s |
| **Feature Phase**| Scope Management | 🔒 FREEZE | หยุดเพิ่มฟีเจอร์ มุ่งเน้นความน่าเชื่อถือและการนำเสนอ |
