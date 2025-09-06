import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Grade, CreateGradeRequest, StudentAverage } from '../models';
import { FakeBackendService } from './fake-backend.service';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private gradesSubject = new BehaviorSubject<Grade[]>([]);
  public grades$ = this.gradesSubject.asObservable();
  private apiUrl = 'http://localhost:8081/api/grades';

  constructor(
    private fakeBackend: FakeBackendService,
    private  http: HttpClient
  ) {}

  loadGrades(classroomId: string): Observable<Grade[]> {
    return this.fakeBackend.getGrades(classroomId).pipe(
      tap(grades => {
        this.gradesSubject.next(grades);
      })
    );
  }

  loadStudentGrades(studentId: string): Observable<Grade[]> {
    return this.fakeBackend.getStudentGrades(studentId).pipe(
      tap(grades => {
        // Mettre à jour seulement les notes de cet élève
        const currentGrades = this.gradesSubject.value;
        const otherGrades = currentGrades.filter(g => g.studentId !== studentId);
        this.gradesSubject.next([...otherGrades, ...grades]);
      })
    );
  }

  // getGrades(): Observable<Grade[]> {
  //   return this.grades$;
  // }

  getGrades():Observable<Grade[]>{
    return this.http.get<Grade[]>(this.apiUrl).pipe(map((response: any) => response.data || response));
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
    return this.http.post<Grade>(this.apiUrl, data).pipe(map((response: any) => response.data || response),
      tap(newGrade => {
              const currentGrades = this.gradesSubject.value;
              this.gradesSubject.next([...currentGrades, newGrade]);
      }))
  }


  // getGradesByStudent(studentId: string): Grade[] {
  //   return this.gradesSubject.value.filter(g => g.studentId === studentId);
  // }


  getGradesByStudent(studentId: string):Observable <Grade[]> {
    return this.http.get<Grade[]>( `${this.apiUrl}/student/${studentId}`).pipe(map((response: any) => response.data || response));
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
}
