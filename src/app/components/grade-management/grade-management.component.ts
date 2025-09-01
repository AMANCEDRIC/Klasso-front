import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Grade, CreateGradeRequest, GradeType, StudentAverage } from '../../models';
import { Student } from '../../models';
import { Classroom } from '../../models';
import { GradeService } from '../../services/grade.service';
import { StudentService } from '../../services/student.service';
import { ClassroomService } from '../../services/classroom.service';

@Component({
  selector: 'app-grade-management',
  templateUrl: './grade-management.component.html',
  styleUrl: './grade-management.component.css'
})
export class GradeManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Données
  grades: Grade[] = [];
  students: Student[] = [];
  classroom: Classroom | null = null;
  studentAverages: StudentAverage[] = [];
  classroomAverage: number = 0;
  
  // Paramètres de route
  classroomId: string | null = null;
  studentId: string | null = null;
  
  // État de l'interface
  isLoading = false;
  error: string | null = null;
  isCreateModalOpen = false;
  selectedStudent: Student | null = null;
  
  // Formulaires
  gradeForm: FormGroup;
  
  // Constantes
  gradeTypes = Object.values(GradeType);
  gradeTypeLabels: Record<GradeType, string> = {
    [GradeType.HOMEWORK]: 'Devoir',
    [GradeType.TEST]: 'Contrôle',
    [GradeType.EXAM]: 'Examen',
    [GradeType.PARTICIPATION]: 'Participation',
    [GradeType.PROJECT]: 'Projet'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private gradeService: GradeService,
    private studentService: StudentService,
    private classroomService: ClassroomService
  ) {
    this.gradeForm = this.createGradeForm();
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.classroomId = params['classroomId'] || null;
      this.studentId = params['studentId'] || null;
      
      if (this.classroomId) {
        this.loadData();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createGradeForm(): FormGroup {
    return this.fb.group({
      studentId: ['', Validators.required],
      value: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      maxValue: [20, [Validators.required, Validators.min(1)]],
      coefficient: [1, [Validators.required, Validators.min(0.1)]],
      gradeType: ['', Validators.required],
      subject: ['', Validators.required],
      description: [''],
      gradeDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  private loadData() {
    if (!this.classroomId) return;
    
    this.isLoading = true;
    this.error = null;

    combineLatest([
      this.classroomService.getClassroomByIdObservable(this.classroomId),
      this.studentService.loadStudents(this.classroomId),
      this.gradeService.loadGrades(this.classroomId)
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([classroom, students, grades]) => {
        this.classroom = classroom;
        this.students = students || [];
        this.grades = grades || [];
        this.calculateAverages();
        this.isLoading = false;
        
        // Si on a un studentId spécifique, filtrer les notes
        if (this.studentId && grades) {
          this.grades = grades.filter((g: Grade) => g.studentId === this.studentId);
          this.selectedStudent = students?.find((s: Student) => s.id === this.studentId) || null;
        }
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  private calculateAverages() {
    if (!this.classroomId) return;
    
    this.studentAverages = this.gradeService.calculateClassroomAverages(this.classroomId);
    this.classroomAverage = this.gradeService.getClassroomGeneralAverage(this.classroomId);
  }

  // Gestion des modales
  openCreateModal(student?: Student) {
    this.selectedStudent = student || null;
    
    if (student) {
      this.gradeForm.patchValue({
        studentId: student.id,
        subject: this.classroom?.subject || ''
      });
    } else {
      this.gradeForm.patchValue({
        subject: this.classroom?.subject || ''
      });
    }
    
    this.isCreateModalOpen = true;
  }

  closeModals() {
    this.isCreateModalOpen = false;
    this.selectedStudent = null;
    this.gradeForm.reset();
    this.gradeForm = this.createGradeForm();
  }

  // Gestion des formulaires
  onCreateSubmit() {
    if (this.gradeForm.valid && this.classroomId) {
      this.isLoading = true;
      
      const formData = this.gradeForm.value;
      const gradeData: CreateGradeRequest = {
        ...formData,
        gradeDate: new Date(formData.gradeDate),
        classroomId: this.classroomId
      };

      this.gradeService.createGrade(gradeData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (newGrade) => {
          this.grades = [...this.grades, newGrade];
          this.calculateAverages();
          this.closeModals();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la création de la note';
          this.isLoading = false;
          console.error('Erreur:', error);
        }
      });
    }
  }

  // Méthodes utilitaires
  getStudentName(studentId: string): string {
    const student = this.students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Élève inconnu';
  }

  getStudentAverage(studentId: string): number {
    const average = this.studentAverages.find(a => a.studentId === studentId);
    return average ? average.average : 0;
  }

  getGradesByStudent(studentId: string): Grade[] {
    return this.grades.filter(g => g.studentId === studentId);
  }

  formatGrade(grade: Grade): string {
    return `${grade.value}/${grade.maxValue}`;
  }

  getGradePercentage(grade: Grade): number {
    return Math.round((grade.value / grade.maxValue) * 100);
  }

  getGradeColor(grade: Grade): string {
    const percentage = this.getGradePercentage(grade);
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  getFieldError(fieldName: string): string | null {
    const field = this.gradeForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      const errors = field.errors;
      if (errors?.['required']) return 'Ce champ est requis';
      if (errors?.['min']) return `Valeur minimale: ${errors['min'].min}`;
      if (errors?.['max']) return `Valeur maximale: ${errors['max'].max}`;
    }
    return null;
  }

  clearError() {
    this.error = null;
  }

  // Navigation
  goBackToStudents() {
    if (this.classroomId) {
      this.router.navigate(['/classrooms', this.classroomId, 'students']);
    }
  }

  viewStudentGrades(student: Student) {
    this.router.navigate(['/grades', 'student', student.id], {
      queryParams: { classroomId: this.classroomId }
    });
  }

  goBackToClassroom() {
    if (this.studentId && this.classroomId) {
      this.router.navigate(['/grades', 'classroom', this.classroomId]);
    }
  }
} 