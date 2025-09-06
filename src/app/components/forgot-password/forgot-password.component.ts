import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  email = '';
  isLoading = false;
  message = '';
  isSuccess = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Rediriger si déjà connecté
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.email) {
      this.isLoading = true;
      this.message = '';

      this.authService.forgotPassword({ email: this.email }).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.message = 'Un email de réinitialisation a été envoyé à votre adresse email.';
        },
        error: (error) => {
          this.isLoading = false;
          this.isSuccess = false;
          this.message = error.error?.message || 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
        }
      });
    } else {
      this.message = 'Veuillez saisir votre adresse email.';
      this.isSuccess = false;
    }
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }
}
