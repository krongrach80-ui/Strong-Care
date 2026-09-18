import React, { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  Calendar,
  RefreshCw,
  User
} from 'lucide-react';
import { api, AttendanceRecord } from '../services/api';

export const AttendanceLog: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAttendance(100);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    if (records.length === 0) return;
    const headers = ['ID,Display Name,Type,Confidence,Status,Timestamp\n'];
    const rows = records.map(r => 
      `${r.id},"${r.display_name}",${r.type},${(r.confidence * 100).toFixed(1)}%,${r.status},${r.recognized_at}`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(r => 
    r.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#2563EB]" />
            <h1 className="text-2xl font-bold text-slate-900 font-['Outfit']">ประวัติการบันทึกเวลา (Attendance Log)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกการเข้าเรียน/เข้างานอัตโนมัติเมื่อใบหน้าผ่านการยืนยัน Anti-False Recognition ({records.length} รายการ)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <button
            onClick={loadData}
            title="รีเฟรชข้อมูล"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">กำลังโหลดประวัติ...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">ไม่พบข้อมูลการบันทึกเวลา</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-4 font-semibold">ลำดับ</th>
                  <th className="p-4 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="p-4 font-semibold">ประเภทบันทึก</th>
                  <th className="p-4 font-semibold">ระดับความมั่นใจ (Confidence)</th>
                  <th className="p-4 font-semibold">สถานะ</th>
                  <th className="p-4 font-semibold">วันที่</th>
                  <th className="p-4 font-semibold text-right">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item, idx) => {
                  const dt = new Date(item.recognized_at);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-400 font-mono">#{idx + 1}</td>
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
                          {item.display_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span>{item.display_name}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] font-semibold text-[10px] border border-blue-100">
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-emerald-600">
                          {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {dt.toLocaleDateString('th-TH')}
                      </td>
                      <td className="p-4 text-slate-800 text-right font-mono font-semibold">
                        {dt.toLocaleTimeString('th-TH')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
