export interface Attendance {
  id: string;
  studentId: string;
  classroomId: string;
  date: Date;
  status: AttendanceStatus;
  timeSlot: string; // ex: "08:00-09:00"
  notes?: string;
  justifiedAbsence?: boolean;
  justificationDocument?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused'
}

export interface CreateAttendanceRequest {
  studentId: string;
  classroomId: string;
  date: Date;
  status: AttendanceStatus;
  timeSlot: string;
  notes?: string;
  justifiedAbsence?: boolean;
}

export interface AttendanceStats {
  studentId: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
} 