import os
import cv2
import numpy as np
import base64
import json
import time
import re
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, FaceProfile
from app.core.config import settings
from ai.detector import detector
from ai.recognizer import recognizer
from ai.quality import FaceQualityChecker

class FaceService:
    def __init__(self):
        self.cached_profiles = []
        self.last_cache_time = 0

    async def reload_cache(self, db: AsyncSession):
        stmt = select(FaceProfile, User.display_name).join(User, FaceProfile.user_id == User.id).where(User.status == 'active')
        result = await db.execute(stmt)
        rows = result.all()

        new_cache = []
        for profile, display_name in rows:
            try:
                emb_list = json.loads(profile.embedding)
                feat_np = np.array(emb_list, dtype=np.float32).reshape(1, -1)
                new_cache.append((profile.user_id, display_name, feat_np))
            except Exception as e:
                print(f'[FaceService] Cache parse error for profile {profile.id}: {e}')

        self.cached_profiles = new_cache
        self.last_cache_time = time.time()
        print(f'[FaceService] Loaded {len(self.cached_profiles)} face profiles into memory cache.')

    def decode_base64_image(self, base64_str: str) -> np.ndarray:
        if ',' in base64_str:
            base64_str = base64_str.split(',', 1)[1]
        img_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img_bgr

    @staticmethod
    def sanitize_name(name: str) -> str:
        # Keep alphanumeric, thai characters, and underscores
        cleaned = re.sub(r'[^\w\u0E00-\u0E7F\-]', '_', name)
        return cleaned.strip('_') or 'unknown'

    async def register_face(
        self,
        db: AsyncSession,
        username: str,
        display_name: str,
        role: str,
        angle_label: str,
        image_base64: str
    ) -> dict:
        img_bgr = self.decode_base64_image(image_base64)
        if img_bgr is None:
            return {'success': False, 'message': 'รูปแบบรูปภาพไม่ถูกต้อง (Invalid image format)'}

        # 1. Face Detection
        faces = detector.detect(img_bgr)
        if not faces:
            return {'success': False, 'message': 'ไม่พบใบหน้าในภาพ กรุณาขยับใบหน้าให้อยู่ตรงกลางกล้องค่ะ'}
        if len(faces) > 1:
            return {'success': False, 'message': 'พบใบหน้าหลายคนในกล้อง กรุณาให้ยืนถ่ายทีละคนค่ะ'}

        face = faces[0]
        box = face['box']
        raw_face = face['raw_face']

        # 2. Quality Check
        quality = FaceQualityChecker.check_quality(img_bgr, box, face.get('landmarks'))
        if not quality['passed']:
            issues_str = ', '.join(quality['issues'])
            return {
                'success': False,
                'message': f'ภาพยังไม่ชัดเจนพอ: {issues_str}',
                'quality': quality
            }

        # 3. Extract Feature Embedding
        feature = recognizer.extract_feature(img_bgr, raw_face)
        if feature is None:
            return {'success': False, 'message': 'ไม่สามารถสกัดข้อมูลใบหน้าได้ กรุณาลองใหม่อีกครั้ง'}

        # 4. Save face crop
        x, y, w, h = box
        pad = int(max(w, h) * 0.2)
        h_img, w_img = img_bgr.shape[:2]
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(w_img, x + w + pad)
        y2 = min(h_img, y + h + pad)
        crop = img_bgr[y1:y2, x1:x2]

        # Find or create User
        stmt = select(User).where(User.username == username)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        clean_role = 'ADMIN' if role.upper() == 'ADMIN' else 'USER'

        if user is None:
            user = User(username=username, display_name=display_name, role=clean_role, status='active')
            db.add(user)
            await db.flush()
        else:
            user.display_name = display_name
            user.role = clean_role

        # 5. Create Structured Directory: storage/faces/{role_folder}/{username}_{display_name}/
        role_folder = 'admins' if clean_role == 'ADMIN' else 'users'
        user_folder_name = f"{self.sanitize_name(username)}_{self.sanitize_name(display_name)}"
        target_dir = settings.FACES_DIR / role_folder / user_folder_name
        target_dir.mkdir(parents=True, exist_ok=True)

        # File naming: {username}_{angle_label}_{timestamp}.jpg
        timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{self.sanitize_name(username)}_{angle_label}_{timestamp_str}.jpg"
        filepath = target_dir / filename
        cv2.imwrite(str(filepath), crop)

        # Write metadata JSON file alongside the image
        meta_data = {
            'user_id': user.id,
            'username': username,
            'display_name': display_name,
            'role': clean_role,
            'angle': angle_label,
            'quality_score': quality['score'],
            'registered_at': datetime.now().isoformat(),
            'storage_path': str(filepath)
        }
        with open(target_dir / 'metadata.json', 'w', encoding='utf-8') as f:
            json.dump(meta_data, f, ensure_ascii=False, indent=2)

        # Relative URL for web serving
        rel_path = f"/storage/faces/{role_folder}/{user_folder_name}/{filename}"

        # 6. Save FaceProfile to DB
        embedding_json = json.dumps(feature.flatten().tolist())
        profile = FaceProfile(
            user_id=user.id,
            embedding=embedding_json,
            angle_label=angle_label,
            quality_score=quality['score'],
            image_path=rel_path
        )
        db.add(profile)
        await db.commit()
        await db.refresh(user)

        # Reload cache
        await self.reload_cache(db)

        return {
            'success': True,
            'message': f'ลงทะเบียนสำเร็จสำหรับ {display_name} ({clean_role})',
            'user_id': user.id,
            'role': clean_role,
            'quality': quality,
            'image_path': rel_path,
            'folder_location': f"storage/faces/{role_folder}/{user_folder_name}/"
        }

face_service = FaceService()