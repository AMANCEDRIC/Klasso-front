import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import {map, tap} from 'rxjs/operators';
import { Establishment, CreateEstablishmentRequest } from '../models';
import { FakeBackendService } from './fake-backend.service';
import { AuthService } from './auth.service';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstablishmentService {
  private establishmentsSubject = new BehaviorSubject<Establishment[]>([]);
  public establishments$ = this.establishmentsSubject.asObservable();

  //private apiUrl='http://localhost:8081/api/establishments';
  private apiUrl = environment.apiUrl;

  constructor(
    private http:HttpClient,
    private fakeBackend: FakeBackendService,
    private authService: AuthService
  ) {}

  loadEstablishments(): Observable<Establishment[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    // return this.fakeBackend.getEstablishments(currentUser.id).pipe(
    //   tap(establishments => {
    //     this.establishmentsSubject.next(establishments);
    //   })
    // );

    return this.getEstablishments().pipe(
      tap(establishments => {
        this.establishmentsSubject.next(establishments);
      })
    );
  }

  // getEstablishments(): Observable<Establishment[]> {
  //   return this.establishments$;
  // }

  getEstablishments(): Observable<Establishment[]> {
    return this.http.get<Establishment[]>(`${this.apiUrl}/establishments`).pipe(map((response: any) => response.data));
  }

  // createEstablishment(data: CreateEstablishmentRequest): Observable<Establishment> {
  //   const currentUser = this.authService.getCurrentUser();
  //   if (!currentUser) {
  //     throw new Error('Utilisateur non connecté');
  //   }
  //
  //   return this.fakeBackend.createEstablishment({ ...data, userId: currentUser.id }).pipe(
  //     tap(newEstablishment => {
  //       const currentEstablishments = this.establishmentsSubject.value;
  //       this.establishmentsSubject.next([...currentEstablishments, newEstablishment]);
  //     })
  //   );
  // }

  createEstablishment(data: CreateEstablishmentRequest): Observable<Establishment> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    return this.http.post<Establishment>(`${this.apiUrl}/establishments`, { ...data, userId: currentUser.id }).pipe(
      map((response: any) => response.data || response),
      tap(newEstablishment => {
        console.log('Nouvel établissement créé:', newEstablishment);
        const currentEstablishments = this.establishmentsSubject.value;
        this.establishmentsSubject.next([...currentEstablishments, newEstablishment]);
      })
    );
  }

  // updateEstablishment(id: string, data: Partial<CreateEstablishmentRequest>): Observable<Establishment> {
  //   return this.fakeBackend.updateEstablishment(id, data).pipe(
  //     tap(updatedEstablishment => {
  //       const currentEstablishments = this.establishmentsSubject.value;
  //       const index = currentEstablishments.findIndex(e => e.id === id);
  //       if (index !== -1) {
  //         currentEstablishments[index] = updatedEstablishment;
  //         this.establishmentsSubject.next([...currentEstablishments]);
  //       }
  //     })
  //   );
  // }

  updateEstablishment(id: string, data: Partial<CreateEstablishmentRequest>): Observable<Establishment> {
    return this.http.put<Establishment>(`${this.apiUrl}/establishments/${id}`, data).pipe(
      map((response: any) => response.data || response),
      tap(updatedEstablishment => {
        console.log('Établissement modifié:', updatedEstablishment);
        const currentEstablishments = this.establishmentsSubject.value;
        const index = currentEstablishments.findIndex(e => e.id === id);
        if (index !== -1) {
          currentEstablishments[index] = updatedEstablishment;
          this.establishmentsSubject.next([...currentEstablishments]);
        }
      })
    );
  }

  // deleteEstablishment(id: string): Observable<void> {
  //   return this.fakeBackend.deleteEstablishment(id).pipe(
  //     tap(() => {
  //       const currentEstablishments = this.establishmentsSubject.value;
  //       const filtered = currentEstablishments.filter(e => e.id !== id);
  //       this.establishmentsSubject.next(filtered);
  //     })
  //   );
  // }

  deleteEstablishment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/establishments/${id}`).pipe(
      tap(() => {
        console.log('Établissement supprimé, ID:', id);
        const currentEstablishments = this.establishmentsSubject.value;
        const filtered = currentEstablishments.filter(e => e.id !== id);
        this.establishmentsSubject.next(filtered);
      })
    );
  }

  // getEstablishmentById(id: string): Establishment | undefined {
  //   return this.establishmentsSubject.value.find(e => e.id === id);
  // }

  getEstablishmentById(id:String):Observable<{ data:Establishment }>{
  return this.http.get<{ data:Establishment }>(`${this.apiUrl}/establishments/${id}`)
  }
}
