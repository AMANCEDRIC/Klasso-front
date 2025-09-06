import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  userData = {
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  };
  
  isLoading = false;
  message = '';
  isSuccess = false;
  showPassword = false;
  showConfirmPassword = false;

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
    if (this.validateForm()) {
      this.isLoading = true;
      this.message = '';

      const { confirmPassword, ...registerData } = this.userData;

      this.authService.register(registerData).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.message = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
          
          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.isSuccess = false;
          this.message = error.error?.message || 'Erreur lors de la création du compte. Veuillez réessayer.';
        }
      });
    }
  }

  private validateForm(): boolean {
    // Vérifier que tous les champs sont remplis
    if (!this.userData.email || !this.userData.firstName || 
        !this.userData.lastName || !this.userData.password || 
        !this.userData.confirmPassword) {
      this.message = 'Veuillez remplir tous les champs.';
      this.isSuccess = false;
      return false;
    }

    // Vérifier le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userData.email)) {
      this.message = 'Veuillez saisir une adresse email valide.';
      this.isSuccess = false;
      return false;
    }

    // Vérifier que les mots de passe correspondent
    if (this.userData.password !== this.userData.confirmPassword) {
      this.message = 'Les mots de passe ne correspondent pas.';
      this.isSuccess = false;
      return false;
    }

    // Vérifier la longueur du mot de passe
    if (this.userData.password.length < 6) {
      this.message = 'Le mot de passe doit contenir au moins 6 caractères.';
      this.isSuccess = false;
      return false;
    }

    return true;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
