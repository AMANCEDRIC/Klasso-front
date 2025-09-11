import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    // Ajouter Authorization sur les requêtes HTTP (API locales)
    let authReq = req;
    // N'attacher le token QUE pour les routes protégées (actuellement /auth/me)
    const shouldAttachAuth = req.url.includes('/auth/me');
    if (token && shouldAttachAuth && !req.headers.has('Authorization')) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Optionnel: déconnexion automatique sur 401
          // this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}


