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
  Activity,
  Smartphone,
  HeartPulse,
  QrCode,
  Stethoscope,
  Gift,
  FileText,
  Search,
  ExternalLink,
  ChevronRight
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

  const ramaAnnouncements = [
    {
      id: 1,
      tag: 'การเงินและค่ารักษา',
      title: 'ประกาศ คณะฯ แจ้งการปรับอัตราค่าผสมยาเคมีบำบัด เพื่อให้สอดคล้องกับต้นทุน',
      date: 'มีผลบังคับใช้ 1 ตุลาคม พ.ศ. 2569 เป็นต้นไป',
      desc: 'เพื่อให้สอดคล้องกับต้นทุนค่าผสมยาเคมีบำบัดในปัจจุบัน โดยผู้ป่วยสามารถตรวจสอบสิทธิการรักษาได้ทาง Rama App'
    },
    {
      id: 2,
      tag: 'ตารางบริการ',
      title: 'ประกาศ โรงพยาบาลรามาธิบดี เรื่อง แจ้งการให้บริการในวันหยุดราชการเป็นกรณีพิเศษ',
      date: 'ประกาศ ณ วันที่ 27 กันยายน พ.ศ. 2569',
      desc: 'แจ้งการให้บริการคลินิกเฉพาะทางและห้องตรวจกายภาพบำบัดในวันหยุดราชการเป็นกรณีพิเศษ'
    },
    {
      id: 3,
      tag: 'สถานการณ์ฉุกเฉิน',
      title: 'ประกาศ โรงพยาบาลรามาธิบดี เรื่อง แจ้งการเปิดและปิดการให้บริการเนื่องจากสถานการณ์อุทกภัย',
      date: 'ประกาศฉบับเร่งด่วน',
      desc: 'เนื่องจากสถานการณ์อุทกภัย น้ำท่วมขัง ส่งผลกระทบต่อการเข้ารับบริการและการเดินทางสัญจร เพื่อความปลอดภัยสูงสุดของผู้ป่วย'
    },
    {
      id: 4,
      tag: 'กิจกรรมวิชาการ',
      title: 'ขอเชิญร่วมกิจกรรมวันหลอดเลือดอุดตันโลก 2026 "ฮอร์โมนกับความเสี่ยงที่มองไม่เห็น"',
      date: 'วันศุกร์ที่ 9 ตุลาคม 2569 • 09.00 - 11.00 น.',
      desc: 'ณ บริเวณโถง ชั้น 1 อาคารสมเด็จพระเทพรัตน์ คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล'
    }
  ];

  return (
    <div className="space-y-10 animate-fadeIn relative">
      {/* Ramathibodi Clinical Header */}
      <div className="text-center space-y-3 max-w-4xl mx-auto pt-1 pb-1">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F7F7] border border-[#B2EBE6] text-[#008783] text-xs font-bold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-pulse"></span>
          <span>🏥 คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี • Faculty of Medicine Ramathibodi Hospital, Mahidol University</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F3D3E] font-['Outfit'] leading-tight">
          ศูนย์เวชศาสตร์ฟื้นฟู & กายภาพบำบัดอัจฉริยะ <br />
          <span className="text-[#00A39E]">โรงพยาบาลรามาธิบดี มหิดล</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          นวัตกรรมการแพทย์ One-Stop AI: ตรวจคัดกรองใบหน้า สัญญาณชีพ ออกใบสั่งกายภาพบำบัดอัจฉริยะ พร้อมตู้เครื่องกายภาพ Kiosk และพอร์ทัลมือถือ
        </p>
      </div>

      {/* 4 Official Ramathibodi Service Tiles (Replicating Image 1 Top Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {/* Tile 1: การบริจาค */}
        <div 
          onClick={() => window.open('https://www.ramafoundation.or.th', '_blank')}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-[#00A39E] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 group-hover:scale-105 transition-transform">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 group-hover:text-[#008783] transition-colors text-base font-['Outfit']">
                การบริจาค
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">มูลนิธิรามาธิบดีเพื่อผู้ป่วยยากไร้</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#008783] font-bold">
            <span>ร่วมสมทบทุน</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tile 2: เวชระเบียนออนไลน์ */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-[#00A39E] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] text-[#008783] flex items-center justify-center shrink-0 border border-[#B2EBE6] group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 group-hover:text-[#008783] transition-colors text-base font-['Outfit']">
                เวชระเบียนออนไลน์
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">บันทึก SOAP และใบสั่งกายภาพ AI</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#008783] font-bold">
            <span>เข้าดูเวชระเบียน</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tile 3: ค้นหารายชื่อแพทย์และตารางตรวจ */}
        <div 
          onClick={() => onNavigate('people')}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-[#00A39E] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008783] flex items-center justify-center shrink-0 border border-teal-200 group-hover:scale-105 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 group-hover:text-[#008783] transition-colors text-base font-['Outfit']">
                แพทย์และตารางตรวจ
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">5 คลินิกกายภาพเฉพาะทาง</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#008783] font-bold">
            <span>ค้นหาตารางตรวจ</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tile 4: Rama App / StrongCare */}
        <div 
          onClick={() => onNavigate('mobile-pt')}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-[#00A39E] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] text-[#008783] flex items-center justify-center shrink-0 border border-[#B2EBE6] group-hover:scale-105 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 group-hover:text-[#008783] transition-colors text-base font-['Outfit']">
                Rama App / Mobile PT
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">นัดหมาย จ่ายเงิน กายภาพ AI จบใน App</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#008783] font-bold">
            <span>เปิดบนมือถือ</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Moti Physio 3D Posture & Movement AI Showcase Banner */}
      <div 
        onClick={() => onNavigate('moti-physio')}
        className="max-w-6xl mx-auto rounded-3xl p-6 bg-gradient-to-r from-[#0F3D3E] via-[#008783] to-[#00A39E] text-white shadow-lg shadow-teal-950/20 cursor-pointer hover:shadow-xl transition-all group flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-teal-300 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 group-hover:scale-105 transition-transform">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-[#008783] font-mono">
                MOTI PHYSIO 3D AI
              </span>
              <span className="text-xs text-teal-200 font-bold">
                กล้อง RGB-D & Human Pose Estimation
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black mt-1 font-['Outfit']">
              ระบบสแกนวิเคราะห์โครงสร้างท่าทางและสมดุล 3 มิติ (Moti Physio)
            </h3>
            <p className="text-xs text-teal-100 mt-1 max-w-2xl">
              ตรวจคอยื่น (Forward Head), ไหล่ตก, แนวกระดูกสันหลังคด และข้อเข่าผิดรูป ด้วยแบบจำลองโครงกระดูก 3D เสมือนจริง พร้อมเปรียบเทียบฐานข้อมูล 350,000 ราย
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-2xl bg-white text-[#008783] font-black text-xs group-hover:bg-[#E6F7F7] transition-colors shadow-sm relative z-10">
          <span>เริ่มสแกนสรีระ 3D</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>


      {/* Signature Ramathibodi "ข่าวสารประชาสัมพันธ์" Banner (Replicating Image 1) */}
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="w-full bg-[#E6F7F7] border border-[#B2EBE6] rounded-2xl py-3.5 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A39E]" />
            <h2 className="text-xl sm:text-2xl font-black text-[#008783] tracking-wide font-['Outfit',sans-serif]">
              ข่าวสารประชาสัมพันธ์
            </h2>
          </div>
          <button 
            onClick={() => window.open('https://www.rama.mahidol.ac.th/rama_hospital/th/services/news', '_blank')}
            className="text-xs sm:text-sm font-bold text-[#008783] hover:text-[#0F3D3E] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Official Ramathibodi News Cards (Replicating Image 1 Announcements) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ramaAnnouncements.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-[#00A39E] shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]">
                    {item.tag}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#008783] transition-colors leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-3">
                  {item.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#008783] font-semibold">
                <span className="truncate">{item.date}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Core System Services Hub (Hospital PT System / Mobile One-Stop / AI Kiosk) */}
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[#0F3D3E] font-['Outfit'] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00A39E]" />
            <span>ศูนย์บริการสุขภาพและกายภาพบำบัด Smart Care Hub</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {/* Moti Physio 3D Posture & Movement Analysis Card */}
          <div
            onClick={() => onNavigate('moti-physio')}
            className="p-6 rounded-3xl bg-white border-2 border-slate-200/90 hover:border-[#00A39E] hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] text-[#008783] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform border border-[#B2EBE6]">
                  <Activity className="w-6 h-6 text-[#00A39E]" />
                </div>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]">
                  🧍 Moti Physio 3D
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-[#008783] transition-colors font-['Outfit']">
                วิเคราะห์สรีระ 3D Digital Twin
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                สแกนแนวดิ่ง Plumb Line 3 มิติ, แผนผังกล้ามเนื้อตึง/อ่อนแรง (แดง/ฟ้า), 11 จุดสรีระ และโปรแกรมฟื้นฟูเฉพาะบุคคล
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[#008783] font-extrabold text-xs">
              <span>เปิดระบบสแกนสรีระ 3D</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Mobile One-Stop Card */}
          <div
            onClick={() => onNavigate('mobile-pt')}
            className="p-6 rounded-3xl bg-white border-2 border-slate-200/90 hover:border-[#00A39E] hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008783] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform border border-teal-200">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]">
                  📱 One-Stop บนมือถือ
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-[#008783] transition-colors font-['Outfit']">
                พอร์ทัลกายภาพผู้ป่วย
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                บัตรประจำตัวดิจิทัล QR Pass, กล้อง AI ฝึกกายภาพที่บ้านนับครั้งและวัดองศาข้อต่อ (ROM) อัตโนมัติ, จองคิวตรวจ, และบันทึกประวัติ
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[#008783] font-extrabold text-xs">
              <span>เปิดใช้งานบนโทรศัพท์มือถือ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Machine Kiosk One-Stop Card */}
          <div
            onClick={() => onNavigate('pt-kiosk')}
            className="p-6 rounded-3xl bg-white border-2 border-slate-200/90 hover:border-[#00A39E] hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] text-[#008783] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform border border-[#B2EBE6]">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]">
                  🏥 ตู้เครื่องกายภาพ
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-[#008783] transition-colors font-['Outfit']">
                ตู้เครื่องกายภาพบำบัด AI Kiosk
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                เช็คอินไร้สัมผัส (สแกนหน้า/QR มือถือ), หน้าจอ HUD 33 จุดสรีระวัด ROM แบบเรียลไทม์ และซิงค์ผลเข้ามือถืออัตโนมัติ
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[#008783] font-extrabold text-xs">
              <span>เปิดโหมดตู้เครื่องกายภาพ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('moti-physio')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all cursor-pointer active:scale-98"
          >
            <Activity className="w-4 h-4" />
            <span>เข้าสู่ Moti Physio สแกน 3D</span>
          </button>

          <button
            onClick={() => onNavigate('mobile-pt')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F3D3E] font-bold text-xs border border-slate-200 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Smartphone className="w-4 h-4 text-[#00A39E]" />
            <span>เข้าสู่ One-Stop บนมือถือ</span>
          </button>

          <button
            onClick={() => onNavigate('pt-kiosk')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E6F7F7] hover:bg-teal-100 text-[#008783] font-bold text-xs border border-[#B2EBE6] shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <HeartPulse className="w-4 h-4 text-[#008783]" />
            <span>เข้าสู่ตู้เครื่องกายภาพ AI</span>
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
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-[#002244] flex items-center justify-center border border-slate-200 group-hover:bg-[#002244] group-hover:text-amber-300 transition-all duration-300 shadow-sm">
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
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>สมาชิกในระบบ</span>
            <Users className="w-4 h-4 text-[#002244]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#002244] font-['Outfit']">
              {stats?.registered_users_count ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-medium">
            {stats?.registered_faces_count ?? 0} ภาพโปรไฟล์พร้อมเวกเตอร์
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>บันทึกเวลาวันนี้</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
              {stats?.today_attendance_count ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">ครั้ง</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">
            อัปเดตอัตโนมัติเมื่อผ่านการยืนยัน
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ความแม่นยำ AI</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-['Outfit']">
              98.4%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            Temporal Multi-Frame Verification
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>เวลาเฉลี่ยประมวลผล</span>
            <Cpu className="w-4 h-4 text-[#003366]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#002244] font-['Outfit']">
              14.2
            </span>
            <span className="text-xs text-slate-500 font-medium">ms</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-800 font-medium">
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