/**
 * Mahidol Hospital Audio Synthesizer
 * - Synthesizes real hospital ding-dong chime using Web Audio API (Zero external assets needed)
 * - Synthesizes crystal-clear Thai hospital announcement using Web Speech API
 */

export function playHospitalDingDong(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: High chime (D5 - ~587 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: Low chime (A4 - ~440 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440.00, now + 0.45);

      gain2.gain.setValueAtTime(0.001, now + 0.45);
      gain2.gain.exponentialRampToValueAtTime(0.4, now + 0.50);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.45);
      osc2.stop(now + 1.3);

      setTimeout(() => {
        try {
          ctx.close();
        } catch (e) {}
        resolve();
      }, 1300);
    } catch (err) {
      console.warn('Hospital chime audio error:', err);
      resolve();
    }
  });
}

/**
 * Announce queue in official Thai hospital style
 * e.g. "ขอเชิญหมายเลข พีที ศูนย์ หนึ่ง สอง คุณ สมศรี มีสุข ที่ ตู้กายภาพบำบัด AI หมายเลข 1 ค่ะ"
 */
export async function announceHospitalQueue(ticketNumber: string, patientName: string, stationName: string): Promise<void> {
  // 1. Play realistic hospital chime
  await playHospitalDingDong();

  // 2. Format ticket number with pauses for clarity (e.g. "PT-012" -> "พี-ที ศูนย์ หนึ่ง สอง")
  const digitWords: Record<string, string> = {
    '0': 'ศูนย์',
    '1': 'หนึ่ง',
    '2': 'สอง',
    '3': 'สาม',
    '4': 'สี่',
    '5': 'ห้า',
    '6': 'หก',
    '7': 'เจ็ด',
    '8': 'แปด',
    '9': 'เก้า'
  };

  let formattedTicket = ticketNumber;
  if (ticketNumber.startsWith('PT-')) {
    const digits = ticketNumber.replace('PT-', '').split('').map(d => digitWords[d] || d).join(' ');
    formattedTicket = `พี ที ${digits}`;
  }

  const announcementText = `ขอเชิญหมายเลข ${formattedTicket} คุณ ${patientName} ที่ ${stationName} ค่ะ`;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(announcementText);
      utterance.lang = 'th-TH';
      utterance.rate = 0.95; // Polished, clear hospital cadence
      utterance.pitch = 1.05;

      // Select Thai voice if available
      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find(v => v.lang.includes('th') || v.name.includes('Thai') || v.name.includes('Premwadee') || v.name.includes('Niwat'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }
}
