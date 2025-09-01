import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Attendance, CreateAttendanceRequest, AttendanceStats, AttendanceStatus } from '../models';
import { FakeBackendService } from './fake-backend.service';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private attendancesSubject = new BehaviorSubject<Attendance[]>([]);
  public attendances$ = this.attendancesSubject.asObservable();

  constructor(private fakeBackend: FakeBackendService) {}

  loadAttendances(classroomId: string, date?: Date): Observable<Attendance[]> {
    return this.fakeBackend.getAttendances(classroomId, date).pipe(
      tap(attendances => {
        this.attendancesSubject.next(attendances);
      })
    );
  }

  getAttendances(): Observable<Attendance[]> {
    return this.attendances$;
  }

  createAttendance(data: CreateAttendanceRequest): Observable<Attendance> {
    return this.fakeBackend.createAttendance(data).pipe(
      tap(newAttendance => {
        const currentAttendances = this.attendancesSubject.value;
        this.attendancesSubject.next([...currentAttendances, newAttendance]);
      })
    );
  }

  getAttendancesByStudent(studentId: string): Attendance[] {
    return this.attendancesSubject.value.filter(a => a.studentId === studentId);
  }

  getAttendancesByClassroom(classroomId: string): Attendance[] {
    return this.attendancesSubject.value.filter(a => a.classroomId === classroomId);
  }

  getAttendancesByDate(date: Date): Attendance[] {
    return this.attendancesSubject.value.filter(a => 
      a.date.toDateString() === date.toDateString()
    );
  }

  calculateStudentAttendanceStats(studentId: string): AttendanceStats {
    const studentAttendances = this.getAttendancesByStudent(studentId);
    
    const totalDays = studentAttendances.length;
    const presentDays = studentAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const absentDays = studentAttendances.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const lateDays = studentAttendances.filter(a => a.status === AttendanceStatus.LATE).length;
    
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      studentId,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    };
  }

  calculateClassroomAttendanceStats(classroomId: string): AttendanceStats[] {
    const classroomAttendances = this.getAttendancesByClassroom(classroomId);
    const studentIds = [...new Set(classroomAttendances.map(a => a.studentId))];
    
    return studentIds.map(studentId => this.calculateStudentAttendanceStats(studentId));
  }

  getClassroomAttendanceRate(classroomId: string): number {
    const studentStats = this.calculateClassroomAttendanceStats(classroomId);
    
    if (studentStats.length === 0) return 0;
    
    const totalRate = studentStats.reduce((acc, curr) => acc + curr.attendanceRate, 0);
    return Math.round((totalRate / studentStats.length) * 100) / 100;
  }

  // Méthode pour marquer plusieurs élèves présents/absents en une fois
  bulkCreateAttendance(attendanceList: CreateAttendanceRequest[]): Observable<Attendance[]> {
    // Pour la simulation, on traite chaque présence individuellement
    const promises = attendanceList.map(data => this.createAttendance(data));
    
    // On pourrait utiliser forkJoin ici pour une vraie API
    return new Observable(observer => {
      Promise.all(promises.map(obs => obs.toPromise())).then(results => {
        observer.next(results.filter(r => r !== undefined) as Attendance[]);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }
}
