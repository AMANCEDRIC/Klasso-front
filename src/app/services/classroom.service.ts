import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Classroom, CreateClassroomRequest } from '../models';
import { FakeBackendService } from './fake-backend.service';
import { AuthService } from './auth.service';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClassroomService {
  private classroomsSubject = new BehaviorSubject<Classroom[]>([]);
  public classrooms$ = this.classroomsSubject.asObservable();
  private apiUrl = 'http://localhost:8081/api/classrooms';

  constructor(
    private fakeBackend: FakeBackendService,
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  loadClassrooms(establishmentId: string): Observable<Classroom[]> {
    return this.getClassroomByEstablishmentId(establishmentId).pipe(
      tap(classrooms => {
        this.classroomsSubject.next(classrooms);
      })
    );
  }

  // getClassrooms(): Observable<Classroom[]> {
  //   return this.classrooms$;
  // }

  getClassrooms():Observable<Classroom[]>{
    return this.http.get<Classroom[]>(this.apiUrl).pipe(map((response: any) => response.data))
  }

  createClassroom(data: CreateClassroomRequest): Observable<Classroom> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    console.log('Données envoyées pour création:', { ...data, userId: currentUser.id });

    return this.http.post<Classroom>(this.apiUrl, { ...data, userId: currentUser.id }).pipe(
      map((response: any) => response.data || response),
      tap(newClassroom => {
        console.log('Classe créée:', newClassroom);
        const currentClassrooms = this.classroomsSubject.value;
        this.classroomsSubject.next([...currentClassrooms, newClassroom]);
      })
    );
  }

  updateClassroom(id: string, data: Partial<CreateClassroomRequest>): Observable<Classroom> {
    return this.http.put<Classroom>(`${this.apiUrl}/${id}`, data).pipe(
      map((response: any) => response.data || response),
      tap(updatedClassroom => {
        const currentClassrooms = this.classroomsSubject.value;
        const index = currentClassrooms.findIndex(c => c.id === id);
        if (index !== -1) {
          currentClassrooms[index] = updatedClassroom;
          this.classroomsSubject.next([...currentClassrooms]);
        }
      })
    );
  }

  deleteClassroom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentClassrooms = this.classroomsSubject.value;
        const filtered = currentClassrooms.filter(c => c.id !== id);
        this.classroomsSubject.next(filtered);
      })
    );
  }

  getClassroomById(id: string): Observable<Classroom> {
    return this.http.get<Classroom>(`${this.apiUrl}/${id}`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getClassroomByEstablishmentId(establishmentId: string): Observable<Classroom[]> {
    return this.http.get<Classroom[]>(`${this.apiUrl}/establishment/${establishmentId}`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getClassroomByIdObservable(id: string): Observable<Classroom | null> {
    return this.classrooms$.pipe(
      map(classrooms => classrooms.find(c => c.id === id) || null)
    );
  }
}
