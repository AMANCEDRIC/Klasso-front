import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Classroom, CreateClassroomRequest, Establishment } from '../../models';
import { ClassroomService } from '../../services/classroom.service';
import { EstablishmentService } from '../../services/establishment.service';

@Component({
  selector: 'app-classroom-list',
  templateUrl: './classroom-list.component.html',
  styleUrl: './classroom-list.component.css'
})
export class ClassroomListComponent implements OnInit, OnDestroy {
  establishmentId!: string;
  establishment!: Establishment;
  //establishment: Establishment | undefined;
  classrooms: Classroom[] = [];
  isLoading = false;
  error: string | null = null;

  // Gestion des modales
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;

  // Formulaires
  classroomForm: FormGroup;

  // Classe en cours d'édition/suppression
  selectedClassroom: Classroom | null = null;

  // Options pour les formulaires
  levels = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
  subjects = [
    'Mathématiques', 'Français', 'Histoire-Géographie', 'Sciences Physiques',
    'Sciences de la Vie et de la Terre', 'Anglais', 'Espagnol', 'Allemand',
    'Arts Plastiques', 'Éducation Musicale', 'Éducation Physique et Sportive',
    'Technologie', 'Informatique'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private classroomService: ClassroomService,
    private establishmentService: EstablishmentService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.classroomForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.establishmentId = params.get('establishmentId')!;
      if (this.establishmentId) {
        this.loadEstablishmentInfo();
        this.loadClassrooms();
        this.subscribeToClassrooms();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const academicYear = `${currentYear}-${nextYear}`;

    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      level: ['', [Validators.required]],
      subject: ['', [Validators.required]],
      academicYear: [academicYear, [Validators.required]]
    });
  }

  // private loadEstablishmentInfo(): void {
  //   this.establishment = this.establishmentService.getEstablishmentById(this.establishmentId);
  // }

  private loadEstablishmentInfo(): void {
    this.establishmentService.getEstablishmentById(this.establishmentId).subscribe({
      next: (response) => {
        this.establishment = response.data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement de l’établissement :", err);
      }
    });
  }

  private loadClassrooms(): void {
    this.isLoading = true;
    this.error = null;

    this.classroomService.getClassroomByEstablishmentId(this.establishmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classrooms) => {
          this.classrooms = classrooms;
          this.isLoading = false;
          console.log('Classes chargées:', classrooms);
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des classes';
          this.isLoading = false;
          console.error('Erreur:', error);
        }
      });
  }

  private subscribeToClassrooms(): void {
    // Cette méthode n'est plus nécessaire car nous chargeons directement les classes par établissement
    // Mais on la garde pour la compatibilité avec les autres fonctionnalités
    this.classroomService.classrooms$
      .pipe(takeUntil(this.destroy$))
      .subscribe(classrooms => {
        if (classrooms.length > 0) {
          this.classrooms = classrooms;
        }
      });
  }

  // Gestion des modales
  openCreateModal(): void {
    this.classroomForm.reset();
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    this.classroomForm.patchValue({
      academicYear: `${currentYear}-${nextYear}`
    });
    this.isCreateModalOpen = true;
  }

  openEditModal(classroom: Classroom): void {
    this.selectedClassroom = classroom;
    this.isLoading = true;
    
    // Récupérer les données dynamiques de la classe
    this.classroomService.getClassroomById(classroom.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classroomData) => {
          console.log('Données complètes de la classe récupérées:', classroomData);
          console.log('Champs individuels:');
          console.log('- name:', classroomData.name);
          console.log('- level:', classroomData.level);
          console.log('- subject:', classroomData.subject);
          console.log('- academicYear:', classroomData.academicYear);
          
          this.classroomForm.patchValue({
            name: classroomData.name || '',
            level: classroomData.level || '',
            subject: classroomData.subject || '',
            academicYear: classroomData.academicYear || ''
          });
          
          console.log('Valeurs du formulaire après patchValue:', this.classroomForm.value);
          this.isLoading = false;
          this.isEditModalOpen = true;
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des données de la classe:', error);
          this.error = 'Erreur lors du chargement des données de la classe';
          this.isLoading = false;
          // En cas d'erreur, utiliser les données locales comme fallback
          this.classroomForm.patchValue({
            name: classroom.name,
            level: classroom.level,
            subject: classroom.subject,
            academicYear: classroom.academicYear
          });
          this.isEditModalOpen = true;
        }
      });
  }

  openDeleteModal(classroom: Classroom): void {
    this.selectedClassroom = classroom;
    this.isDeleteModalOpen = true;
  }

  closeModals(): void {
    this.isCreateModalOpen = false;
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.selectedClassroom = null;
    this.classroomForm.reset();
  }

  // Actions CRUD
  onCreateSubmit(): void {
    if (this.classroomForm.valid) {
      this.isLoading = true;
      const formData: CreateClassroomRequest = {
        ...this.classroomForm.value,
        establishmentId: this.establishmentId
      };

      console.log('FormData dans le composant:', formData);
      console.log('EstablishmentId:', this.establishmentId);

      this.classroomService.createClassroom(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newClassroom) => {
            console.log('Classe créée reçue dans le composant:', newClassroom);
            this.isLoading = false;
            this.closeModals();
            // Recharger les classes pour voir la nouvelle classe
            this.loadClassrooms();
          },
          error: (error) => {
            this.error = 'Erreur lors de la création de la classe';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    }
  }

  onEditSubmit(): void {
    if (this.classroomForm.valid && this.selectedClassroom) {
      this.isLoading = true;
      const formData: Partial<CreateClassroomRequest> = {
        ...this.classroomForm.value,
        establishmentId: this.establishmentId
      };
      
      console.log('=== Début de la modification ===');
      console.log('ID de la classe à modifier:', this.selectedClassroom.id);
      console.log('Données du formulaire à envoyer:', formData);
      console.log('Formulaire valide:', this.classroomForm.valid);
      console.log('Erreurs du formulaire:', this.classroomForm.errors);
      
      // Vérifier chaque champ
      Object.keys(this.classroomForm.controls).forEach(key => {
        const control = this.classroomForm.get(key);
        console.log(`Champ ${key}:`, {
          value: control?.value,
          valid: control?.valid,
          errors: control?.errors
        });
      });

      this.classroomService.updateClassroom(this.selectedClassroom.id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedClassroom) => {
            console.log('Classe modifiée avec succès:', updatedClassroom);
            this.isLoading = false;
            this.closeModals();
            // Recharger les classes pour voir les modifications
            this.loadClassrooms();
          },
          error: (error) => {
            console.error('=== Erreur lors de la modification ===');
            console.error('Erreur complète:', error);
            console.error('Status:', error.status);
            console.error('Message:', error.message);
            console.error('Error body:', error.error);
            
            this.error = `Erreur lors de la modification de la classe: ${error.status} - ${error.statusText}`;
            this.isLoading = false;
          }
        });
    } else {
      console.log('=== Formulaire invalide ou classe non sélectionnée ===');
      console.log('Formulaire valide:', this.classroomForm.valid);
      console.log('Classe sélectionnée:', this.selectedClassroom);
      console.log('Erreurs du formulaire:', this.classroomForm.errors);
    }
  }

  onDelete(): void {
    if (this.selectedClassroom) {
      this.isLoading = true;

      this.classroomService.deleteClassroom(this.selectedClassroom.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.closeModals();
          },
          error: (error) => {
            this.error = 'Erreur lors de la suppression de la classe';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    }
  }

  // Navigation
  goBackToEstablishments(): void {
    this.router.navigate(['/establishments']);
  }

  viewStudents(classroom: Classroom): void {
    this.router.navigate(['/classrooms', classroom.id, 'students']);
  }

  viewGrades(classroom: Classroom): void {
    this.router.navigate(['/classrooms', classroom.id, 'grades']);
  }

  viewEvaluations(classroom: Classroom): void {
    this.router.navigate(['/classrooms', classroom.id, 'evaluations']);
  }

  viewAttendance(classroom: Classroom): void {
    this.router.navigate(['/classrooms', classroom.id, 'attendances']);
  }

  viewAttendances(classroom: Classroom): void {
    this.router.navigate(['/classrooms', classroom.id, 'attendances']);
  }

  viewClassroomOverview(classroom: Classroom): void {
    this.router.navigate(['/classrooms', classroom.id, 'overview']);
  }

  // Helpers pour le template
  getFieldError(fieldName: string): string | null {
    const field = this.classroomForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors?.['minlength']) {
        return 'Ce champ doit contenir au moins 2 caractères';
      }
    }
    return null;
  }

  clearError(): void {
    this.error = null;
  }
}
