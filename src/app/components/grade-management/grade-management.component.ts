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
  isEditMode = false;
  editingGradeId: string | null = null;
  // Evaluation (mock front) + saisie en lot
  isEvaluationModalOpen = false;
  isBulkStep = false;
  evaluationForm: FormGroup | null = null;
  draftGrades: Record<string, { value?: number; status?: 'absent' | 'excused' } > = {};
  
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

  getGradeTypeLabel(code: string | null | undefined): string {
    if (!code) return '';
    try {
      return this.gradeTypeLabels[code as GradeType] || String(code);
    } catch {
      return String(code);
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private gradeService: GradeService,
    private studentService: StudentService,
    private classroomService: ClassroomService
  ) {
    this.gradeForm = this.createGradeForm();
    this.evaluationForm = this.createEvaluationForm();
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

  private createEvaluationForm(): FormGroup {
    return this.fb.group({
      subject: [this.classroom?.subject || '', Validators.required],
      gradeType: ['', Validators.required],
      maxValue: [20, [Validators.required, Validators.min(1)]],
      coefficient: [1, [Validators.required, Validators.min(0.1)]],
      gradeDate: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['']
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
  openEvaluationModal() {
    this.isEvaluationModalOpen = true;
    this.isBulkStep = false;
    this.draftGrades = {};
    // sync subject default
    this.evaluationForm?.patchValue({ subject: this.classroom?.subject || '' });
  }

  closeEvaluationModal() {
    this.isEvaluationModalOpen = false;
    this.isBulkStep = false;
    this.draftGrades = {};
  }

  proceedToBulk() {
    if (!this.evaluationForm || !this.evaluationForm.valid) return;
    // Préparer le brouillon des notes pour tous les élèves
    this.students.forEach(s => {
      if (!this.draftGrades[s.id]) {
        this.draftGrades[s.id] = {};
      }
    });
    this.isBulkStep = true;
  }

  applySameValueToAll(value: number | null) {
    if (value === null || value === undefined) return;
    Object.keys(this.draftGrades).forEach(id => {
      this.draftGrades[id].value = Number(value);
      this.draftGrades[id].status = undefined;
    });
  }

  markAllAbsent(type: 'absent' | 'excused') {
    Object.keys(this.draftGrades).forEach(id => {
      this.draftGrades[id].value = undefined;
      this.draftGrades[id].status = type;
    });
  }

  saveBulkGrades() {
    if (!this.evaluationForm) return;
    const evalData = this.evaluationForm.value;
    const created: Grade[] = [];
    Object.entries(this.draftGrades).forEach(([studentId, entry]) => {
      // Si pas de valeur et pas de statut, on ignore
      if (entry.value === undefined && !entry.status) return;
      // Règle: excused = exclu du calcul -> on ignore la création d'une note valeur
      // absent non excusé => 0
      const value = entry.status === 'excused' ? undefined : (entry.value ?? 0);
      if (value === undefined) return; // excused, on ne crée pas de note
      const g: Grade = {
        id: Math.random().toString(36).slice(2),
        value: Number(value),
        maxValue: Number(evalData.maxValue),
        coefficient: Number(evalData.coefficient),
        gradeType: evalData.gradeType,
        subject: evalData.subject,
        description: evalData.description || '',
        gradeDate: new Date(evalData.gradeDate),
        studentId: studentId,
        classroomId: this.classroomId as string,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Grade;
      created.push(g);
    });

    // Injecter dans la liste locale
    this.grades = [...this.grades, ...created];
    this.calculateAverages();
    this.closeEvaluationModal();
  }
  openCreateModal(student?: Student) {
    this.selectedStudent = student || null;
    this.isEditMode = false;
    this.editingGradeId = null;
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
    this.isEditMode = false;
    this.editingGradeId = null;
    this.gradeForm.reset();
    this.gradeForm = this.createGradeForm();
  }

  // Gestion des formulaires
  onCreateSubmit() {
    if (this.gradeForm.valid && this.classroomId && !this.isEditMode) {
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

  openEditModal(grade: Grade) {
    this.isEditMode = true;
    this.isCreateModalOpen = true;
    this.editingGradeId = grade.id;
    this.selectedStudent = this.students.find(s => s.id === grade.studentId) || null;
    this.gradeForm.patchValue({
      studentId: grade.studentId,
      value: grade.value,
      maxValue: grade.maxValue,
      coefficient: grade.coefficient,
      gradeType: grade.gradeType,
      subject: grade.subject,
      description: grade.description || '',
      gradeDate: new Date(grade.gradeDate).toISOString().split('T')[0]
    });
  }

  onUpdateSubmit() {
    if (this.gradeForm.valid && this.classroomId && this.isEditMode && this.editingGradeId) {
      this.isLoading = true;
      const formData = this.gradeForm.value;
      const payload: Partial<CreateGradeRequest> = {
        value: formData.value,
        maxValue: formData.maxValue,
        coefficient: formData.coefficient,
        gradeType: formData.gradeType,
        subject: formData.subject,
        description: formData.description,
        gradeDate: new Date(formData.gradeDate),
        classroomId: this.classroomId
      };
      this.gradeService.updateGrade(this.editingGradeId, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated) => {
          this.grades = this.grades.map(g => g.id === updated.id ? updated : g);
          this.calculateAverages();
          this.closeModals();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la mise à jour de la note';
          this.isLoading = false;
          console.error('Erreur:', error);
        }
      });
    }
  }

  onDeleteGrade(grade: Grade) {
    if (!confirm('Supprimer cette note ?')) return;
    this.isLoading = true;
    this.gradeService.deleteGrade(grade.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.grades = this.grades.filter(g => g.id !== grade.id);
        this.calculateAverages();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors de la suppression de la note';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  // Méthodes utilitaires
  getStudentName(studentId: string): string {
    // Chercher d'abord dans la liste des élèves
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      return `${student.firstName} ${student.lastName}`;
    }
    // Sinon, essayer de récupérer depuis les champs du grade courant
    const anyGrade = this.grades.find(g => g.studentId === studentId);
    if (anyGrade && (anyGrade.studentFirstName || anyGrade.studentLastName)) {
      return `${anyGrade.studentFirstName || ''} ${anyGrade.studentLastName || ''}`.trim() || 'Élève inconnu';
    }
    return 'Élève inconnu';
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