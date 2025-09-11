// Export all models
export * from './user.model';
export * from './establishment.model';
export * from './classroom.model';
export * from './student.model';
export * from './grade.model';
export * from './attendance.model';
export * from './report.model'; 
export interface EvaluationDto {
  id: number;
  classroomId: number;
  subject: string;
  gradeType: string;
  maxValue: number;
  coefficient: number;
  evaluationDate: string; // YYYY-MM-DD
  description?: string | null;
}