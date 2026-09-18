import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context for chimes
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    return audioContextRef.current;
  }, []);

  // Play pleasant positive chime
  const playChime = useCallback((type: 'success' | 'alert' = 'success') => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'success') {
        // High pleasant ding
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        // Gentle soft warning tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(349.23, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (err) {
      console.warn('Audio chime error:', err);
    }
  }, [getAudioContext]);

  // Load available browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Speak text using Web Speech API or Audio element
  const speak = useCallback((text: string, audioUrl?: string) => {
    if (!text && !audioUrl) return;

    // If backend generated an audio URL, play it
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.play().catch((err) => {
          console.warn('Audio tag playback failed, falling back to Web Speech API:', err);
          speakWebSpeech(text);
        });
        return;
      } catch (err) {
        console.warn('Audio init error, fallback to Web Speech:', err);
      }
    }

    speakWebSpeech(text);
  }, [voices]);

  const speakWebSpeech = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text);

      // Find Thai voice or default
      const thaiVoice = voices.find((v) => v.lang.includes('th') || v.name.includes('Thai'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
        utterance.lang = 'th-TH';
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis error:', err);
      setIsSpeaking(false);
    }
  }, [voices]);

  return {
    voices,
    isSpeaking,
    speak,
    playChime
  };
}
