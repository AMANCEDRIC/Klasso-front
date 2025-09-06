import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  message = '';
  isSuccess = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.message = 'Token de réinitialisation manquant ou invalide.';
        this.isSuccess = false;
      }
    });

    // Rediriger si déjà connecté
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.newPassword && this.confirmPassword) {
      if (this.newPassword !== this.confirmPassword) {
        this.message = 'Les mots de passe ne correspondent pas.';
        this.isSuccess = false;
        return;
      }

      if (this.newPassword.length < 6) {
        this.message = 'Le mot de passe doit contenir au moins 6 caractères.';
        this.isSuccess = false;
        return;
      }

      this.isLoading = true;
      this.message = '';

      this.authService.resetPassword({
        token: this.token,
        newPassword: this.newPassword
      }).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.message = 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.';
          // Rediriger vers la page de connexion après 3 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.isSuccess = false;
          this.message = error.error?.message || 'Erreur lors de la réinitialisation. Le token est peut-être expiré.';
        }
      });
    } else {
      this.message = 'Veuillez remplir tous les champs.';
      this.isSuccess = false;
    }
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }
}
