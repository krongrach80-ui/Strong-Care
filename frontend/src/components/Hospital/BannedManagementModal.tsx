import React, { useState } from 'react';
import { X, Shield, Laptop, Globe, Trash2, Plus, Ban, CheckCircle2 } from 'lucide-react';

export interface BannedManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannedDevices: string[];
  bannedIps: string[];
  onUnbanDevice: (device: string) => void;
  onBanDevice: (device: string) => void;
  onUnbanIp: (ip: string) => void;
  onBanIp: (ip: string) => void;
  onSuccessToast: (msg: string) => void;
}

export const BannedManagementModal: React.FC<BannedManagementModalProps> = ({
  isOpen,
  onClose,
  bannedDevices,
  bannedIps,
  onUnbanDevice,
  onBanDevice,
  onUnbanIp,
  onBanIp,
  onSuccessToast,
}) => {
  const [activeTab, setActiveTab] = useState<'devices' | 'ips'>('devices');
  const [newDeviceInput, setNewDeviceInput] = useState<string>('');
  const [newIpInput, setNewIpInput] = useState<string>('');

  if (!isOpen) return null;

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const d = newDeviceInput.trim();
    if (!d) return;
    if (bannedDevices.includes(d)) {
      onSuccessToast('อุปกรณ์นี้อยู่ในรายการแบนอยู่แล้ว');
      return;
    }
    onBanDevice(d);
    setNewDeviceInput('');
    onSuccessToast(`แบนอุปกรณ์: ${d} เรียบร้อยแล้ว`);
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    const ip = newIpInput.trim();
    if (!ip) return;
    if (bannedIps.includes(ip)) {
      onSuccessToast('ที่อยู่ IP นี้อยู่ในรายการแบนอยู่แล้ว');
      return;
    }
    onBanIp(ip);
    setNewIpInput('');
    onSuccessToast(`แบนที่อยู่ IP: ${ip} เรียบร้อยแล้ว`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F2F2B]/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-[28px] sm:rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[90vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#0F2F2B] flex items-center gap-2">
                <span>จัดการรายการแบน</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
                  {bannedDevices.length + bannedIps.length} รายการ
                </span>
              </h3>
              <p className="text-[11px] text-rose-800 font-medium">
                รายการอุปกรณ์คอมพิวเตอร์และ IP Address ที่ถูกระงับการเข้าถึงระบบโรงพยาบาล
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex gap-2">
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'devices'
                ? 'bg-rose-50 border border-rose-300 text-rose-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Laptop className="w-4 h-4 text-rose-600" />
            <span>อุปกรณ์ที่ถูกแบน ({bannedDevices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ips')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ips'
                ? 'bg-rose-50 border border-rose-300 text-rose-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Globe className="w-4 h-4 text-rose-600" />
            <span>IP Address ที่ถูกแบน ({bannedIps.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
          {activeTab === 'devices' && (
            <div className="space-y-4">
              {/* Add Device Input */}
              <form onSubmit={handleAddDevice} className="flex gap-2">
                <div className="relative flex-1">
                  <Laptop className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newDeviceInput}
                    onChange={(e) => setNewDeviceInput(e.target.value)}
                    placeholder="พิมพ์ชื่ออุปกรณ์ เช่น Windows 11 / Chrome 124"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-rose-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newDeviceInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-sm hover:bg-rose-700 transition disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ แบนเครื่อง</span>
                </button>
              </form>

              {/* Devices List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500">
                  รายการอุปกรณ์ที่ถูกแบน ({bannedDevices.length}):
                </div>
                {bannedDevices.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                    <Laptop className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-slate-500 font-semibold text-xs">ไม่มีอุปกรณ์ที่ถูกแบนในขณะนี้</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {bannedDevices.map((device, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-50 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{device}</div>
                            <div className="text-[10px] text-rose-600 font-mono">สถานะ: ถูกสกัดกั้นการเชื่อมต่อ</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onUnbanDevice(device);
                            onSuccessToast(`ยกเลิกแบนอุปกรณ์: ${device} เรียบร้อยแล้ว`);
                          }}
                          className="px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ยกเลิกแบน</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ips' && (
            <div className="space-y-4">
              {/* Add IP Input */}
              <form onSubmit={handleAddIp} className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newIpInput}
                    onChange={(e) => setNewIpInput(e.target.value)}
                    placeholder="พิมพ์ที่อยู่ IP เช่น 192.168.1.99"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-rose-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newIpInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-sm hover:bg-rose-700 transition disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ แบน IP</span>
                </button>
              </form>

              {/* IP List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500">
                  รายการ IP Address ที่ถูกแบน ({bannedIps.length}):
                </div>
                {bannedIps.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                    <Globe className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-slate-500 font-semibold text-xs">ไม่มีที่อยู่ IP ที่ถูกแบนในขณะนี้</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {bannedIps.map((ip, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-50 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs font-mono">{ip}</div>
                            <div className="text-[10px] text-rose-600 font-mono">สถานะ: ถูกบล็อกการส่งข้อมูล</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onUnbanIp(ip);
                            onSuccessToast(`ยกเลิกแบน IP: ${ip} เรียบร้อยแล้ว`);
                          }}
                          className="px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ยกเลิกแบน</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <span className="text-[11px] text-slate-500">
            การปลดแบนจะมีผลทันทีและอนุญาตให้อุปกรณ์หรือ IP กลับมาใช้งานได้
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
