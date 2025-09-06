import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import {
  User, LoginRequest, AuthResponse,
  Establishment, CreateEstablishmentRequest,
  Classroom, CreateClassroomRequest,
  Student, CreateStudentRequest,
  Grade, CreateGradeRequest, GradeType,
  Attendance, CreateAttendanceRequest, AttendanceStatus
} from '../models';

// Interface pour le fake backend avec mot de passe
interface UserWithPassword extends User {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class FakeBackendService {
  private users: UserWithPassword[] = [];
  private establishments: Establishment[] = [];
  private classrooms: Classroom[] = [];
  private students: Student[] = [];
  private grades: Grade[] = [];
  private attendances: Attendance[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Utilisateur de test
    const testUser: UserWithPassword = {
      id: 1,
      email: 'prof@klaso.com',
      firstName: 'Naounou',
      lastName: 'France Liliane',
      password: 'password123',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    };
    this.users.push(testUser);

    // Établissement de test
    const testEstablishment: Establishment = {
      id: '1',
      name: 'Collège Victor Hugo',
      address: '123 rue de la République',
      city: 'Paris',
      postalCode: '75001',
      country: 'cote d ivoire',
      userId: '1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };
    this.establishments.push(testEstablishment);

    // Classe de test
    const testClassroom: Classroom = {
      id: '1',
      name: '6ème A',
      level: '6ème',
      subject: 'Mathématiques',
      establishmentId: '1',
      userId: '1',
      academicYear: '2024-2025',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };
    this.classrooms.push(testClassroom);

    // Élèves de test
    const testStudents: Student[] = [
      {
        id: '1',
        firstName: 'Marie',
        lastName: 'Martin',
        dateOfBirth: new Date('2012-03-15'),
        email: 'marie.martin@email.com',
        parentName: 'Pierre Martin',
        parentEmail: 'pierre.martin@email.com',
        parentPhone: '0123456789',
        classroomId: '1',
        enrollmentDate: new Date('2024-09-01'),
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        firstName: 'Lucas',
        lastName: 'Durand',
        dateOfBirth: new Date('2012-05-20'),
        parentName: 'Sophie Durand',
        parentEmail: 'sophie.durand@email.com',
        parentPhone: '0123456790',
        classroomId: '1',
        enrollmentDate: new Date('2024-09-01'),
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
    this.students.push(...testStudents);

    // Notes de test
    const testGrades: Grade[] = [
      {
        id: '1',
        value: 15,
        maxValue: 20,
        coefficient: 1,
        gradeType: GradeType.TEST,
        subject: 'Mathématiques',
        description: 'Contrôle sur les fractions',
        gradeDate: new Date('2024-10-15'),
        studentId: '1',
        classroomId: '1',
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-10-15')
      },
      {
        id: '2',
        value: 12,
        maxValue: 20,
        coefficient: 1,
        gradeType: GradeType.TEST,
        subject: 'Mathématiques',
        description: 'Contrôle sur les fractions',
        gradeDate: new Date('2024-10-15'),
        studentId: '2',
        classroomId: '1',
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-10-15')
      }
    ];
    this.grades.push(...testGrades);
  }

  // Méthodes pour les utilisateurs
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const user = this.users.find(u => u.email === credentials.email && u.password === credentials.password);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          return {
            user: userWithoutPassword,
            token: 'fake-jwt-token-' + user.id
          };
        } else {
          throw new Error('Email ou mot de passe incorrect');
        }
      })
    );
  }

  getCurrentUser(token: string): Observable<User> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const userId = token.replace('fake-jwt-token-', '');
        const user = this.users.find(u => u.id.toString() === userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        } else {
          throw new Error('Token invalide');
        }
      })
    );
  }

  // Méthodes pour les établissements
  getEstablishments(userId: string): Observable<Establishment[]> {
    return of(this.establishments.filter(e => e.userId === userId)).pipe(delay(300));
  }

  createEstablishment(data: CreateEstablishmentRequest & { userId: string }): Observable<Establishment> {
    const establishment: Establishment = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.establishments.push(establishment);
    return of(establishment).pipe(delay(300));
  }

  updateEstablishment(id: string, data: Partial<CreateEstablishmentRequest>): Observable<Establishment> {
    const index = this.establishments.findIndex(e => e.id === id);
    if (index !== -1) {
      this.establishments[index] = {
        ...this.establishments[index],
        ...data,
        updatedAt: new Date()
      };
      return of(this.establishments[index]).pipe(delay(300));
    }
    return throwError(() => new Error('Établissement non trouvé'));
  }

  deleteEstablishment(id: string): Observable<void> {
    const index = this.establishments.findIndex(e => e.id === id);
    if (index !== -1) {
      this.establishments.splice(index, 1);
      return of(void 0).pipe(delay(300));
    }
    return throwError(() => new Error('Établissement non trouvé'));
  }

  // Méthodes pour les classes
  getClassrooms(establishmentId: string): Observable<Classroom[]> {
    return of(this.classrooms.filter(c => c.establishmentId === establishmentId)).pipe(delay(300));
  }

  createClassroom(data: CreateClassroomRequest & { userId: string }): Observable<Classroom> {
    const classroom: Classroom = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.classrooms.push(classroom);
    return of(classroom).pipe(delay(300));
  }

  updateClassroom(id: string, data: Partial<CreateClassroomRequest>): Observable<Classroom> {
    const index = this.classrooms.findIndex(c => c.id === id);
    if (index !== -1) {
      this.classrooms[index] = {
        ...this.classrooms[index],
        ...data,
        updatedAt: new Date()
      };
      return of(this.classrooms[index]).pipe(delay(300));
    }
    return throwError(() => new Error('Classe non trouvée'));
  }

  deleteClassroom(id: string): Observable<void> {
    const index = this.classrooms.findIndex(c => c.id === id);
    if (index !== -1) {
      this.classrooms.splice(index, 1);
      return of(void 0).pipe(delay(300));
    }
    return throwError(() => new Error('Classe non trouvée'));
  }

  // Méthodes pour les élèves
  getStudents(classroomId: string): Observable<Student[]> {
    return of(this.students.filter(s => s.classroomId === classroomId && s.isActive)).pipe(delay(300));
  }

  createStudent(data: CreateStudentRequest): Observable<Student> {
    const student: Student = {
      id: uuidv4(),
      ...data,
      enrollmentDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.students.push(student);
    return of(student).pipe(delay(300));
  }

  updateStudent(student: Student): Observable<Student> {
    const index = this.students.findIndex(s => s.id === student.id);
    if (index !== -1) {
      this.students[index] = {
        ...student,
        updatedAt: new Date()
      };
      return of(this.students[index]).pipe(delay(300));
    }
    return throwError(() => new Error('Élève non trouvé'));
  }

  deleteStudent(id: string): Observable<void> {
    const index = this.students.findIndex(s => s.id === id);
    if (index !== -1) {
      this.students.splice(index, 1);
      return of(void 0).pipe(delay(300));
    }
    return throwError(() => new Error('Élève non trouvé'));
  }

  // Méthodes pour les notes
  getGrades(classroomId: string): Observable<Grade[]> {
    return of(this.grades.filter(g => g.classroomId === classroomId)).pipe(delay(300));
  }

  getStudentGrades(studentId: string): Observable<Grade[]> {
    return of(this.grades.filter(g => g.studentId === studentId)).pipe(delay(300));
  }

  createGrade(data: CreateGradeRequest): Observable<Grade> {
    const grade: Grade = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.grades.push(grade);
    return of(grade).pipe(delay(300));
  }

  // Méthodes pour les présences
  getAttendances(classroomId: string, date?: Date): Observable<Attendance[]> {
    let filtered = this.attendances.filter(a => a.classroomId === classroomId);
    if (date) {
      filtered = filtered.filter(a => 
        a.date.toDateString() === date.toDateString()
      );
    }
    return of(filtered).pipe(delay(300));
  }

  createAttendance(data: CreateAttendanceRequest): Observable<Attendance> {
    const attendance: Attendance = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.attendances.push(attendance);
    return of(attendance).pipe(delay(300));
  }
}
