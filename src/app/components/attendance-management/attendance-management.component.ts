import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Attendance, CreateAttendanceRequest, AttendanceStatus, AttendanceStats } from '../../models';
import { Student } from '../../models';
import { Classroom } from '../../models';
import { AttendanceService } from '../../services/attendance.service';
import { StudentService } from '../../services/student.service';
import { ClassroomService } from '../../services/classroom.service';

@Component({
  selector: 'app-attendance-management',
  templateUrl: './attendance-management.component.html',
  styleUrl: './attendance-management.component.css'
})
export class AttendanceManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Données
  attendances: Attendance[] = [];
  students: Student[] = [];
  classroom: Classroom | null = null;
  studentStats: AttendanceStats[] = [];
  classroomAttendanceRate: number = 0;
  
  // Paramètres de route
  classroomId: string | null = null;
  studentId: string | null = null;
  
  // Date sélectionnée
  selectedDate: Date = new Date();
  selectedDateFilter: string = '';
  
  // État de l'interface
  isLoading = false;
  error: string | null = null;
  isCreateModalOpen = false;
  isBulkModalOpen = false;
  selectedStudent: Student | null = null;
  
  // Formulaires
  attendanceForm: FormGroup;
  bulkAttendanceForm: FormGroup;
  
  // Constantes
  attendanceStatuses = Object.values(AttendanceStatus);
  statusLabels: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: 'Présent',
    [AttendanceStatus.ABSENT]: 'Absent',
    [AttendanceStatus.LATE]: 'En retard',
    [AttendanceStatus.EXCUSED]: 'Absent excusé'
  };

  // Propriétés pour les filtres  
  selectedTimeSlot: string = '';
  
  // Créneaux horaires disponibles
  timeSlots: string[] = [
    '08:00-09:00',
    '09:00-10:00',
    '10:15-11:15',
    '11:15-12:15',
    '14:00-15:00',
    '15:00-16:00',
    '16:15-17:15'
  ];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private classroomService: ClassroomService
  ) {
    this.attendanceForm = this.createAttendanceForm();
    this.bulkAttendanceForm = this.createBulkAttendanceForm();
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

  private createAttendanceForm(): FormGroup {
    return this.fb.group({
      studentId: ['', Validators.required],
      status: ['', Validators.required],
      timeSlot: ['', Validators.required],
      notes: [''],
      justifiedAbsence: [false]
    });
  }

  private createBulkAttendanceForm(): FormGroup {
    return this.fb.group({
      timeSlot: ['08:00-09:00', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  private loadData() {
    if (!this.classroomId) return;
    
    this.isLoading = true;
    this.error = null;

    combineLatest([
      this.classroomService.getClassroomByIdObservable(this.classroomId),
      this.studentService.loadStudents(this.classroomId),
      this.attendanceService.loadAttendances(this.classroomId, this.selectedDate)
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([classroom, students, attendances]) => {
        this.classroom = classroom;
        this.students = students || [];
        this.attendances = attendances || [];
        this.calculateStats();
        this.isLoading = false;
        
        // Si on a un studentId spécifique, filtrer les présences
        if (this.studentId && attendances) {
          this.attendances = attendances.filter((a: Attendance) => a.studentId === this.studentId);
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

  private calculateStats() {
    if (!this.classroomId) return;
    
    this.studentStats = this.attendanceService.calculateClassroomAttendanceStats(this.classroomId);
    this.classroomAttendanceRate = this.attendanceService.getClassroomAttendanceRate(this.classroomId);
  }

  // Gestion des modales
  openCreateModal(student?: Student) {
    this.selectedStudent = student || null;
    
    if (student) {
      this.attendanceForm.patchValue({
        studentId: student.id
      });
    }
    
    this.isCreateModalOpen = true;
  }

  openBulkModal() {
    this.isBulkModalOpen = true;
  }

  closeModals() {
    this.isCreateModalOpen = false;
    this.isBulkModalOpen = false;
    this.selectedStudent = null;
    this.attendanceForm.reset();
    this.bulkAttendanceForm.reset();
    this.attendanceForm = this.createAttendanceForm();
    this.bulkAttendanceForm = this.createBulkAttendanceForm();
  }

  // Gestion des formulaires
  onCreateSubmit() {
    if (this.attendanceForm.valid && this.classroomId) {
      this.isLoading = true;
      
      const formData = this.attendanceForm.value;
      const attendanceData: CreateAttendanceRequest = {
        ...formData,
        classroomId: this.classroomId,
        date: this.selectedDate
      };

      this.attendanceService.createAttendance(attendanceData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (newAttendance) => {
          this.attendances = [...this.attendances, newAttendance];
          this.calculateStats();
          this.closeModals();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de l\'ajout de la présence';
          this.isLoading = false;
          console.error('Erreur:', error);
        }
      });
    }
  }

  onBulkSubmit() {
    if (this.bulkAttendanceForm.valid && this.classroomId) {
      this.isLoading = true;
      
      const formData = this.bulkAttendanceForm.value;
      const attendanceList: CreateAttendanceRequest[] = this.students.map(student => ({
        studentId: student.id,
        classroomId: this.classroomId!,
        date: new Date(formData.date),
        status: AttendanceStatus.PRESENT,
        timeSlot: formData.timeSlot,
        justifiedAbsence: false
      }));

      this.attendanceService.bulkCreateAttendance(attendanceList).pipe(takeUntil(this.destroy$)).subscribe({
        next: (newAttendances) => {
          this.attendances = [...this.attendances, ...newAttendances];
          this.calculateStats();
          this.closeModals();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de l\'ajout en lot';
          this.isLoading = false;
          console.error('Erreur:', error);
        }
      });
    }
  }

  // Gestion de la date
  onDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.selectedDateFilter = target.value;
    this.loadData();
  }

  // Méthodes utilitaires
  getStudentName(studentId: string): string {
    const student = this.students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Élève inconnu';
  }

  getStudentAttendanceRate(studentId: string): number {
    const stats = this.studentStats.find(s => s.studentId === studentId);
    return stats ? stats.attendanceRate : 0;
  }

  getAttendancesByStudent(studentId: string): Attendance[] {
    return this.attendances.filter(a => a.studentId === studentId);
  }

  getAttendanceForStudentAndDate(studentId: string, date: Date): Attendance | undefined {
    return this.attendances.find(a => 
      a.studentId === studentId && 
      a.date.toDateString() === date.toDateString()
    );
  }

  getStatusColor(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'text-green-600';
      case AttendanceStatus.LATE: return 'text-yellow-600';
      case AttendanceStatus.ABSENT: return 'text-red-600';
      case AttendanceStatus.EXCUSED: return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  getStatusIcon(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'fas fa-check-circle';
      case AttendanceStatus.LATE: return 'fas fa-clock';
      case AttendanceStatus.ABSENT: return 'fas fa-times-circle';
      case AttendanceStatus.EXCUSED: return 'fas fa-user-clock';
      default: return 'fas fa-question-circle';
    }
  }

  getFieldError(fieldName: string, formGroup: FormGroup = this.attendanceForm): string | null {
    const field = formGroup.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      const errors = field.errors;
      if (errors?.['required']) return 'Ce champ est requis';
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

  viewStudentAttendance(student: Student) {
    this.router.navigate(['/attendance', 'student', student.id], {
      queryParams: { classroomId: this.classroomId }
    });
  }

  goBackToClassroom() {
    if (this.studentId && this.classroomId) {
      this.router.navigate(['/attendance', 'classroom', this.classroomId]);
    }
  }

  // Computed properties
  get attendanceRate(): number {
    if (this.attendances.length === 0 || this.students.length === 0) return 0;
    const presentAttendances = this.attendances.filter(a => a.status === 'present').length;
    return (presentAttendances / this.attendances.length) * 100;
  }

  // Méthodes pour les filtres et affichage
  filterAttendances(): void {
    this.loadData();
  }

  clearFilters(): void {
    this.selectedDateFilter = '';
    this.selectedTimeSlot = '';
    this.loadData();
  }

  getAttendancesByDate(): { date: string, attendances: Attendance[] }[] {
    const groupedAttendances: { [key: string]: Attendance[] } = {};
    
    this.attendances.forEach(attendance => {
      const dateKey = new Date(attendance.date).toDateString();
      if (!groupedAttendances[dateKey]) {
        groupedAttendances[dateKey] = [];
      }
      groupedAttendances[dateKey].push(attendance);
    });

    return Object.keys(groupedAttendances)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date,
        attendances: groupedAttendances[date].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime())
      }));
  }

  getAttendanceRateColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  }

  getStatusBadgeClass(status: AttendanceStatus): string {
    const classes = {
      'present': 'bg-green-100 text-green-800',
      'absent': 'bg-red-100 text-red-800',
      'late': 'bg-yellow-100 text-yellow-800',
      'excused': 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusSelectClass(status: AttendanceStatus): string {
    const classes = {
      'present': 'border-green-300 hover:bg-green-50',
      'absent': 'border-red-300 hover:bg-red-50',
      'late': 'border-yellow-300 hover:bg-yellow-50',
      'excused': 'border-blue-300 hover:bg-blue-50'
    };
    return classes[status] || 'border-gray-300 hover:bg-gray-50';
  }

  markAllPresent(): void {
    this.students.forEach(student => {
      const controlName = 'student_' + student.id;
      this.bulkAttendanceForm.get(controlName)?.setValue('present');
    });
  }
}
