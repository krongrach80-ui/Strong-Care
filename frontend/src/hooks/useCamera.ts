import { useState, useEffect, useRef, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(true);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCameraLoading(true);

    try {
      // Release any existing camera tracks first to avoid NotReadableError
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (typeof window !== 'undefined' && !window.isSecureContext) {
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (!isLocal) {
            throw new Error(
              `เบราว์เซอร์บล็อกการเข้าถึงกล้องเนื่องจากไม่ได้ใช้ HTTPS (Insecure Context): สำหรับการทดสอบบนมือถือผ่าน LAN/Wi-Fi กรุณาใช้ URL ที่ขึ้นต้นด้วย "https://" (เช่น https://${window.location.host}) หรือเปิดผ่าน localhost`
            );
          }
        }
        throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้องเว็บแคม (WebRTC MediaDevices)');
      }

      let mediaStream: MediaStream;
      try {
        // Preferred resolution for high-framerate pose tracking
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: isFrontCamera ? 'user' : 'environment',
          },
          audio: false,
        });
      } catch (constraintErr) {
        console.warn('Fallback to basic video constraint:', constraintErr);
        // Fallback to generic video constraint if device cannot fulfill dimensions
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play warning:', playErr);
        }
      }

      setIsCameraReady(true);
      setIsCameraLoading(false);
    } catch (err: unknown) {
      console.warn('Camera access unavailable:', err);
      let msg = 'ไม่สามารถเปิดกล้องเว็บแคมได้';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'เบราว์เซอร์ยังไม่ได้รับอนุญาตให้ใช้กล้อง: กรุณาคลิกไอคอนการตั้งค่า/รูปกล้องที่ช่อง URL ด้านบน แล้วเลือก "อนุญาต (Allow)"';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'ไม่พบอุปกรณ์กล้องเว็บแคมที่เชื่อมต่อกับคอมพิวเตอร์';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'กล้องกำลังถูกใช้งานโดยโปรแกรมอื่น (เช่น Discord, Roblox, Zoom, OBS หรือ Windows Camera) กรุณาปิดโปรแกรมอื่นแล้วลองใหม่';
        } else {
          msg = `${err.name}: ${err.message}`;
        }
      }
      setCameraError(msg);
      setIsCameraReady(false);
      setIsCameraLoading(false);
    }
  }, [isFrontCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
    setIsCameraLoading(false);
  }, []);

  const toggleCamera = () => {
    setIsFrontCamera((prev) => !prev);
  };

  // Sync stream to video element whenever videoRef or streamRef is available
  useEffect(() => {
    if (isCameraReady && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
      }
    }
  }, [isCameraReady]);

  // Only cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    isCameraReady,
    isCameraLoading,
    cameraError,
    startCamera,
    stopCamera,
    toggleCamera,
    isFrontCamera,
  };
}
