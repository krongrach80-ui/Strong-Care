/**
 * Strong Care - Custom Pose Service
 * 
 * Manages user-defined custom physical therapy exercises stored in localStorage,
 * partitioned by patientId. Includes client-side image compression to prevent
 * storage quota exhaustion.
 */

export interface CustomPoseItem {
  id: string;
  patientId?: number | string;
  name: string;
  instructions: string;
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_PREFIX = 'strongcare_custom_poses_';

/**
 * Returns the localStorage key partitioned by patientId
 */
export function getCustomPoseStorageKey(patientId?: number | string): string {
  return `${STORAGE_KEY_PREFIX}${patientId ?? 'guest'}`;
}

/**
 * Retrieve all custom poses for a given patient
 */
export function getCustomPoses(patientId?: number | string): CustomPoseItem[] {
  try {
    const key = getCustomPoseStorageKey(patientId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('[customPoseService] Failed to load custom poses:', error);
    return [];
  }
}

/**
 * Get count of custom poses for a given patient
 */
export function getCustomPoseCount(patientId?: number | string): number {
  return getCustomPoses(patientId).length;
}

/**
 * Save (create or update) a custom pose
 */
export function saveCustomPose(
  patientId: number | string | undefined,
  data: {
    id?: string;
    name: string;
    instructions?: string;
    imageDataUrl?: string;
  }
): CustomPoseItem {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error('กรุณาระบุชื่อท่ากายภาพ');
  }

  const existingList = getCustomPoses(patientId);
  const now = new Date().toISOString();

  let savedItem: CustomPoseItem;

  if (data.id) {
    // Update existing pose
    const index = existingList.findIndex((item) => item.id === data.id);
    if (index === -1) {
      throw new Error(`ไม่พบท่ากายภาพที่ต้องการแก้ไข (id: ${data.id})`);
    }

    savedItem = {
      ...existingList[index],
      name: trimmedName,
      instructions: (data.instructions || '').trim(),
      imageDataUrl: data.imageDataUrl ?? existingList[index].imageDataUrl,
      updatedAt: now,
    };
    existingList[index] = savedItem;
  } else {
    // Create new pose
    savedItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      patientId,
      name: trimmedName,
      instructions: (data.instructions || '').trim(),
      imageDataUrl: data.imageDataUrl,
      createdAt: now,
      updatedAt: now,
    };
    existingList.unshift(savedItem); // newest first
  }

  try {
    const key = getCustomPoseStorageKey(patientId);
    localStorage.setItem(key, JSON.stringify(existingList));
  } catch (error) {
    console.error('[customPoseService] Failed to persist custom pose:', error);
    throw new Error('ไม่สามารถบันทึกข้อมูลได้ เนื่องจากพื้นที่จัดเก็บไม่เพียงพอ');
  }

  return savedItem;
}

/**
 * Delete a custom pose by ID
 */
export function deleteCustomPose(patientId: number | string | undefined, id: string): boolean {
  try {
    const existingList = getCustomPoses(patientId);
    const updatedList = existingList.filter((item) => item.id !== id);
    const key = getCustomPoseStorageKey(patientId);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return true;
  } catch (error) {
    console.error('[customPoseService] Failed to delete custom pose:', error);
    return false;
  }
}

/**
 * Compress an image file to a small base64 JPEG data URL using HTML5 Canvas.
 * Keeps aspect ratio with max dimension default 480px, quality 0.75.
 */
export function compressImage(
  file: File | Blob,
  maxWidth = 480,
  maxHeight = 480,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพที่รองรับ'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพเพื่อประมวลผลได้'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('เบราว์เซอร์ไม่รองรับ Canvas 2D'));
          return;
        }

        // Draw image resized
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
