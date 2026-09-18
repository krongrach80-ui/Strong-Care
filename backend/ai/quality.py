import cv2
import numpy as np

class FaceQualityChecker:
    @staticmethod
    def calculate_blur(crop_gray: np.ndarray) -> float:
        '''Compute Laplacian variance. Higher = sharper.'''
        if crop_gray is None or crop_gray.size == 0:
            return 0.0
        return float(cv2.Laplacian(crop_gray, cv2.CV_64F).var())

    @staticmethod
    def calculate_brightness(crop_gray: np.ndarray) -> float:
        '''Compute average pixel brightness (0-255).'''
        if crop_gray is None or crop_gray.size == 0:
            return 0.0
        return float(np.mean(crop_gray))

    @staticmethod
    def check_quality(image_bgr: np.ndarray, box: tuple, landmarks: list = None) -> dict:
        '''
        box: (x, y, w, h)
        Returns:
            {
                'passed': bool,
                'score': float, # 0.0 - 1.0
                'blur_score': float,
                'brightness': float,
                'issues': list[str]
            }
        '''
        x, y, w, h = box
        img_h, img_w = image_bgr.shape[:2]
        
        # Boundary clipping
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(img_w, x + w)
        y2 = min(img_h, y + h)

        if x2 - x1 < 40 or y2 - y1 < 40:
            return {
                'passed': False,
                'score': 0.2,
                'blur_score': 0.0,
                'brightness': 0.0,
                'issues': ['Face too small (minimum 40x40 required)']
            }

        crop = image_bgr[y1:y2, x1:x2]
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

        blur_val = FaceQualityChecker.calculate_blur(gray)
        brightness_val = FaceQualityChecker.calculate_brightness(gray)

        issues = []
        passed = True

        if blur_val < 30.0:
            issues.append('Image too blurry (keep still)')
            passed = False

        if brightness_val < 45.0:
            issues.append('Too dark, increase lighting')
            passed = False
        elif brightness_val > 220.0:
            issues.append('Overexposed / too bright')
            passed = False

        # Compute normalized score
        blur_norm = min(1.0, blur_val / 200.0)
        bright_norm = 1.0 - (abs(brightness_val - 128.0) / 128.0)
        overall_score = round(float((blur_norm * 0.6) + (bright_norm * 0.4)), 3)

        return {
            'passed': passed,
            'score': max(0.1, min(1.0, overall_score)),
            'blur_score': round(blur_val, 1),
            'brightness': round(brightness_val, 1),
            'issues': issues
        }
