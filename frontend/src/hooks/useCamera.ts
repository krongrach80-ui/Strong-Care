import { useState, useEffect, useRef, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);

  // Enumerate cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Cannot enumerate devices:', err);
    }
  }, [selectedCameraId]);

  // Start Camera Stream with fallback
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setError(null);
      setIsPermissionDenied(false);

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      let mediaStream: MediaStream | null = null;

      // 1. Try with preferred device & high resolution
      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: false
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        if (firstErr.name === 'NotAllowedError' || firstErr.name === 'PermissionDeniedError') {
          throw firstErr;
        }
        console.warn('High-res constraints failed, trying basic video fallback...', firstErr);
        // Fallback to minimal video constraint (compatible with any driver)
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (mediaStream) {
        setStream(mediaStream);
        setIsActive(true);
        setError(null);
        setIsPermissionDenied(false);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.warn);
        }

        await getCameras();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setIsPermissionDenied(true);
        setError('เบราว์เซอร์ Chrome บล็อกการเข้าถึงกล้อง (Permission Denied) กรุณาคลิกไอคอนกล้องที่แถบ URL ด้านบนเพื่อปลดบล็อก');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('กล้องกำลังถูกใช้งานโดยโปรแกรมอื่นในคอมพิวเตอร์ (กรุณาปิดโปรแกรมกล้องอื่น เช่น Zoom/Discord)');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('ไม่พบอุปกรณ์กล้องโน้ตบุ๊คในระบบ');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการเปิดกล้อง');
      }
    }
  }, [stream, getCameras]);

  // Ensure stream is bound to video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(console.warn);
    }
  }, [stream]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, [stream]);

  // Capture frame as Base64 JPEG data URL (Stable closure, always captures if video is ready)
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.readyState < 2) {
      return null;
    }

    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.warn('captureFrame error:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    getCameras();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    isActive,
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    startCamera,
    stopCamera,
    captureFrame,
    error,
    isPermissionDenied
  };
}
