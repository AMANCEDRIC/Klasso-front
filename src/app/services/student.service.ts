import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import {map, tap} from 'rxjs/operators';
import { Student, CreateStudentRequest } from '../models';
import { FakeBackendService } from './fake-backend.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private studentsSubject = new BehaviorSubject<Student[]>([]);
  public students$ = this.studentsSubject.asObservable();
  public apiUrl = 'http://localhost:8081/api/students';

  constructor(private fakeBackend: FakeBackendService, private http: HttpClient) {}

  // Charge les élèves d'une classe et met à jour le BehaviorSubject
  loadStudents(classroomId: string): Observable<Student[]> {
    return this.getStudentsByClassroom(classroomId).pipe(
      tap(students => {
        console.log('Mise à jour du BehaviorSubject avec les élèves:', students);
        this.studentsSubject.next(students);
      })
    );
  }

  // getStudents(): Observable<Student[]> {
  //   return this.students$;
  // }

  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.apiUrl).pipe(map((response: any) => response.data || response));
  }

  getStudentsByClassroom(classroomId: string): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/classroom/${classroomId}`)
      .pipe(
        map((response: any) => response.data || response),
        tap(students => console.log('Élèves récupérés de l\'API pour la classe', classroomId, ':', students))
      );
  }

  createStudent(data: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, data).pipe(
      map((response: any) => response.data || response),
      tap(newStudent => {
        console.log('Nouvel élève créé:', newStudent);
        const currentStudents = this.studentsSubject.value;
        this.studentsSubject.next([...currentStudents, newStudent]);
      })
    );
  }

  updateStudent(id:string, data: Partial<CreateStudentRequest>): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${id}`, data).pipe(
      map((response: any) => response.data || response),
      tap(updatedStudent => {
        console.log('Élève mis à jour:', updatedStudent);
        const students = this.studentsSubject.value;
        const index = students.findIndex(s => s.id === id);
        if (index !== -1) {
          students[index] = updatedStudent;
          this.studentsSubject.next([...students]);
        }
      })
    );
  }

  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('Élève supprimé, ID:', id);
        const students = this.studentsSubject.value;
        const filtered = students.filter(s => s.id !== id);
        this.studentsSubject.next(filtered);
      })
    );
  }

  getStudentById(id: string): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${id}`).pipe(
      map((response: any) => response.data || response),
      tap(student => console.log('Élève récupéré par ID:', id, student))
    );
  }

  // getStudentById(id: string): Student | undefined {
  //   return this.studentsSubject.value.find(s => s.id === id);
  // }



 /* getStudentsByClassroom(classroomId: string): Student[] {
    return this.studentsSubject.value.filter(s => s.classroomId === classroomId && s.isActive);
  }*/
}
