import os
import cv2
import numpy as np
import json
from app.core.config import settings

class FaceRecognizer:
    def __init__(self):
        self.model_path = str(settings.MODELS_DIR / 'face_recognition_sface_2021dec.onnx')
        self.recognizer = None
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path) and os.path.getsize(self.model_path) > 1000000:
            self.recognizer = cv2.FaceRecognizerSF.create(
                model=self.model_path,
                config=''
            )
            print('[AI Recognizer] SFace model loaded.')
        else:
            print('[AI Recognizer] Warning: SFace model not found!')
            self.recognizer = None

    def extract_feature(self, image_bgr: np.ndarray, raw_face: np.ndarray) -> np.ndarray:
        '''
        Aligns face chip and extracts 128-dim normalized embedding.
        '''
        if self.recognizer is None or image_bgr is None or raw_face is None:
            return None

        try:
            aligned = self.recognizer.alignCrop(image_bgr, raw_face)
            feature = self.recognizer.feature(aligned)
            # Ensure float32 1D or (1, 128)
            return feature
        except Exception as e:
            print(f'[AI Recognizer] Feature extraction error: {e}')
            return None

    def match(self, feat1: np.ndarray, feat2: np.ndarray) -> float:
        '''
        Returns cosine similarity score (-1.0 to 1.0).
        Typical SFace threshold is ~0.60 to 0.70.
        '''
        if self.recognizer is not None:
            try:
                score = self.recognizer.match(feat1, feat2, cv2.FaceRecognizerSF_FR_COSINE)
                return float(score)
            except Exception:
                pass
        
        # Fallback numpy cosine
        f1 = feat1.flatten()
        f2 = feat2.flatten()
        norm1 = np.linalg.norm(f1)
        norm2 = np.linalg.norm(f2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(f1, f2) / (norm1 * norm2))

    def search_best_match(self, feature: np.ndarray, registered_faces: list, threshold: float = None) -> tuple:
        '''
        searches closest match among registered face embeddings.
        registered_faces item: (user_id, display_name, feature_vector_numpy)
        Returns:
            (best_user_id, best_name, max_similarity)
        '''
        if threshold is None:
            threshold = settings.SIMILARITY_THRESHOLD

        if not registered_faces or feature is None:
            return (None, None, 0.0)

        best_user_id = None
        best_name = None
        max_score = -1.0

        for user_id, display_name, reg_feat in registered_faces:
            sim = self.match(feature, reg_feat)
            if sim > max_score:
                max_score = sim
                best_user_id = user_id
                best_name = display_name

        if max_score >= threshold:
            return (best_user_id, best_name, round(max_score, 4))
        else:
            return (None, None, round(max(0.0, max_score), 4))

recognizer = FaceRecognizer()
