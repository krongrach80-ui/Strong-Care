import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Activity,
  Sparkles,
} from 'lucide-react';
import {
  CustomPoseItem,
  getCustomPoses,
  saveCustomPose,
  deleteCustomPose,
  compressImage,
} from '../../services/customPoseService';

interface CustomPosesPageProps {
  patientId?: number | string;
  onBack: () => void;
}

export const CustomPosesPage: React.FC<CustomPosesPageProps> = ({
  patientId,
  onBack,
}) => {
  const [poses, setPoses] = useState<CustomPoseItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPose, setEditingPose] = useState<CustomPoseItem | null>(null);
  const [menuOpenPoseId, setMenuOpenPoseId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formInstructions, setFormInstructions] = useState<string>('');
  const [formImageDataUrl, setFormImageDataUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingPose, setDeletingPose] = useState<CustomPoseItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadPoses = () => {
    const list = getCustomPoses(patientId);
    setPoses(list);
  };

  useEffect(() => {
    reloadPoses();
  }, [patientId]);

  // Close ⋮ dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.pose-menu-container')) {
        setMenuOpenPoseId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingPose(null);
    setFormName('');
    setFormInstructions('');
    setFormImageDataUrl(null);
    setFormError(null);
    setIsModalOpen(true);
    setMenuOpenPoseId(null);
  };

  // Open Edit modal
  const handleOpenEditModal = (pose: CustomPoseItem) => {
    setEditingPose(pose);
    setFormName(pose.name);
    setFormInstructions(pose.instructions || '');
    setFormImageDataUrl(pose.imageDataUrl || null);
    setFormError(null);
    setIsModalOpen(true);
    setMenuOpenPoseId(null);
  };

  // Image upload & compress
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setFormError(null);
      const compressed = await compressImage(file, 480, 480, 0.75);
      setFormImageDataUrl(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      setFormError(err instanceof Error ? err.message : 'ไม่สามารถประมวลผลรูปภาพได้');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Form submit
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('กรุณาระบุชื่อท่ากายภาพ');
      return;
    }

    try {
      saveCustomPose(patientId, {
        id: editingPose ? editingPose.id : undefined,
        name: trimmed,
        instructions: formInstructions,
        imageDataUrl: formImageDataUrl || undefined,
      });

      reloadPoses();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกได้');
    }
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!deletingPose) return;
    deleteCustomPose(patientId, deletingPose.id);
    setDeletingPose(null);
    reloadPoses();
  };

  return (
    <div className="w-full max-w-[720px] mx-auto flex flex-col animate-fadeIn relative z-10 py-3 sm:py-6 px-2 sm:px-4">
      {/* 1. Header with Back Button */}
      <header className="flex items-center justify-between w-full mb-4 sm:mb-6">
        <button
          onClick={onBack}
          id="btnBackFromCustomPoses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-emerald-300 text-sm sm:text-base font-bold text-[#0B2B2B] hover:bg-white transition active:scale-95 shadow-sm min-h-[44px]"
          aria-label="ย้อนกลับไปหน้าเลือกเวลาและท่าทาง"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E8A4C]" />
          <span>ย้อนกลับ</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-emerald-900 bg-white/90 px-3.5 py-1.5 rounded-full border border-emerald-300 shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#1E8A4C]" />
            <span>ส่วนอื่น ๆ ({poses.length} ท่า)</span>
          </span>
        </div>
      </header>

      {/* 2. Title & Action Section */}
      <section className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B2B2B] tracking-tight">
              ท่ากายภาพที่เพิ่มเอง
            </h1>
            <p className="text-xs sm:text-sm text-emerald-800/90 font-medium mt-0.5">
              จัดการท่ากายภาพเฉพาะบุคคลของคุณ บันทึกเก็บในเครื่องผู้ใช้ (localStorage)
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            id="btnAddCustomPose"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#6FD67F] to-[#1E8A4C] text-white font-bold text-sm sm:text-base shadow-md hover:opacity-95 transition active:scale-95 flex-shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>เพิ่มท่าใหม่</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>คำแนะนำ:</strong> ท่าที่เพิ่มเองจะเก็บไว้ในอุปกรณ์ของคุณแยกตามผู้ป่วย (ปัจจุบันยังเริ่มฝึกด้วยท่าที่เพิ่มเองไม่ได้ ใช้ได้เฉพาะกายภาพยืดเส้น)
          </span>
        </div>
      </section>

      {/* 3. Pose List */}
      <section className="space-y-3 pb-8">
        {poses.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-emerald-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 text-[#1E8A4C] flex items-center justify-center mb-3">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#0B2B2B] mb-1">
              ยังไม่มีท่ากายภาพที่เพิ่มเอง
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-4">
              คุณสามารถสร้างท่ากายภาพเฉพาะบุคคล โดยการใส่ชื่อท่า วิธีฝึก และแนบรูปภาพตัวอย่างได้
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E8A4C] text-white text-sm font-bold hover:bg-[#156C3B] transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>เริ่มเพิ่มท่าใหม่แรกของคุณ</span>
            </button>
          </div>
        ) : (
          poses.map((pose) => (
            <div
              key={pose.id}
              className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex items-start gap-3.5 sm:gap-4"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-emerald-50 border border-emerald-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {pose.imageDataUrl ? (
                  <img
                    src={pose.imageDataUrl}
                    alt={pose.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-emerald-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pr-8">
                <h3 className="text-base sm:text-lg font-bold text-[#0B2B2B] leading-snug break-words">
                  {pose.name}
                </h3>
                {pose.instructions ? (
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 whitespace-pre-line line-clamp-3">
                    {pose.instructions}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic mt-1">
                    (ไม่มีรายละเอียดวิธีทำ)
                  </p>
                )}
              </div>

              {/* Menu Container (⋮) */}
              <div className="pose-menu-container absolute top-3 right-3">
                <button
                  type="button"
                  id={`btnMenu_${pose.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenPoseId(menuOpenPoseId === pose.id ? null : pose.id);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-emerald-50 text-stone-600 flex items-center justify-center transition"
                  aria-label="เพิ่มเติม"
                  title="เพิ่มเติม"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {menuOpenPoseId === pose.id && (
                  <div className="absolute right-0 top-9 w-36 bg-white rounded-xl shadow-xl border border-emerald-200 py-1 z-30 animate-fadeIn text-sm">
                    <button
                      type="button"
                      id={`btnEdit_${pose.id}`}
                      onClick={() => handleOpenEditModal(pose)}
                      className="w-full px-3 py-2 text-left font-semibold text-[#0B2B2B] hover:bg-emerald-50 flex items-center gap-2 transition"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-600" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      type="button"
                      id={`btnDelete_${pose.id}`}
                      onClick={() => {
                        setDeletingPose(pose);
                        setMenuOpenPoseId(null);
                      }}
                      className="w-full px-3 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>ลบ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* 4. Add / Edit Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-pose-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-200 animate-slideUp sm:animate-fadeIn max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <h2 id="modal-pose-title" className="text-lg sm:text-xl font-bold text-[#0B2B2B]">
                {editingPose ? 'แก้ไขท่ากายภาพ' : 'เพิ่มท่ากายภาพใหม่'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center transition"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              {/* Error Alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Image Picker */}
              <div>
                <label className="block text-xs font-bold text-[#0B2B2B] mb-1.5">
                  รูปภาพประกอบท่ากายภาพ (อุปกรณ์จะย่อรูปอัตโนมัติ)
                </label>
                <input
                  ref={fileInputRef}
                  id="customPoseImageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formImageDataUrl ? (
                  <div className="relative w-full h-44 rounded-2xl border border-emerald-200 overflow-hidden bg-stone-50 flex items-center justify-center group">
                    <img
                      src={formImageDataUrl}
                      alt="ตัวอย่างท่ากายภาพ"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-xs font-bold text-stone-800 rounded-lg shadow-sm hover:bg-stone-100"
                      >
                        เปลี่ยนรูป
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImageDataUrl(null)}
                        className="px-3 py-1.5 bg-rose-600 text-xs font-bold text-white rounded-lg shadow-sm hover:bg-rose-700"
                      >
                        ลบรูป
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full h-36 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 flex flex-col items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isCompressing ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold text-emerald-800">กำลังย่อและประมวลผลรูปภาพ...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[#1E8A4C]" />
                        <span className="text-xs sm:text-sm font-bold text-emerald-900">
                          แตะเพื่อเลือกรูปภาพ หรือถ่ายภาพ
                        </span>
                        <span className="text-[11px] text-stone-500">
                          รองรับ JPG, PNG, WebP (ย่อขนาดอัตโนมัติเพื่อประหยัดพื้นที่)
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 2. Pose Name Input (Required) */}
              <div>
                <label
                  htmlFor="customPoseNameInput"
                  className="block text-xs font-bold text-[#0B2B2B] mb-1"
                >
                  ชื่อท่ากายภาพ <span className="text-rose-600">* (จำเป็น)</span>
                </label>
                <input
                  id="customPoseNameInput"
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="เช่น ยกแขนบริหารหัวไหล่, ยืดกล้ามเนื้อสะโพก"
                  className="w-full text-base font-semibold p-3 rounded-xl border border-emerald-300 bg-white text-[#0B2B2B] focus:ring-2 focus:ring-[#1E8A4C] focus:outline-none min-h-[48px] shadow-sm"
                  required
                />
              </div>

              {/* 3. Pose Instructions Textarea */}
              <div>
                <label
                  htmlFor="customPoseInstructionsInput"
                  className="block text-xs font-bold text-[#0B2B2B] mb-1"
                >
                  วิธีทำ / คำแนะนำในการฝึก
                </label>
                <textarea
                  id="customPoseInstructionsInput"
                  rows={4}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="เช่น ยืนตรง กางแขนออกเสมอไหล่ ค้างไว้ 15 วินาที แล้วค่อยๆ ลดแขนลง หายใจเข้า-ออกสม่ำเสมอ..."
                  className="w-full text-sm font-normal p-3 rounded-xl border border-emerald-300 bg-white text-[#0B2B2B] focus:ring-2 focus:ring-[#1E8A4C] focus:outline-none shadow-sm"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  id="btnCancelCustomPose"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  id="btnSaveCustomPose"
                  disabled={!formName.trim() || isCompressing}
                  className={`px-6 py-2.5 rounded-full font-bold text-sm text-white flex items-center gap-1.5 shadow-md min-h-[44px] transition ${
                    !formName.trim() || isCompressing
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-[#6FD67F] to-[#1E8A4C] hover:opacity-95 active:scale-95'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>บันทึก</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deletingPose && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setDeletingPose(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 animate-slideUp text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-800">ยืนยันการลบท่ากายภาพ</h3>
              <p className="text-xs text-stone-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบท่า{' '}
                <strong className="text-stone-700 font-bold">"{deletingPose.name}"</strong>?
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPose(null)}
                className="flex-1 py-2.5 rounded-full border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                id="btnConfirmDeletePose"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition"
              >
                ลบท่า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
