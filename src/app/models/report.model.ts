import { Grade } from './grade.model';
import { AttendanceStats } from './attendance.model';

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  generatedDate: Date;
  period: string; // ex: "Trimestre 1"
  academicYear: string;
  classroomId?: string;
  studentId?: string;
  data: any; // Données du rapport (flexible)
  createdBy: string; // ID du professeur
  createdAt: Date;
}

export enum ReportType {
  STUDENT_BULLETIN = 'student_bulletin',
  CLASS_SUMMARY = 'class_summary',
  ATTENDANCE_REPORT = 'attendance_report',
  GRADE_REPORT = 'grade_report'
}

export interface StudentBulletin {
  student: {
    firstName: string;
    lastName: string;
    className: string;
  };
  grades: {
    subject: string;
    average: number;
    grades: Grade[];
  }[];
  attendance: AttendanceStats;
  generalAverage: number;
  classRank?: number;
  comments?: string;
}

export interface ClassSummary {
  className: string;
  totalStudents: number;
  averageGrade: number;
  attendanceRate: number;
  topStudents: {
    studentName: string;
    average: number;
  }[];
} 