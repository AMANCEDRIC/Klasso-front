import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: ''
  };
  
  isLoading = false;
  loginError = '';
  showPassword = false;

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
    if (this.credentials.email && this.credentials.password) {
      this.isLoading = true;
      this.loginError = '';

      this.authService.login(this.credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.loginError = error.message || 'Erreur de connexion. Veuillez réessayer.';
        }
      });
    } else {
      this.loginError = 'Veuillez remplir tous les champs.';
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
