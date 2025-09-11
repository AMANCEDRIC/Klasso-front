export interface Grade {
  id: string;
  value: number; // Note sur 20
  maxValue: number; // Généralement 20
  coefficient: number; // Coefficient de la note
  gradeType: GradeType; // Type d'évaluation
  subject: string;
  description?: string;
  gradeDate: Date;
  studentId: string;
  classroomId: string;
  evaluationId?: string;
  status?: 'PRESENT' | 'ABSENT_JUSTIFIED' | 'ABSENT_UNJUSTIFIED' | 'NOT_SUBMITTED';
  // Champs d'affichage optionnels renvoyés par l'API
  studentFirstName?: string | null;
  studentLastName?: string | null;
  classroomName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum GradeType {
  HOMEWORK = 'homework',
  TEST = 'test',
  EXAM = 'exam',
  PARTICIPATION = 'participation',
  PROJECT = 'project'
}

export interface CreateGradeRequest {
  value: number;
  maxValue: number;
  coefficient: number;
  gradeType: GradeType;
  subject: string;
  description?: string;
  gradeDate: Date;
  studentId: string;
  classroomId: string;
}

export interface StudentAverage {
  studentId: string;
  average: number;
  totalGrades: number;
} 