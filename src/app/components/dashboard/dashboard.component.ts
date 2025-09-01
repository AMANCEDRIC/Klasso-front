import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EstablishmentService } from '../../services/establishment.service';
import { User, Establishment } from '../../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  establishments: Establishment[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  // Statistiques pour le dashboard
  stats = {
    totalEstablishments: 0,
    totalClasses: 0,
    totalStudents: 0,
    weeklyActivity: 0
  };

  // Exposer Math pour le template
  Math = Math;

  constructor(
    private authService: AuthService,
    private establishmentService: EstablishmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    // Récupérer l'utilisateur actuel
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    // Charger les établissements
    this.establishmentService.loadEstablishments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (establishments) => {
          this.establishments = establishments;
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des données:', error);
          this.isLoading = false;
        }
      });
  }

  private calculateStats(): void {
    this.stats.totalEstablishments = this.establishments.length;
    // Pour la démo, on simule des données
    this.stats.totalClasses = this.establishments.length * 3; // 3 classes par établissement en moyenne
    this.stats.totalStudents = this.stats.totalClasses * 25; // 25 élèves par classe en moyenne
    this.stats.weeklyActivity = Math.floor(Math.random() * 50) + 20; // Activité simulée
  }

  navigateToEstablishments(): void {
    this.router.navigate(['/establishments']);
  }

  navigateToReports(): void {
    this.router.navigate(['/reports']);
  }

  navigateToEstablishment(establishmentId: string): void {
    this.router.navigate(['/establishments', establishmentId, 'classrooms']);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Bonjour';
    } else if (hour < 18) {
      return 'Bon après-midi';
    } else {
      return 'Bonsoir';
    }
  }

  getCurrentDate(): string {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('fr-FR', options);
  }
}
