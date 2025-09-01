import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Student, CreateStudentRequest, Classroom } from '../../models';
import { StudentService } from '../../services/student.service';
import { ClassroomService } from '../../services/classroom.service';

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.css'
})
export class StudentListComponent implements OnInit, OnDestroy {
  classroomId!: string;
  //classroom: Classroom | undefined;
  classroom!: Classroom;
  students: Student[] = [];
  isLoading = false;
  error: string | null = null;

  // Gestion des modales
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  isViewModalOpen = false;

  // Formulaires
  studentForm: FormGroup;

  // Élève en cours d'édition/suppression/visualisation
  selectedStudent: Student | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private studentService: StudentService,
    private classroomService: ClassroomService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.studentForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.classroomId = params.get('classroomId')!;
      if (this.classroomId) {
        this.loadClassroomInfo();
        this.loadStudents();
        this.subscribeToStudents(); // S'abonner aux mises à jour
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      parentName: [''],
      parentEmail: ['', [Validators.email]],
      parentPhone: ['', [Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  // private loadClassroomInfo(): void {
  //   this.classroomService.getClassroomById(this.classroomId)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe(classroom => {
  //       this.classroom = classroom;
  //     });
  // }

  private loadClassroomInfo(): void {
    this.classroomService.getClassroomById(this.classroomId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classroom) => {
          this.classroom = classroom;
          console.log('Classe chargée:', classroom);
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement de la classe';
          console.error('Erreur:', error);
        }
      });
  }


  private loadStudents(): void {
    this.isLoading = true;
    this.error = null;

    this.studentService.getStudentsByClassroom(this.classroomId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (students) => {
          this.students = students;
          this.isLoading = false;
          console.log('Élèves chargés:', students);
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des élèves';
          this.isLoading = false;
          console.error('Erreur:', error);
        }
      });
  }

  // Méthode pour s'abonner aux mises à jour des élèves (utilisée après CRUD)
  private subscribeToStudents(): void {
    this.studentService.students$
      .pipe(takeUntil(this.destroy$))
      .subscribe(students => {
        if (students.length > 0) {
          this.students = students;
        }
      });
  }

  // Gestion des modales
  openCreateModal(): void {
    this.studentForm.reset();
    this.isCreateModalOpen = true;
  }

  // openEditModal(student: Student): void {
  //   this.selectedStudent = student;
  //   this.isLoading = true;
  //
  //   this.studentService.getStudentById(student.id).subscribe({
  //     next: (studentData) => {
  //       this.studentForm.patchValue({
  //         firstName: studentData.firstName,
  //         lastName: studentData.lastName,
  //         dateOfBirth: this.formatDateForInput(studentData.dateOfBirth),
  //         email: studentData.email || '',
  //         phone: studentData.phone || '',
  //         parentName: studentData.parentName || '',
  //         parentEmail: studentData.parentEmail || '',
  //         parentPhone: studentData.parentPhone || ''
  //       });
  //
  //       this.isLoading = false;
  //     },
  //     error: (error) => {
  //       this.error = 'Erreur lors de la récupération des informations de l\'élève';
  //       console.error('Erreur:', error);
  //     }
  //   })
  //
  //   this.studentForm.patchValue({
  //     firstName: student.firstName,
  //     lastName: student.lastName,
  //     dateOfBirth: this.formatDateForInput(student.dateOfBirth),
  //     email: student.email || '',
  //     phone: student.phone || '',
  //     parentName: student.parentName || '',
  //     parentEmail: student.parentEmail || '',
  //     parentPhone: student.parentPhone || ''
  //   });
  //   this.isEditModalOpen = true;
  // }

  openEditModal(student: Student): void {
    this.selectedStudent = student;
    this.isLoading = true;
    this.isEditModalOpen = true;

    this.studentService.getStudentById(student.id).subscribe({
      next: (studentData) => {
        this.patchStudentForm(studentData);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des informations de l\'élève:', error);
        this.error = 'Erreur lors de la récupération des informations de l\'élève';

        // Utiliser les données locales comme fallback
        this.patchStudentForm(student);
        this.isLoading = false;
      }
    });
  }

  private patchStudentForm(data: Student): void {
    this.studentForm.patchValue({
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: this.formatDateForInput(data.dateOfBirth),
      email: data.email || '',
      phone: data.phone || '',
      parentName: data.parentName || '',
      parentEmail: data.parentEmail || '',
      parentPhone: data.parentPhone || ''
    });
  }

  openDeleteModal(student: Student): void {
    this.selectedStudent = student;
    this.isDeleteModalOpen = true;
  }

  openViewModal(student: Student): void {
    this.selectedStudent = student;
    this.isViewModalOpen = true;
  }

  closeModals(): void {
    this.isCreateModalOpen = false;
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.isViewModalOpen = false;
    this.selectedStudent = null;
    this.studentForm.reset();
  }

  // Actions CRUD
  onCreateSubmit(): void {
    if (this.studentForm.valid) {
      this.isLoading = true;
      const formData: CreateStudentRequest = {
        ...this.studentForm.value,
        dateOfBirth: new Date(this.studentForm.value.dateOfBirth),
        classroomId: this.classroomId
      };

      this.studentService.createStudent(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newStudent) => {
            this.isLoading = false;
            this.closeModals();
            this.loadStudents()
            console.log('Élève créé avec succès:', newStudent);
          },
          error: (error) => {
            this.error = 'Erreur lors de la création de l\'élève';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    }
  }

  onEditSubmit(): void {
    if (this.studentForm.valid && this.selectedStudent) {
      this.isLoading = true;
      this.error = null;

      const formData: CreateStudentRequest = {
        ...this.studentForm.value,
        dateOfBirth: new Date(this.studentForm.value.dateOfBirth),
        classroomId: this.classroomId
      };

      this.studentService.updateStudent(this.selectedStudent.id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedStudent) => {
            this.isLoading = false;
            this.closeModals();
            this.loadStudents()
            console.log('Élève modifié avec succès:', updatedStudent);
          },
          error: (error) => {
            this.error = 'Erreur lors de la modification de l\'élève';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    }
  }

  onDelete(): void {
    if (this.selectedStudent) {
      this.isLoading = true;
      this.error = null;

      this.studentService.deleteStudent(this.selectedStudent.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.closeModals();
            console.log('Élève supprimé avec succès');
            this.loadStudents();
          },
          error: (error) => {
            this.error = 'Erreur lors de la suppression de l\'élève';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    }
  }

  // Navigation
  goBackToClassrooms(): void {
    // Récupérer l'establishmentId depuis la classe
    if (this.classroom) {
      this.router.navigate(['/establishments', this.classroom.establishmentId, 'classrooms']);
    }
  }

  viewGrades(student: Student): void {
    this.router.navigate(['/classrooms', this.classroomId, 'grades'], {
      queryParams: { studentId: student.id }
    });
  }

  viewAttendance(student: Student): void {
    this.router.navigate(['/classrooms', this.classroomId, 'attendance'], {
      queryParams: { studentId: student.id }
    });
  }

  // Helpers pour le template
  getFieldError(fieldName: string): string | null {
    const field = this.studentForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors?.['minlength']) {
        return 'Ce champ doit contenir au moins 2 caractères';
      }
      if (field.errors?.['email']) {
        return 'Format d\'email invalide';
      }
      if (field.errors?.['pattern']) {
        return 'Format de téléphone invalide (10 chiffres)';
      }
    }
    return null;
  }

  formatDateForInput(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  clearError(): void {
    this.error = null;
  }
}
