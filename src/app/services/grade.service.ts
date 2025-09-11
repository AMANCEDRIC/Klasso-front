import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';
import { Grade, CreateGradeRequest, StudentAverage } from '../models';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private gradesSubject = new BehaviorSubject<Grade[]>([]);
  public grades$ = this.gradesSubject.asObservable();
  private apiUrl = 'http://localhost:8081/api/grades';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Helpers
  // Les endpoints grades ne sont pas protégés côté backend pour l'instant → pas d'Authorization

  private mapDtoToGrade(dto: any): Grade {
    return {
      id: String(dto.id),
      value: dto.value,
      maxValue: dto.maxValue,
      coefficient: dto.coefficient,
      // gradeType from backend is string; keep as-is if matches enum values elsewhere
      gradeType: dto.gradeType,
      subject: dto.subject,
      description: dto.description ?? undefined,
      gradeDate: dto.gradeDate ? new Date(dto.gradeDate) : new Date(),
      studentId: dto.studentId != null ? String(dto.studentId) : '',
      classroomId: dto.classroomId != null ? String(dto.classroomId) : '',
      studentFirstName: dto.studentFirstName ?? null,
      studentLastName: dto.studentLastName ?? null,
      classroomName: dto.classroomName ?? null,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date()
    } as unknown as Grade;
  }

  private fromApi<T>(obs: Observable<any>): Observable<T> {
    return obs.pipe(map((response: any) => (response && response.data !== undefined ? response.data : response)));
  }

  // API calls
  loadGrades(classroomId: string): Observable<Grade[]> {
    return this.fromApi<Grade[]>(
      this.http.get(`${this.apiUrl}/classroom/${classroomId}`)
    ).pipe(
      map((list: any[]) => (list || []).map((g) => this.mapDtoToGrade(g))),
      tap((grades) => this.gradesSubject.next(grades))
    );
  }

  loadStudentGrades(studentId: string): Observable<Grade[]> {
    return this.fromApi<Grade[]>(
      this.http.get(`${this.apiUrl}/student/${studentId}`)
    ).pipe(
      map((list: any[]) => (list || []).map((g) => this.mapDtoToGrade(g))),
      tap((grades) => {
        const currentGrades = this.gradesSubject.value;
        const otherGrades = currentGrades.filter(g => g.studentId !== studentId);
        this.gradesSubject.next([...otherGrades, ...grades]);
      })
    );
  }

  // getGrades(): Observable<Grade[]> {
  //   return this.grades$;
  // }

  getGrades(): Observable<Grade[]> {
    return this.fromApi<any[]>(
      this.http.get(this.apiUrl)
    ).pipe(map((list) => (list || []).map((g) => this.mapDtoToGrade(g))));
  }

  // createGrade(data: CreateGradeRequest): Observable<Grade> {
  //   return this.fakeBackend.createGrade(data).pipe(
  //     tap(newGrade => {
  //       const currentGrades = this.gradesSubject.value;
  //       this.gradesSubject.next([...currentGrades, newGrade]);
  //     })
  //   );
  // }

  createGrade(data: CreateGradeRequest): Observable<Grade> {
    const payload = {
      value: data.value,
      maxValue: data.maxValue,
      coefficient: data.coefficient,
      gradeType: data.gradeType, // backend expects string
      subject: data.subject,
      description: data.description ?? null,
      gradeDate: this.formatDateYYYYMMDD(data.gradeDate),
      studentId: data.studentId ? Number(data.studentId) : null,
      classroomId: data.classroomId ? Number(data.classroomId) : null
    };
    return this.fromApi<any>(
      this.http.post(this.apiUrl, payload)
    ).pipe(
      map((dto) => this.mapDtoToGrade(dto)),
      tap((newGrade) => {
        const currentGrades = this.gradesSubject.value;
        this.gradesSubject.next([...currentGrades, newGrade]);
      })
    );
  }

  updateGrade(id: string, data: Partial<CreateGradeRequest>): Observable<Grade> {
    const payload: any = {
      value: data.value,
      maxValue: data.maxValue,
      coefficient: data.coefficient,
      gradeType: data.gradeType,
      subject: data.subject,
      description: data.description ?? null,
      gradeDate: data.gradeDate ? this.formatDateYYYYMMDD(data.gradeDate) : undefined
    };
    if (data.classroomId) {
      payload.classroom = { id: Number(data.classroomId) };
    }
    return this.fromApi<any>(
      this.http.put(`${this.apiUrl}/${id}`, payload)
    ).pipe(
      map((dto) => this.mapDtoToGrade(dto)),
      tap((updated) => {
        const list = this.gradesSubject.value.map((g) => (g.id === updated.id ? updated : g));
        this.gradesSubject.next(list);
      })
    );
  }

  deleteGrade(id: string): Observable<void> {
    return this.fromApi<any>(
      this.http.delete(`${this.apiUrl}/${id}`)
    ).pipe(
      tap(() => {
        const list = this.gradesSubject.value.filter((g) => g.id !== id);
        this.gradesSubject.next(list);
      })
    );
  }


  // getGradesByStudent(studentId: string): Grade[] {
  //   return this.gradesSubject.value.filter(g => g.studentId === studentId);
  // }


  getGradesByStudent(studentId: string): Observable<Grade[]> {
    return this.fromApi<any[]>(
      this.http.get(`${this.apiUrl}/student/${studentId}`)
    ).pipe(map((list) => (list || []).map((g) => this.mapDtoToGrade(g))));
  }

  getGradesByStudentInClass(studentId: string, classroomId: string): Observable<Grade[]> {
    return this.fromApi<any[]>(
      this.http.get(`${this.apiUrl}/student/${studentId}/classroom/${classroomId}`)
    ).pipe(map((list) => (list || []).map((g) => this.mapDtoToGrade(g))));
  }


  getGradesByClassroom(classroomId: string): Grade[] {
    return this.gradesSubject.value.filter(g => g.classroomId === classroomId);
  }

  calculateStudentAverage(studentId: string): StudentAverage {
    let studentAverage: StudentAverage = {
      studentId,
      average: 0,
      totalGrades: 0
    };

    const studentGrades = this.getGradesByStudent(studentId);

    studentGrades.subscribe(grades => {
      if (grades.length === 0) {
        return;
      }

      // Calcul de la moyenne pondérée
      let totalPoints = 0;
      let totalCoefficients = 0;

      grades.forEach(grade => {
        const percentage = (grade.value / grade.maxValue) * 20; // Convertir sur 20
        totalPoints += percentage * grade.coefficient;
        totalCoefficients += grade.coefficient;
      });

      const average = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;

      studentAverage = {
        studentId,
        average: Math.round(average * 100) / 100, // Arrondir à 2 décimales
        totalGrades: grades.length
      };
    });

    return studentAverage;
  }

  calculateClassroomAverages(classroomId: string): StudentAverage[] {
    const classroomGrades = this.getGradesByClassroom(classroomId);
    const studentIds = [...new Set(classroomGrades.map(g => g.studentId))];

    return studentIds.map(studentId => this.calculateStudentAverage(studentId));
  }

  getClassroomGeneralAverage(classroomId: string): number {
    const studentAverages = this.calculateClassroomAverages(classroomId);

    if (studentAverages.length === 0) return 0;

    const sum = studentAverages.reduce((acc, curr) => acc + curr.average, 0);
    return Math.round((sum / studentAverages.length) * 100) / 100;
  }

  private formatDateYYYYMMDD(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
