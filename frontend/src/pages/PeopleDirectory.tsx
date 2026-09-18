import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  UserPlus, 
  Shield, 
  Camera, 
  Calendar, 
  Folder,
  AlertTriangle,
  Smile
} from 'lucide-react';
import { api, UserItem } from '../services/api';

interface PeopleDirectoryProps {
  onRegisterClick: () => void;
}

export const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({ onRegisterClick }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalUser, setDeleteModalUser] = useState<UserItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (userId: number) => {
    try {
      await api.deleteUser(userId);
      setDeleteModalUser(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2563EB]" />
            <h1 className="text-2xl font-bold text-slate-900 font-['Outfit']">รายชื่อสมาชิกที่ลงทะเบียน</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการโปรไฟล์ใบหน้าและตรวจสอบโฟลเดอร์จัดเก็บภาพถ่ายบนเซิร์ฟเวอร์ ({users.length} คน)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
          <button
            onClick={onRegisterClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มสมาชิกใหม่</span>
          </button>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">กำลังโหลดข้อมูลสมาชิก...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="text-slate-700 font-semibold text-sm">ยังไม่พบข้อมูลสมาชิก</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'ไม่พบชื่อที่ตรงกับการค้นหา' : 'ยังไม่มีสมาชิกในระบบ เริ่มต้นลงทะเบียนใบหน้าสมาชิกคนแรก'}
          </p>
          {!searchTerm && (
            <button
              onClick={onRegisterClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>ลงทะเบียนคนแรก</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((user) => {
            const primaryProfile = user.face_profiles[0];
            const isAdmin = user.role === 'ADMIN';

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {primaryProfile?.image_path ? (
                        <img
                          src={primaryProfile.image_path}
                          alt={user.display_name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">{user.display_name}</h3>
                        <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      isAdmin
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <Shield className="w-3 h-3" />
                      <span>{user.role}</span>
                    </span>
                  </div>

                  {/* Storage Folder Path Display */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                      <Folder className="w-3 h-3 text-amber-500" />
                      <span>ตำแหน่งโฟลเดอร์ใน Storage:</span>
                    </div>
                    <div className="font-mono text-[10px] text-emerald-700 truncate font-medium">
                      {primaryProfile?.image_path
                        ? primaryProfile.image_path.substring(0, primaryProfile.image_path.lastIndexOf('/'))
                        : `storage/faces/${isAdmin ? 'admins' : 'users'}/${user.username}/`}
                    </div>
                  </div>

                  {/* Angles Preview */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 mb-1.5 flex items-center justify-between">
                      <span>ภาพถ่ายมุมมอง:</span>
                      <span className="text-indigo-600 font-bold">{user.face_profiles.length} มุม</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {user.face_profiles?.map((p: any) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-mono"
                        >
                          {p.angle_label.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer details & delete */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(user.created_at).toLocaleDateString('th-TH')}</span>
                  </div>

                  <button
                    onClick={() => setDeleteModalUser(user)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="ลบผู้ใช้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">ยืนยันการลบสมาชิก?</h3>
              <p className="text-xs text-slate-600">
                คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>{deleteModalUser.display_name}</strong>? ข้อมูลในโฟลเดอร์ storage และ Embedding จะถูกลบถาวร
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalUser(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteModalUser.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};