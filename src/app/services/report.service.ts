import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Report, ReportType, StudentBulletin, ClassSummary } from '../models';
import { GradeService } from './grade.service';
import { AttendanceService } from './attendance.service';
import { StudentService } from './student.service';
import { ClassroomService } from './classroom.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private gradeService: GradeService,
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private classroomService: ClassroomService,
    private authService: AuthService
  ) {}

  generateStudentBulletin(studentId: string, period: string): Observable<StudentBulletin> {
    return of(null).pipe(
      map(() => {
        const student = this.studentService.getStudentById(studentId);
        const classroom = student ? this.classroomService.getClassroomById(student.classroomId) : null;
        
        if (!student || !classroom) {
          throw new Error('Élève ou classe non trouvé');
        }

        const studentGrades = this.gradeService.getGradesByStudent(studentId);
        const studentAverage = this.gradeService.calculateStudentAverage(studentId);
        const attendanceStats = this.attendanceService.calculateStudentAttendanceStats(studentId);

        // Grouper les notes par matière
        const gradesBySubject = studentGrades.reduce((acc, grade) => {
          if (!acc[grade.subject]) {
            acc[grade.subject] = [];
          }
          acc[grade.subject].push(grade);
          return acc;
        }, {} as { [subject: string]: any[] });

        const grades = Object.keys(gradesBySubject).map(subject => {
          const subjectGrades = gradesBySubject[subject];
          const subjectTotal = subjectGrades.reduce((sum, grade) => {
            return sum + (grade.value / grade.maxValue * 20 * grade.coefficient);
          }, 0);
          const subjectCoef = subjectGrades.reduce((sum, grade) => sum + grade.coefficient, 0);
          const subjectAverage = subjectCoef > 0 ? subjectTotal / subjectCoef : 0;

          return {
            subject,
            average: Math.round(subjectAverage * 100) / 100,
            grades: subjectGrades
          };
        });

        return {
          student: {
            firstName: student.firstName,
            lastName: student.lastName,
            className: classroom.name
          },
          grades,
          attendance: attendanceStats,
          generalAverage: studentAverage.average,
          classRank: this.calculateStudentRank(studentId, classroom.id),
          comments: this.generateStudentComments(studentAverage.average, attendanceStats.attendanceRate)
        };
      })
    );
  }

  generateClassSummary(classroomId: string): Observable<ClassSummary> {
    return of(null).pipe(
      map(() => {
        const classroom = this.classroomService.getClassroomById(classroomId);
        const students = this.studentService.getStudentsByClassroom(classroomId);
        
        if (!classroom) {
          throw new Error('Classe non trouvée');
        }

        const averages = this.gradeService.calculateClassroomAverages(classroomId);
        const generalAverage = this.gradeService.getClassroomGeneralAverage(classroomId);
        const attendanceRate = this.attendanceService.getClassroomAttendanceRate(classroomId);

        // Top 3 étudiants
        const topStudents = averages
          .sort((a, b) => b.average - a.average)
          .slice(0, 3)
          .map(avg => {
            const student = this.studentService.getStudentById(avg.studentId);
            return {
              studentName: student ? `${student.firstName} ${student.lastName}` : 'Inconnu',
              average: avg.average
            };
          });

        return {
          className: classroom.name,
          totalStudents: students.length,
          averageGrade: generalAverage,
          attendanceRate,
          topStudents
        };
      })
    );
  }

  private calculateStudentRank(studentId: string, classroomId: string): number {
    const averages = this.gradeService.calculateClassroomAverages(classroomId);
    const sortedAverages = averages.sort((a, b) => b.average - a.average);
    const studentRank = sortedAverages.findIndex(avg => avg.studentId === studentId);
    return studentRank + 1; // Les rangs commencent à 1
  }

  private generateStudentComments(average: number, attendanceRate: number): string {
    let comments = [];

    // Commentaires sur les notes
    if (average >= 16) {
      comments.push("Excellent travail, continuez ainsi !");
    } else if (average >= 14) {
      comments.push("Bon travail, quelques efforts supplémentaires peuvent améliorer encore les résultats.");
    } else if (average >= 12) {
      comments.push("Travail satisfaisant, mais peut mieux faire.");
    } else if (average >= 10) {
      comments.push("Résultats passables, des efforts soutenus sont nécessaires.");
    } else {
      comments.push("Résultats insuffisants, un travail de rattrapage s'impose.");
    }

    // Commentaires sur l'assiduité
    if (attendanceRate >= 95) {
      comments.push("Assiduité exemplaire.");
    } else if (attendanceRate >= 90) {
      comments.push("Bonne assiduité.");
    } else if (attendanceRate >= 80) {
      comments.push("Assiduité correcte, mais attention aux absences.");
    } else {
      comments.push("Assiduité insuffisante, trop d'absences.");
    }

    return comments.join(" ");
  }

  saveReport(report: Partial<Report>): Observable<Report> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const fullReport: Report = {
      id: `report_${Date.now()}`,
      title: report.title || 'Rapport sans titre',
      type: report.type || ReportType.STUDENT_BULLETIN,
      generatedDate: new Date(),
      period: report.period || 'Non spécifié',
      academicYear: report.academicYear || '2024-2025',
      classroomId: report.classroomId,
      studentId: report.studentId,
      data: report.data || {},
      createdBy: currentUser.id,
      createdAt: new Date()
    };

    // Dans un vrai projet, on sauvegarderait en base de données
    return of(fullReport);
  }

  exportToPDF(bulletin: StudentBulletin): void {
    // Cette méthode serait implémentée avec une librairie comme jsPDF
    console.log('Export PDF non implémenté dans cette démo');
    console.log('Données du bulletin:', bulletin);
  }

  exportToExcel(classSummary: ClassSummary): void {
    // Cette méthode serait implémentée avec une librairie comme xlsx
    console.log('Export Excel non implémenté dans cette démo');
    console.log('Données du résumé de classe:', classSummary);
  }
}
