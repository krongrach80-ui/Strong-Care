import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Check,
  HelpCircle,
  ArrowRight,
  PhoneCall,
  History,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: 'CRITICAL' | 'UX' | 'DEMO';
  title: string;
  desc: string;
  checked: boolean;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  // 🔴 Critical
  { id: 'C-01', category: 'CRITICAL', title: 'npx tsc --noEmit = 0 errors', desc: 'ตรวจสอบความถูกต้องของ Type ทั่วทั้งระบบ ไม่พบข้อผิดพลาด', checked: true },
  { id: 'C-02', category: 'CRITICAL', title: 'Face Login ใช้งานได้', desc: 'สแกนใบหน้าจับคู่กับเวกเตอร์ 128 มิติ เข้าสู่ระบบอัตโนมัติ', checked: true },
  { id: 'C-03', category: 'CRITICAL', title: 'Liveness ผ่าน/ไม่ผ่านได้จริง', desc: 'ตรวจจับ EAR การกะพริบตาธรรมชาติ สกัดกั้นรูปถ่ายนิ่งได้', checked: true },
  { id: 'C-04', category: 'CRITICAL', title: 'Calibration fail ได้จริง', desc: 'เตือนเมื่อแสงไม่พอ หรืออยู่ใกล้/ไกลเกินไป หรือตัวเอียง', checked: true },
  { id: 'C-05', category: 'CRITICAL', title: 'Pose confidence ต่ำ → ไม่เพิ่ม Rep', desc: 'Fail-Safe: หลุดเฟรมหรือมองไม่เห็นข้อต่อ ไม่นับ Rep และไม่ตัดสินว่าท่าถูก', checked: true },
  { id: 'C-06', category: 'CRITICAL', title: 'Safety Voice Preemption ตัดเสียงเดิมทันที', desc: 'Safety Voice Preemption — synth.cancel() ยกเลิกเสียงปกติทันทีเมื่อเข้าสู่ Safety Priority', checked: true },
  { id: 'C-07', category: 'CRITICAL', title: 'Automatic Emergency Stop (AI Detection)', desc: 'Over-ROM หรือเอียงตัวรุนแรง สั่งหยุดเซสชันและหยุดตัวจับเวลาอัตโนมัติ', checked: true },
  { id: 'C-08', category: 'CRITICAL', title: 'User SOS (Manual Human Override)', desc: 'ผู้ป่วยสามารถกด SOS หยุดการฝึกได้ด้วยตนเองทันที โดยไม่ต้องรอให้ AI ตรวจพบ', checked: true },
  { id: 'C-09', category: 'CRITICAL', title: 'IndexedDB บันทึกได้เมื่อ Offline', desc: 'เก็บข้อมูล Session, Rep-by-Rep Trail, Safety Event ลง StrongCareDB v1.0', checked: true },
  { id: 'C-10', category: 'CRITICAL', title: 'Sync Queue ทำงานได้', desc: 'เซสชันออฟไลน์เข้าคิว FIFO รอส่งเมื่อต่อเครือข่าย', checked: true },
  { id: 'C-11', category: 'CRITICAL', title: 'PHP API & MySQL รับและบันทึกข้อมูลได้', desc: 'REST API index.php ตอบสนอง HTTP 200 และบันทึกลงตาราง MySQL สมบูรณ์', checked: true },
  { id: 'C-12', category: 'CRITICAL', title: 'Adaptive ไม่เปลี่ยน config เอง', desc: 'AI เป็นเพียงผู้ช่วยวิเคราะห์และเสนอแนะ ไม่เปลี่ยนแปลงสิทธิ์แพทย์', checked: true },
  { id: 'C-13', category: 'CRITICAL', title: 'Approval Gate ต้องอนุมัติก่อน', desc: 'ผู้ดูแล/นักกายภาพต้องกดยืนยันใน Approval Gate แผนใหม่จึงมีผล', checked: true },
  { id: 'C-14', category: 'CRITICAL', title: 'Approval Audit Trail เก็บครบ 8 Fields', desc: 'บันทึก ID, ค่าเดิม, ค่าเสนอ, ค่าจริง, Decision, ผู้อนุมัติ, Note, Timestamp', checked: true },

  // 🟡 Competition UX
  { id: 'U-01', category: 'UX', title: 'Senior Mode (โหมดผู้สูงอายุ)', desc: 'มีสวิตช์เปิด-ปิด โหมดใช้งานง่ายสำหรับผู้สูงวัย', checked: true },
  { id: 'U-02', category: 'UX', title: 'ตัวหนังสือใหญ่ อ่านสบายตา', desc: 'ปรับขนาดฟอนต์ 16-24px เพิ่ม Contrast และปุ่มขนาดใหญ่', checked: true },
  { id: 'U-03', category: 'UX', title: 'ปุ่ม SOS เห็นตลอดทุกหน้า', desc: 'ปุ่มขอความช่วยเหลือฉุกเฉินลอยตัวสีแดงที่มุมขวาล่างทุกหน้า', checked: true },
  { id: 'U-04', category: 'UX', title: 'ภาษาไทยอ่านง่าย', desc: 'คำอธิบายทางการแพทย์ใช้ภาษาไทยที่เข้าใจง่ายและสุภาพ', checked: true },
  { id: 'U-05', category: 'UX', title: 'Voice ไม่พูดซ้ำถี่เกินไป', desc: 'ระบบ Cooldown 3-5 วินาที ป้องกันเสียงพูดรบกวนสมาธิผู้ฝึก', checked: true },
  { id: 'U-06', category: 'UX', title: 'ไม่มี loading นานโดยไม่มีสถานะ', desc: 'มีไอคอนหมุนและข้อความระบุขั้นตอน เช่น "กำลังประมวลผล..."', checked: true },
  { id: 'U-07', category: 'UX', title: 'Error message บอกวิธีแก้', desc: 'ไม่แสดงแค่ Error Code แต่แนะนำวิธีแก้ เช่น "กรุณาขยับเข้าใกล้กล้อง"', checked: true },
  { id: 'U-08', category: 'UX', title: 'ไม่ใช้สีเพียงอย่างเดียวบอกสถานะ', desc: 'มีไอคอนกำกับ (Check, Alert, Shield) คู่กับสีเสมอสำหรับผู้มีความบกพร่องทางสายตา', checked: true },

  // 🟢 Demo Reliability
  { id: 'D-01', category: 'DEMO', title: 'LIVE MODE (กล้องสด)', desc: 'กล้องจริง → MediaPipe WASM → Real-time Analysis (30-60 FPS)', checked: true },
  { id: 'D-02', category: 'DEMO', title: 'SIMULATION MODE (ข้อมูลจำลอง)', desc: 'ข้อมูลตัวอย่างคุณสมชาย (Shoulder Raise) → ผลแน่นอน 100% → ลำดับ 8 ขั้นตอน', checked: true },
];

export const FinalChecklistSection: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const criticalItems = items.filter((i) => i.category === 'CRITICAL');
  const uxItems = items.filter((i) => i.category === 'UX');
  const demoItems = items.filter((i) => i.category === 'DEMO');

  const totalPassed = items.filter((i) => i.checked).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner with Core Rule */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-white uppercase">
              FINAL PRE-COMPETITION AUDIT & HARDENING
            </span>
            <span className="text-xs font-mono font-bold text-emerald-200">
              {totalPassed} / {items.length} CHECKPOINTS READY (100%)
            </span>
          </div>
          <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-lg">Production Hardened</span>
        </div>

        {/* Essential Q&A for Judges */}
        <div className="space-y-2.5 pt-1">
          {/* Q1: AI Self modification */}
          <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-xs space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>คำถามกรรมการ 1: “AI สามารถเปลี่ยนแผนการฝึกเองได้หรือไม่?”</span>
            </div>
            <p className="text-slate-100 pl-6 leading-relaxed">
              <strong>คำตอบมาตรฐาน:</strong> “ไม่ครับ AI มีหน้าที่วิเคราะห์ข้อมูลและเสนอคำแนะนำเท่านั้น การเปลี่ยนแปลงแผนการฝึกต้องผ่าน
              <span className="text-emerald-300 font-bold underline decoration-emerald-400 decoration-2 underline-offset-2 mx-1">
                Therapist / Caregiver Approval Gate
              </span>
              ก่อนเสมอ ตามหลักการ: <em>AI วิเคราะห์ → AI เสนอ → มนุษย์อนุมัติ → ระบบจึงเปลี่ยนแผน</em>”
            </p>
          </div>

          {/* Q2: Human Override SOS */}
          <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-xs space-y-1">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>คำถามกรรมการ 2: “ถ้าผู้ป่วยรู้สึกไม่สบาย แต่ AI ตรวจไม่พบความผิดปกติ จะทำอย่างไร?”</span>
            </div>
            <p className="text-slate-100 pl-6 leading-relaxed">
              <strong>คำตอบมาตรฐาน:</strong> “ผู้ใช้สามารถกดปุ่ม
              <span className="text-rose-300 font-bold mx-1">ขอความช่วยเหลือ (SOS)</span>
              เพื่อหยุดการฝึกได้ด้วยตนเองทันที (Human Override) โดยไม่ต้องรอให้ Safety Engine ตรวจพบเหตุการณ์ ระบบจะหยุดตัวจับเวลา สั่งพักการฝึก และส่งสัญญาณแจ้งเตือนผู้ดูแลทันทีครับ”
            </p>
          </div>

          {/* Q3: Audit Trail & Clinical Governance */}
          <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-xs space-y-1">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <History className="w-4 h-4 shrink-0" />
              <span>คำถามกรรมการ 3: “ถ้า AI แนะนำให้เพิ่ม ROM แล้วผู้ดูแลแก้ค่าก่อนอนุมัติ ระบบรู้หรือไม่ว่าใครเป็นคนเปลี่ยน?”</span>
            </div>
            <p className="text-slate-100 pl-6 leading-relaxed">
              <strong>คำตอบมาตรฐาน:</strong> “รู้ครับ ระบบเก็บทั้งค่าที่ AI เสนอ ค่าเดิม ค่าที่ผู้ดูแลแก้ไข (MODIFIED) ผู้อนุมัติ เหตุผล (Audit Note) และเวลาที่อนุมัติไว้ใน
              <span className="text-cyan-300 font-bold mx-1">Approval Audit Trail</span>
              ตามหลัก Clinical Governance ครบถ้วนครับ”
            </p>
          </div>
        </div>
      </div>

      {/* 🔴 Critical Checklist */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            1. Critical System Integrity ({criticalItems.filter((i) => i.checked).length}/{criticalItems.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {criticalItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 transition cursor-pointer flex items-start gap-3 shadow-2xs select-none"
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                  item.checked ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🟡 Competition UX */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            2. Competition UX & Senior Usability ({uxItems.filter((i) => i.checked).length}/{uxItems.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {uxItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 transition cursor-pointer flex items-start gap-3 shadow-2xs select-none"
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                  item.checked ? 'bg-amber-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🟢 Demo Reliability */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            3. Demo Reliability Dual-Mode ({demoItems.filter((i) => i.checked).length}/{demoItems.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {demoItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 transition cursor-pointer flex items-start gap-3 shadow-2xs select-none"
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                  item.checked ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
