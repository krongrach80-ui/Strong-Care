export interface QueueTicket {
  id: string;
  ticketNumber: string;
  patientName: string;
  patientId: string;
  exerciseType: string;
  exerciseNameTh: string;
  bookedAt: string;
  timeSlot: string;
  status: 'WAITING' | 'CALLING' | 'IN_SESSION' | 'COMPLETED' | 'CANCELLED';
  estimatedWaitMinutes: number;
  assignedStation: string;
}

const QUEUE_STORAGE_KEY = 'strongcare_queue_tickets';

export function getLocalQueueTickets(): QueueTicket[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) {
      const initial: QueueTicket[] = [
        {
          id: 'q_1',
          ticketNumber: 'PT-012',
          patientName: 'คุณยายสมศรี มีสุข',
          patientId: 'P-10024',
          exerciseType: 'shoulder_abduction',
          exerciseNameTh: 'กายภาพข้อไหล่ติด (ยกแขนขึ้น)',
          bookedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          timeSlot: '10:00 - 10:30',
          status: 'CALLING',
          estimatedWaitMinutes: 0,
          assignedStation: 'ตู้กายภาพบำบัดหมายเลข 1'
        },
        {
          id: 'q_2',
          ticketNumber: 'PT-013',
          patientName: 'คุณตาประสิทธิ์ เจริญพร',
          patientId: 'P-10088',
          exerciseType: 'knee_extension',
          exerciseNameTh: 'เหยียดเข่าฟื้นฟูกำลังขา (ข้อเข่า)',
          bookedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          timeSlot: '10:30 - 11:00',
          status: 'WAITING',
          estimatedWaitMinutes: 10,
          assignedStation: 'ตู้กายภาพบำบัดหมายเลข 1'
        },
        {
          id: 'q_3',
          ticketNumber: 'PT-014',
          patientName: 'คุณอนันต์ สิทธิผล',
          patientId: 'P-10105',
          exerciseType: 'balance_posture',
          exerciseNameTh: 'ฝึกการทรงตัวและแกนกลางลำตัว',
          bookedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          timeSlot: '11:00 - 11:30',
          status: 'WAITING',
          estimatedWaitMinutes: 25,
          assignedStation: 'ตู้กายภาพบำบัดหมายเลข 2'
        }
      ];
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function bookNewQueue(
  patientName: string,
  patientId: string,
  exerciseType: string,
  exerciseNameTh: string,
  timeSlot: string
): QueueTicket {
  const tickets = getLocalQueueTickets();
  const nextNum = 'PT-' + String(tickets.length + 15).padStart(3, '0');
  const newTicket: QueueTicket = {
    id: 'ticket_' + Date.now(),
    ticketNumber: nextNum,
    patientName,
    patientId,
    exerciseType,
    exerciseNameTh,
    bookedAt: new Date().toISOString(),
    timeSlot,
    status: 'WAITING',
    estimatedWaitMinutes: Math.max(5, (tickets.filter((t) => t.status === 'WAITING').length + 1) * 12),
    assignedStation: 'ตู้กายภาพบำบัดหมายเลข 1'
  };
  tickets.push(newTicket);
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {}
  return newTicket;
}
