export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  age: string;
  gender?: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
}

export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  patient?: Patient;
  doctor?: Doctor; // Doctor කෙනෙක් ඉන්න ඕනෙ
  notes?: string;
}

export interface MedicalRecord {
  id: number;
  diagnosis: string;
  treatment: string;
  notes: string;
  recordDate: string;
  patient: Patient;
}

// Backend එකේ DTO එකට ගැලපෙන විදියට
export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  date: string;
  time: string; // HH:mm:ss format
  notes: string;
}