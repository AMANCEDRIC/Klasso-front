export interface Classroom {
  id: string;
  name: string;
  level: string; // ex: "6ème", "5ème", etc.
  subject: string; // Matière enseignée
  establishmentId: string;
  userId: string; // ID du professeur
  academicYear: string; // ex: "2024-2025"
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassroomRequest {
  name: string;
  level: string;
  subject: string;
  establishmentId: string;
  academicYear: string;
} 