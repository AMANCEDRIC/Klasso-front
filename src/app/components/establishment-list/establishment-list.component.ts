import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Establishment, CreateEstablishmentRequest } from '../../models';
import { EstablishmentService } from '../../services/establishment.service';

@Component({
  selector: 'app-establishment-list',
  templateUrl: './establishment-list.component.html',
  styleUrl: './establishment-list.component.css'
})
export class EstablishmentListComponent implements OnInit, OnDestroy {
  establishments: Establishment[] = [];
  isLoading = false;
  error: string | null = null;

  // Gestion des modales
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;

  // Formulaires
  establishmentForm: FormGroup;

  // Établissement en cours d'édition/suppression
  selectedEstablishment: Establishment | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private establishmentService: EstablishmentService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.establishmentForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadEstablishments();
    this.subscribeToEstablishments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      country: ['France', [Validators.required]]
    });
  }

  private loadEstablishments(): void {
    this.isLoading = true;
    this.error = null;

    this.establishmentService.loadEstablishments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des établissements';
          this.isLoading = false;
          console.error('Erreur:', error);
        }
      });
  }

  private subscribeToEstablishments(): void {
    this.establishmentService.establishments$
      .pipe(takeUntil(this.destroy$))
      .subscribe(establishments => {
        console.log('Établissements mis à jour:', establishments);
        this.establishments = establishments;
      });
  }

  // Gestion des modales
  openCreateModal(): void {
    this.establishmentForm.reset();
    this.establishmentForm.patchValue({ country: 'cote d\'ivoire' });
    this.isCreateModalOpen = true;
  }

  openEditModal(establishment: Establishment): void {
    this.selectedEstablishment = establishment;
    this.establishmentForm.patchValue({
      name: establishment.name,
      address: establishment.address,
      city: establishment.city,
      postalCode: establishment.postalCode,
      country: establishment.country
    });
    this.isEditModalOpen = true;
  }

  openDeleteModal(establishment: Establishment): void {
    this.selectedEstablishment = establishment;
    this.isDeleteModalOpen = true;
  }

  closeModals(): void {
    this.isCreateModalOpen = false;
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.selectedEstablishment = null;
    this.establishmentForm.reset();
  }

  // Actions CRUD
  onCreateSubmit(): void {
    if (this.establishmentForm.valid) {
      this.isLoading = true;
      const formData: CreateEstablishmentRequest = this.establishmentForm.value;

      this.establishmentService.createEstablishment(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.closeModals();
          },
          error: (error) => {
            this.error = 'Erreur lors de la création de l\'établissement';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    }
  }

  onEditSubmit(): void {
    if (this.establishmentForm.valid && this.selectedEstablishment) {
      this.isLoading = true;
      const formData: Partial<CreateEstablishmentRequest> = this.establishmentForm.value;

      this.establishmentService.updateEstablishment(this.selectedEstablishment.id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.closeModals();
          },
          error: (error) => {
            this.error = 'Erreur lors de la modification de l\'établissement';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    }
  }

  onDelete(): void {
    if (this.selectedEstablishment) {
      this.isLoading = true;

      this.establishmentService.deleteEstablishment(this.selectedEstablishment.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.closeModals();
          },
          error: (error) => {
            this.error = 'Erreur lors de la suppression de l\'établissement';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    }
  }

  // Navigation
  viewClassrooms(establishment: Establishment): void {
    this.router.navigate(['/establishments', establishment.id, 'classrooms']);
  }

  // Helpers pour le template
  getFieldError(fieldName: string): string | null {
    const field = this.establishmentForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors?.['minlength']) {
        return 'Ce champ doit contenir au moins 2 caractères';
      }
      if (field.errors?.['pattern']) {
        return 'Format invalide (5 chiffres requis)';
      }
    }
    return null;
  }

  clearError(): void {
    this.error = null;
  }
}
