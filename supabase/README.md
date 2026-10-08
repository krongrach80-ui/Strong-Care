# Strong Care - Supabase Database Setup Guide

คู่มือการติดตั้งและใช้งานฐานข้อมูลจริง **Supabase** สำหรับระบบ **STRONG CARE** (AI-assisted Rehabilitation Monitoring Platform)

---

## 📋 ขั้นตอนการติดตั้งบน Supabase (Cloud หรือ Local)

### ขั้นตอนที่ 1: สร้าง Project ใน Supabase
1. ไปที่ [https://supabase.com](https://supabase.com) แล้วลงชื่อเข้าใช้
2. กดปุ่ม **"New project"**
3. ตั้งชื่อโปรเจกต์ เช่น `StrongCare-Hospital` และกำหนดฐานรหัสผ่านฐานข้อมูล (Database Password)
4. เลือก Region ใกล้ประเทศไทย เช่น `Singapore (ap-southeast-1)`

---

### ขั้นตอนที่ 2: รัน Schema & RLS Policies
1. ในหน้าแดชบอร์ด Supabase ไปที่เมนู **SQL Editor** (ไอคอน `>_` ด้านซ้าย)
2. กด **"New query"**
3. คัดลอกเนื้อหาทั้งหมดจากไฟล์ [supabase/schema.sql](schema.sql) มาวางแล้วกด **Run**
4. ระบบจะสร้าง:
   - ตาราง `profiles`, `therapists`, `patients`, `exercises`, `treatment_sessions`, `minigame_results`, `activity_logs`, `banned_devices`, `banned_ips`, `system_settings`, `face_embeddings`
   - ฟังก์ชันตรวจสอบบทบาทและสิทธิ์ `is_admin()`, `is_therapist()`, `current_user_role()`
   - นโยบายความปลอดภัย **Row Level Security (RLS)** ครบทุกตาราง
   - Triggers อัปเดต `updated_at` อัตโนมัติ

---

### ขั้นตอนที่ 3: ลงข้อมูลเริ่มต้น (Seed Data)
1. ในหน้า **SQL Editor** เปิดแท็บ query ใหม่
2. คัดลอกเนื้อหาทั้งหมดจากไฟล์ [supabase/seed.sql](seed.sql) มาวางแล้วกด **Run**
3. ระบบจะสร้าง:
   - บัญชีบุคลากรเริ่มต้นใน `auth.users` และ `profiles`:
     - **Admin**: `admin` (อีเมล `director@strongcare.hospital` / รหัสผ่าน `1234`)
     - **Therapist 1**: `pt_thanakorn` (อีเมล `thanakorn.w@strongcare.hospital` / รหัสผ่าน `1234`)
     - **Therapist 2**: `pt_pimchanok` (อีเมล `pimchanok.s@strongcare.hospital` / รหัสผ่าน `1234`)
   - ข้อมูลเวชระเบียนนักกายภาพ 2 ท่านใน `therapists`
   - คนไข้เริ่มต้น 3 ท่านใน `patients` (`P-0012` นายสมชาย ใจดี, `P-0013` นางมาลี รักสุข, `P-0021` นายวิชัย แก้วมณี) พร้อม PIN `1234` แบบแฮช SHA-256
   - คลังท่ากายภาพบำบัดชีวกลศาสตร์ 16 ท่าใน `exercises`
   - ค่าเริ่มต้นระบบ AI ใน `system_settings`

---

### ขั้นตอนที่ 4: คัดลอก API Credentials มาใส่ใน Frontend
1. ในแดชบอร์ด Supabase ไปที่ **Project Settings** ➔ **API**
2. คัดลอกค่า:
   - **Project URL** (`https://xxxxxxxxxxxx.supabase.co`)
   - **Project API keys** ➔ ค่า **`anon` `public`** (ห้ามนำ `service_role` มาใส่ฝั่ง Frontend เด็ดขาด)
3. เปิดไฟล์ `.env` ในโฟลเดอร์ `frontend/`:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
4. รีสตาร์ตหรือรัน dev server:
```bash
npm run dev
```

---

## 🔐 รายละเอียดสิทธิ์ความปลอดภัย (Row Level Security - RLS)

| ตาราง | สิทธิ์ Admin (ผอรพ.) | สิทธิ์ Physiotherapist (นักกายภาพ) | สิทธิ์ Patient (คนไข้) |
|---|---|---|---|
| `profiles` | จัดการได้ทุกคน (Full CRUD) | อ่านได้ทุกคน, แก้ไขได้เฉพาะตนเอง | อ่านเฉพาะตนเอง |
| `therapists` | จัดการได้ทุกคน (Full CRUD) | อ่านได้ทุกคน, แก้ไขได้เฉพาะตนเอง | อ่านอย่างเดียว |
| `patients` | จัดการคนไข้ทุกคน (Full CRUD) | อ่านได้ทุกคน, เพิ่มได้, แก้ได้เฉพาะเคสที่ดูแล | อ่านเฉพาะตนเอง |
| `exercises` | เพิ่ม/แก้ไข/ลบได้ | เพิ่ม/แก้ไข/ลบได้ | อ่านอย่างเดียว |
| `treatment_sessions` | ดูได้ทุกคน | ดูได้ทุกคน, บันทึกผลได้ | บันทึกเฉพาะของตนเอง |
| `minigame_results` | ดูได้ทุกคน | ดูได้ทุกคน, บันทึกผลได้ | บันทึกเฉพาะของตนเอง |
| `activity_logs` | ดูประวัติ ตรวจสอบ และจัดการได้ | ห้ามเข้าถึง (Forbidden) | ห้ามเข้าถึง (Forbidden) |
| `system_settings` | ปรับแต่ง AI และระบบได้ | อ่านอย่างเดียว / ห้ามแก้ | อ่านอย่างเดียว |
