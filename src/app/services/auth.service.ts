import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map, tap, catchError, throwError, switchMap, of } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginResponse,
  RegisterResponse,
  ProfileResponse,
  ApiResponse,
  AuthResponse
} from '../models';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  //private readonly API_BASE_URL = 'http://localhost:8081/api';
  private readonly API_BASE_URL = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor(
    private http: HttpClient,
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
      // Ne pas appeler le backend ici pour éviter 401 qui déconnecte
      // Décoder le token local et initialiser l'utilisateur
      try {
        this.tokenSubject.next(token);
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: payload.id,
          email: payload.email,
          firstName: payload.name?.split(' ')[0] || 'Utilisateur',
          lastName: payload.name?.split(' ')[1] || '',
          createdAt: new Date(payload.iat * 1000).toISOString(),
          updatedAt: new Date(payload.iat * 1000).toISOString()
        } as unknown as User;
        this.currentUserSubject.next(user);
      } catch (e) {
        // Si le token est corrompu
        this.logout();
      }
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<LoginResponse>(`${this.API_BASE_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.status === 200 && response.data) {
          // Debug: afficher le token complet
          console.log('Token reçu:', response.data);
          console.log('Longueur du token:', response.data.length);

          // Stocker le token
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('klaso_token', response.data);
          }
          this.tokenSubject.next(response.data);
        }
      }),
      switchMap(response => {
        if (response.status === 200 && response.data) {
          // Solution temporaire : créer un utilisateur à partir du token JWT
          // Décoder le token JWT pour extraire les informations utilisateur
          try {
            const tokenPayload = JSON.parse(atob(response.data.split('.')[1]));
            const user: User = {
              id: tokenPayload.id,
              email: tokenPayload.email,
              firstName: tokenPayload.name?.split(' ')[0] || 'Utilisateur',
              lastName: tokenPayload.name?.split(' ')[1] || '',
              createdAt: new Date(tokenPayload.iat * 1000).toISOString(),
              updatedAt: new Date(tokenPayload.iat * 1000).toISOString()
            };

            this.currentUserSubject.next(user);

            return of({
              user: user,
              token: response.data
            });
          } catch (error) {
            console.error('Erreur décodage token:', error);
            // Fallback : essayer de récupérer le profil
            return this.getProfile().pipe(
              map(user => ({
                user: user,
                token: response.data
              }))
            );
          }
        } else {
          throw new Error('Connexion échouée');
        }
      }),
      catchError(error => {
        console.error('Erreur de connexion:', error);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<RegisterResponse>(`${this.API_BASE_URL}/auth/register`, userData).pipe(
      map(response => {
        if (response.status === 201 && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Erreur lors de l\'inscription');
      }),
      catchError(error => {
        console.error('Erreur d\'inscription:', error);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: ForgotPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_BASE_URL}/auth/forgot-password`, email).pipe(
      catchError(error => {
        console.error('Erreur mot de passe oublié:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(resetData: ResetPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_BASE_URL}/auth/reset-password`, resetData).pipe(
      catchError(error => {
        console.error('Erreur réinitialisation mot de passe:', error);
        return throwError(() => error);
      })
    );
  }

  getProfile(): Observable<User> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Aucun token disponible'));
    }

    const headers = this.getAuthHeaders();
    console.log('Headers envoyés pour /auth/me:', headers);
    console.log('Headers keys:', headers.keys());
    console.log('Authorization header:', headers.get('Authorization'));
    console.log('Token utilisé:', token);

    return this.http.get<ProfileResponse>(`${this.API_BASE_URL}/auth/me`, {
      headers: headers
    }).pipe(
      map(response => {
        if (response.status === 200 && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Erreur lors de la récupération du profil');
      }),
      catchError(error => {
        console.error('Erreur récupération profil:', error);
        // Si le token est invalide, on se déconnecte
        if (error.status === 401) {
          this.logout();
        }
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
