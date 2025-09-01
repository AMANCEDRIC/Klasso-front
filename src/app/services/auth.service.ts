import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, AuthResponse } from '../models';
import { FakeBackendService } from './fake-backend.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor(
    private fakeBackend: FakeBackendService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Vérifier si un token existe dans le localStorage au démarrage (seulement côté client)
    if (isPlatformBrowser(this.platformId)) {
      this.checkStoredAuth();
    }
  }

  private checkStoredAuth(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem('klaso_token');
    if (token) {
      this.tokenSubject.next(token);
      this.fakeBackend.getCurrentUser(token).subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
        },
        error: () => {
          // Token invalide, on le supprime
          this.logout();
        }
      });
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.fakeBackend.login(credentials).pipe(
      tap(response => {
        // Stocker le token et l'utilisateur (seulement côté client)
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('klaso_token', response.token);
        }
        this.tokenSubject.next(response.token);
        this.currentUserSubject.next(response.user);
      }),
      catchError(error => {
        console.error('Erreur de connexion:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Supprimer le token et nettoyer l'état
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('klaso_token');
    }
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}
