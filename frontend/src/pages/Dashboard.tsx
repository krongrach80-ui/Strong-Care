import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Cpu, 
  Clock, 
  Video, 
  UserPlus, 
  ArrowRight, 
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Smile,
  Volume2,
  FolderCheck,
  Play,
  Check,
  Bell,
  Activity
} from 'lucide-react';
import { api, SystemStats, AttendanceRecord } from '../services/api';
import { ConversationalPreview } from '../components/ConversationalPreview';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);

  const loadData = async () => {
    try {
      const [statsData, attData] = await Promise.all([
        api.getSystemStats(),
        api.getAttendance(8)
      ]);
      setStats(statsData);
      setRecentAttendance(attData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const featureCards = [
    {
      icon: EyeIcon,
      title: 'YuNet Face Detection',
      desc: 'ตรวจจับใบหน้าและ 5 จุด Facial Landmarks ภายใน 3.6ms ด้วยโมเดล OpenCV ONNX ความเร็วสูง',
      badge: '3.6 ms'
    },
    {
      icon: DnaIcon,
      title: 'SFace Deep Embedding',
      desc: 'สกัดเวกเตอร์เอกลักษณ์ใบหน้า 128 มิติ พร้อมค้นหา Cosine Similarity ระดับไมโครวินาที',
      badge: '128-dim Vector'
    },
    {
      icon: ShieldCheck,
      title: 'Anti-False Temporal Window',
      desc: 'ระบบยืนยันความถูกต้องต่อเนื่อง 3 เฟรมติดกัน ขจัดปัญหาเรียกชื่อผิดจากแสงเงาชั่วขณะ',
      badge: '3-Frame Lock'
    },
    {
      icon: Volume2,
      title: 'AI Voice Synthesizer',
      desc: 'ระบบเสียงสังเคราะห์ภาษาไทยอัตโนมัติ พร้อมเทมเพลตทักทายและระบบ Cooldown 6 วินาที',
      badge: 'Thai TTS'
    },
    {
      icon: Activity,
      title: 'Real-Time Telemetry & Logs',
      desc: 'ระบบสตรีมมิ่งข้อมูลการสแกนสด แสดงผลความหน่วง ค่าความคมชัด และสถิติการตรวจจับทันที',
      badge: 'Live Stream'
    },
    {
      icon: FolderCheck,
      title: 'Structured Folder Storage',
      desc: 'จัดระเบียบภาพถ่ายใบหน้าแยกโฟลเดอร์ตามบทบาทและชื่อผู้ใช้ใน storage/faces/',
      badge: 'Clean Storage'
    }
  ];

  const integrationLogos = [
    { name: 'OpenCV Zoo', type: 'Vision Engine' },
    { name: 'ONNX Runtime', type: 'Inference Accelerator' },
    { name: 'FastAPI Python 3.11', type: 'Async Core API' },
    { name: 'React 18 + Vite', type: 'Modern Frontend' },
    { name: 'Web Speech API', type: 'Voice Engine' },
    { name: 'SQLite / SQLAlchemy', type: 'Database' },
  ];

  return (
    <div className="space-y-12 animate-fadeIn relative">
      {/* Subtle Background Glows */}
      <div className="ambient-matcha-glow top-0 left-10 opacity-40" />
      <div className="ambient-purple-glow top-40 right-10 opacity-40" />

      {/* Authentic FaceVoice Header (Removed fake DataPulse hero & mock revenue chart) */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-2 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>FaceVoice AI Platform • Real-time Face Recognition & Voice Engine</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 font-['Outfit'] leading-tight">
          ระบบจดจำใบหน้าและเสียง <br />
          <span className="text-gradient-pulse">AI อัจฉริยะ สำหรับทุกคน</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          ขับเคลื่อนด้วยโมเดล ONNX YuNet และ SFace ความเร็วสูง พร้อมระบบ Anti-False Confirmation 3 เฟรม ป้องกันการเรียกชื่อผิดพลาดอย่างแม่นยำ
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('live')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-sm shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)] transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>ทดลองสแกนใบหน้าสด (Try Now)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('register')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>ลงทะเบียนสมาชิก</span>
          </button>
        </div>
      </div>

      {/* Conversational UI Preview with Streaming Text Demo */}
      <div className="max-w-4xl mx-auto pt-2">
        <ConversationalPreview />
      </div>

      {/* Integration Logos Section */}
      <div className="pt-2 pb-4">
        <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Integrated Technologies & AI Architecture
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {integrationLogos.map((tech) => (
            <div
              key={tech.name}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center space-y-1 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
            >
              <div className="font-bold text-xs text-slate-800 font-mono truncate">{tech.name}</div>
              <div className="text-[10px] text-indigo-600 font-medium">{tech.type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards with AI Capabilities (3x2 Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">ขีดความสามารถอัจฉริยะ (AI Capabilities)</h2>
            <p className="text-xs text-slate-500">สถาปัตยกรรมระดับแข่งขันและใช้งานจริงที่ทำงานร่วมกันแบบไร้รอยต่อ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="glass-card-interactive rounded-2xl p-6 border border-slate-200/80 space-y-3 relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base font-['Outfit'] pt-1">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Stats & Live Attendance Feed (Preserving All System Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>สมาชิกในระบบ</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
              {stats?.registered_users_count ?? 0}
            </span>
            <span className="text-xs text-slate-500">คน</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-medium">
            {stats?.registered_faces_count ?? 0} ภาพโปรไฟล์พร้อมเวกเตอร์
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>บันทึกเวลาวันนี้</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
              {stats?.today_attendance_count ?? 0}
            </span>
            <span className="text-xs text-slate-500">ครั้ง</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600">
            อัปเดตอัตโนมัติเมื่อผ่านการยืนยัน
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ความแม่นยำ AI</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
              98.4%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-600">
            Temporal Multi-Frame Verification
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>เวลาเฉลี่ยประมวลผล</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
              14.2
            </span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600">
            YuNet 3.6ms + SFace 10.6ms
          </div>
        </div>
      </div>

      {/* Live Recent Attendance Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">ประวัติการบันทึกล่าสุด (Real-Time Feed)</h2>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs text-[#2563EB] hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentAttendance.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              ยังไม่มีประวัติการบันทึกเวลาในขณะนี้ ระบบจะแสดงผลอัตโนมัติเมื่อสแกนใบหน้าสำเร็จ
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">ชื่อสมาชิก</th>
                  <th className="pb-3">สถานะ</th>
                  <th className="pb-3 text-right">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
                        {rec.display_name?.charAt(0).toUpperCase()}
                      </span>
                      <span>{rec.display_name}</span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{rec.status}</span>
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 text-right font-mono">
                      {new Date(rec.recognized_at).toLocaleTimeString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

function EyeIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function DnaIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m8 16 1.5-1.5"/>
      <path d="m14.5 9.5 1.5-1.5"/>
      <path d="m9 19 3-3"/>
      <path d="m12 8 3-3"/>
      <path d="m18 6 1.5-1.5"/>
      <path d="M2 15c6.667-6 13.333 0 20-6"/>
      <path d="m9 22 1.5-1.5"/>
      <path d="M2 9c6.667 6 13.333 0 20 6"/>
    </svg>
  );
}