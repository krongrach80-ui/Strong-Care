-- PhysioVision Database Seed Data
-- Initial patients and physical therapy exercises

INSERT INTO patients (patient_code, name, age, gender, notes) VALUES
('PT-2026-001', 'สมชาย วิจิตรศิลป์ (Somchai V.)', 58, 'male', 'ฟื้นฟูกล้ามเนื้อไหล่และข้อศอกหลังผ่าตัด เอ็นหัวไหล่อักเสบ (Rotator Cuff)'),
('PT-2026-002', 'วิภาดา รัตนกุล (Wiphada R.)', 42, 'female', 'กายภาพบำบัดฟื้นฟูข้อเข่าเสื่อมระยะแรก ต้องการเพิ่มความแข็งแรงของ Quad'),
('PT-2026-003', 'ประสิทธิ์ รุ่งโรจน์ (Prasit R.)', 65, 'male', 'ผู้ป่วยหลังสโตรก (Stroke Rehab) ฟื้นฟูการควบคุมแขนและข้อศอกข้างขวา'),
('PT-2026-004', 'กัลยาณี เจริญพร (Kalyanee C.)', 31, 'female', 'ออฟฟิศซินโดรม ไหล่ห่อ ปวดคอบ่า ฟื้นฟู Range of Motion หัวไหล่');

INSERT INTO exercises (name, slug, category, description, target_joint, target_angle, min_angle, max_angle, target_reps, difficulty, instructions) VALUES
('Shoulder Lateral Raise (กางแขนยกหัวไหล่)', 'shoulder_raise', 'Upper Body', 'ฝึกยกแขนออกด้านข้างลำตัวเพื่อฟื้นฟูกล้ามเนื้อ Deltoid และ Supraspinatus รักษามุมหัวไหล่ให้อยู่ในระนาบที่ถูกต้อง', 'shoulder', 90.00, 75.00, 110.00, 12, 'beginner', 'ยืนตัวตรง กางแขนออกด้านข้างช้าๆ จนถึงระดับหัวไหล่ (ประมาณ 90°) ค้างไว้ 1 วินาที แล้วลดลงอย่างช้าๆ'),
('Bicep Curl (งอข้อศอกฟื้นฟูกล้ามเนื้อ)', 'bicep_curl', 'Upper Body', 'บริหารข้อศอกและการเคลื่อนไหวแขนท่อนล่าง เหมาะสำหรับฟื้นฟูกล้ามเนื้อ Biceps และข้อต่อข้อศอก', 'elbow', 50.00, 35.00, 65.00, 10, 'beginner', 'ยืนหรือนั่งตัวตรง ข้อศอกแนบลำตัว ค่อยๆ งอแขนยกข้อมือขึ้นหาหัวไหล่จนสุดช่วง แล้วค่อยๆ คลายกลับที่เดิม'),
('Knee Squat / Chair Stand (สควอทฟื้นฟูข้อเข่า)', 'knee_squat', 'Lower Body', 'ฝึกความแข็งแรงกล้ามเนื้อต้นขาและสะโพก พร้อมประเมินมุมการงอข้อเข่าอย่างปลอดภัย', 'knee', 95.00, 80.00, 110.00, 10, 'intermediate', 'ยืนแยกเท้ากว้างเท่าหัวไหล่ ย่อสะโพกลงเหมือนนั่งเก้าอี้ อย่าให้หัวเข่าเลยปลายเท้า รักษาสันหลังให้ตรง แล้วดันตัวขึ้น'),
('Elbow Extension (ยืดข้อศอกเหนือศีรษะ)', 'elbow_extension', 'Upper Body', 'บริหารกล้ามเนื้อ Triceps และการเหยียดตรงของข้อศอกเพื่อลดอาการยึดติดของข้อ', 'elbow', 165.00, 150.00, 180.00, 10, 'intermediate', 'ยกแขนขึ้นเหนือศีรษะ จากนั้นค่อยๆ เหยียดข้อศอกให้ตรงจนสุดช่วง แล้วงอกลับช้าๆ');

INSERT INTO sessions (patient_id, exercise_id, started_at, ended_at, total_reps, correct_reps, accuracy, avg_duration_per_rep, max_angle, avg_angle, status, notes) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 4 MINUTE, 12, 11, 91.67, 3.2, 94.5, 88.2, 'completed', 'ผู้ป่วยทำท่าได้ดี มีอาการล้าเล็กน้อยในช่วง 2 ครั้งสุดท้าย'),
(1, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 4 MINUTE, 12, 12, 95.50, 3.1, 92.0, 89.8, 'completed', 'การควบคุมความเร็วสม่ำเสมอ ฟอร์มสวยงาม ไม่ยกไหล่เกร็ง'),
(2, 3, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 5 MINUTE, 10, 8, 80.00, 4.0, 102.0, 93.4, 'completed', 'มีอาการสั่นของข้อเข่าเล็กน้อยในครั้งที่ 7-8 แนะนำให้พักสั้นๆ ระหว่างเซ็ต');

INSERT INTO session_results (session_id, rep_number, angle, accuracy, duration, is_correct, feedback) VALUES
(2, 1, 89.5, 96.0, 3.0, 1, 'ยอดเยี่ยม มุมถูกต้องและจังหวะดี'),
(2, 2, 91.2, 98.0, 3.1, 1, 'ยอดเยี่ยม มุมถูกต้องและจังหวะดี'),
(2, 3, 90.0, 99.0, 2.9, 1, 'ยอดเยี่ยม ฟอร์มสมบูรณ์แบบ'),
(2, 4, 88.4, 94.0, 3.2, 1, 'ดี รักษาระดับแขนได้ดี'),
(2, 5, 92.1, 95.0, 3.0, 1, 'ยอดเยี่ยม'),
(2, 6, 89.8, 97.0, 3.1, 1, 'ยอดเยี่ยม'),
(2, 7, 87.5, 92.0, 3.2, 1, 'ดี รักษาสันหลังตรง'),
(2, 8, 93.4, 93.0, 3.0, 1, 'ดี'),
(2, 9, 86.2, 90.0, 3.3, 1, 'ยกแขนต่ำลงเล็กน้อยเนื่องจากล้า'),
(2, 10, 91.0, 95.0, 3.1, 1, 'ยอดเยี่ยม'),
(2, 11, 90.5, 96.0, 3.2, 1, 'ยอดเยี่ยม'),
(2, 12, 89.0, 94.0, 3.4, 1, 'จบเซ็ตได้สมบูรณ์');
