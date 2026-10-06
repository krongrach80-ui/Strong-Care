import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  ShieldAlert,
  CheckCircle,
  Calendar,
  Clock,
  User,
  Activity,
  Award,
  ChevronDown
} from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { useSeniorStore } from '../../store/seniorStore';

interface ReportsPageProps {
  onNavigate?: (tab: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const { selectedPatient, patients } = usePatientStore();
  const { isSeniorMode } = useSeniorStore();
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);

  const mockSessions = [
    {
      id: 101,
      date: '2026-10-04 14:30',
      exerciseName: 'Shoulder Raise (กางแขนยกด้านข้าง)',
      duration: '4 นาที 15 วินาที',
      totalReps: 10,
      correctReps: 10,
      accuracy: 96.0,
      maxRom: 122.5,
      avgAngle: 118.0,
      status: 'Completed',
      therapistNote: 'ผู้ป่วยมีพัฒนาการช่วงการเคลื่อนไหวดีมาก ทรงตัวมั่นคง',
      repsTrail: [
        { rep: 1, peakAngle: 120.2, accuracy: 98, duration: 3.1, rom: 102.2, velocity: 45, compensation: 'None (ปกติ)' },
        { rep: 2, peakAngle: 121.5, accuracy: 96, duration: 3.0, rom: 103.5, velocity: 48, compensation: 'None (ปกติ)' },
        { rep: 3, peakAngle: 123.0, accuracy: 99, duration: 3.2, rom: 105.0, velocity: 46, compensation: 'None (ปกติ)' },
        { rep: 4, peakAngle: 122.0, accuracy: 97, duration: 3.1, rom: 104.0, velocity: 50, compensation: 'None (ปกติ)' },
        { rep: 5, peakAngle: 121.8, accuracy: 95, duration: 3.3, rom: 103.8, velocity: 47, compensation: 'None (ปกติ)' },
        { rep: 6, peakAngle: 122.4, accuracy: 96, duration: 3.2, rom: 104.4, velocity: 49, compensation: 'None (ปกติ)' },
        { rep: 7, peakAngle: 121.0, accuracy: 94, duration: 3.4, rom: 103.0, velocity: 52, compensation: 'Trunk lean 6° (เล็กน้อย)' },
        { rep: 8, peakAngle: 123.5, accuracy: 97, duration: 3.1, rom: 105.5, velocity: 48, compensation: 'None (ปกติ)' },
        { rep: 9, peakAngle: 122.0, accuracy: 95, duration: 3.3, rom: 104.0, velocity: 51, compensation: 'None (ปกติ)' },
        { rep: 10, peakAngle: 123.2, accuracy: 96, duration: 3.2, rom: 105.2, velocity: 47, compensation: 'None (ปกติ)' },
      ],
      safetyEvents: [
        { code: 'TRUNK_LEAN', severity: 'CAUTION', time: '14:32:45', message: 'ตรวจพบเอียงลำตัวเล็กน้อย 6° ในรอบที่ 7 เตือนด้วยเสียงเรียบร้อย' }
      ]
    },
    {
      id: 100,
      date: '2026-10-02 10:15',
      exerciseName: 'Shoulder Raise (กางแขนยกด้านข้าง)',
      duration: '4 นาที 30 วินาที',
      totalReps: 10,
      correctReps: 9,
      accuracy: 91.5,
      maxRom: 118.0,
      avgAngle: 112.5,
      status: 'Completed',
      therapistNote: 'เริ่มมีอาการล้าใน 2 ครั้งสุดท้าย',
      repsTrail: [
        { rep: 1, peakAngle: 116.0, accuracy: 92, duration: 3.2, rom: 96.0, velocity: 44, compensation: 'None' },
        { rep: 2, peakAngle: 118.0, accuracy: 94, duration: 3.1, rom: 98.0, velocity: 47, compensation: 'None' },
        { rep: 3, peakAngle: 117.5, accuracy: 93, duration: 3.3, rom: 97.5, velocity: 46, compensation: 'None' },
        { rep: 4, peakAngle: 115.0, accuracy: 90, duration: 3.4, rom: 95.0, velocity: 49, compensation: 'Shoulder hike 8°' },
      ],
      safetyEvents: [
        { code: 'SHOULDER_HIKE', severity: 'CAUTION', time: '10:17:20', message: 'ยกสะบักไหล่ขึ้นขณะยกแขน ปรับท่าทางผ่านคำแนะนำด้วยเสียง' }
      ]
    }
  ];

  const current = mockSessions[selectedSessionIndex] || mockSessions[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(current, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `StrongCare_Clinical_Report_${current.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-[18px] p-6 border border-emerald-100/90 shadow-sm print:hidden">
        <div>
          <h1 className={`${isSeniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-bold text-slate-800 flex items-center gap-2.5`}>
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>รายงานผลทางคลินิก (Clinical Session Audit)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            รายงานการฝึกกายภาพบำบัดรายรอบ บันทึกมุมข้อต่อ ความเร็ว และการตรวจจับความปลอดภัย
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSessionIndex}
            onChange={(e) => setSelectedSessionIndex(Number(e.target.value))}
            className="px-3 py-2 rounded-[12px] bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            {mockSessions.map((s, idx) => (
              <option key={s.id} value={idx}>
                เซสชัน #{s.id} ({s.date.split(' ')[0]}) - {s.exerciseName.split(' ')[0]}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน (Print)</span>
          </button>
        </div>
      </div>

      {/* Printable Clinical Audit Document */}
      <div className="bg-white rounded-[18px] p-8 border border-emerald-100 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-800 bg-clip-text text-transparent">
                Strong Care
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                CLINICAL AUDIT v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">AI-assisted Rehabilitation Monitoring Platform</p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
            <p><span className="font-semibold text-slate-700">รหัสเซสชัน:</span> SC-SES-{current.id}</p>
            <p><span className="font-semibold text-slate-700">วันที่ประเมิน:</span> {current.date}</p>
            <p><span className="font-semibold text-slate-700">โมเดล AI:</span> MediaPipe Pose + Biomechanics v1.0</p>
          </div>
        </div>

        {/* Patient & Program Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-[14px] bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">ผู้รับการฟื้นฟู (Patient)</span>
            <span className="font-bold text-slate-800 text-sm">{selectedPatient?.name || 'คุณสมชาย มีสุข'}</span>
            <span className="text-slate-500 block">HN: {selectedPatient?.patient_code || 'PT-2026-001'} (อายุ 68 ปี)</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">โปรแกรมการฝึก (Exercise)</span>
            <span className="font-bold text-emerald-800 text-sm">{current.exerciseName}</span>
            <span className="text-slate-500 block">ระยะเวลา: {current.duration}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">จำนวนครั้งสำเร็จ (Reps)</span>
            <span className="font-bold text-slate-800 text-sm">{current.correctReps} / {current.totalReps} ครั้ง</span>
            <span className="text-emerald-600 font-semibold block">ความแม่นยำ {current.accuracy}%</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">องศาข้อต่อสูงสุด (Peak ROM)</span>
            <span className="font-bold text-emerald-700 text-sm">{current.maxRom}°</span>
            <span className="text-slate-500 block">องศาเฉลี่ย: {current.avgAngle}°</span>
          </div>
        </div>

        {/* Rep-by-Rep Clinical Trail Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>เส้นทางการฝึกรายรอบ (Rep-by-Rep Biomechanical Trail)</span>
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-[14px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">รอบที่ (Rep)</th>
                  <th className="py-2.5 px-3">องศาสูงสุด (Peak)</th>
                  <th className="py-2.5 px-3">ความแม่นยำ</th>
                  <th className="py-2.5 px-3">ระยะเวลา</th>
                  <th className="py-2.5 px-3">ช่วงการเคลื่อนไหว (ROM)</th>
                  <th className="py-2.5 px-3">ความเร็วเฉลี่ย</th>
                  <th className="py-2.5 px-3">การชดเชยท่าทาง (Compensation)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {current.repsTrail.map((rep) => (
                  <tr key={rep.rep} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-bold text-slate-700">#{rep.rep}</td>
                    <td className="py-2 px-3 font-semibold text-emerald-800">{rep.peakAngle}°</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rep.accuracy}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{rep.duration}s</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{rep.rom}°</td>
                    <td className="py-2 px-3 text-slate-600">{rep.velocity}°/s</td>
                    <td className="py-2 px-3">
                      <span className={`text-[11px] ${rep.compensation.includes('Trunk') ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
                        {rep.compensation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical Safety Events & Warnings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>บันทึกความปลอดภัยทางการแพทย์ (Safety Watchdog Logs)</span>
          </h3>

          <div className="p-4 rounded-[14px] bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
            {current.safetyEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold text-[10px]">
                  {ev.severity}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">[{ev.time}]</span>
                <span className="text-slate-800 font-medium">{ev.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Sign-off & Caregiver Governance */}
        <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-700 block mb-1">ความเห็นของนักกายภาพบำบัด / ผู้ดูแล:</span>
            <p className="p-3 rounded-[12px] bg-slate-50 border border-slate-200 italic">
              "{current.therapistNote}"
            </p>
          </div>

          <div className="flex flex-col justify-end sm:items-end">
            <div className="text-center sm:text-right space-y-1">
              <div className="w-44 border-b border-slate-400 pb-1 mb-1 sm:ml-auto">
                <span className="font-serif italic text-sm text-slate-700">กภ. วริศรา นามสมมติ</span>
              </div>
              <p className="font-semibold text-slate-700">นักกายภาพบำบัดวิชาชีพ (ทภ. 4812)</p>
              <p className="text-[11px] text-slate-400">วันที่ลงนาม: {current.date.split(' ')[0]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
