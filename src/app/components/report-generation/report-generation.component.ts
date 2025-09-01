import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportType } from '../../models/report.model';

@Component({
  selector: 'app-report-generation',
  templateUrl: './report-generation.component.html',
  styleUrl: './report-generation.component.css'
})
export class ReportGenerationComponent implements OnInit {
  reportForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  showPreview = false;
  generatedReport: any = null;
  currentReportType: ReportType | null = null;
  
  reportTypes = [
    { value: ReportType.STUDENT_BULLETIN, label: 'Bulletin d\'élève' },
    { value: ReportType.CLASS_SUMMARY, label: 'Résumé de classe' }
  ];
  
  periods = [
    { value: 'trimestre1', label: 'Trimestre 1' },
    { value: 'trimestre2', label: 'Trimestre 2' },
    { value: 'trimestre3', label: 'Trimestre 3' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.reportForm = this.fb.group({
      reportType: ['', Validators.required],
      period: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Initialisation
  }

  onGenerateReport(): void {
    if (this.reportForm.valid) {
      this.isLoading = true;
      // Simulation de génération de rapport
      setTimeout(() => {
        this.generateMockReport();
        this.isLoading = false;
        this.showPreview = true;
      }, 2000);
    }
  }

  private generateMockReport(): void {
    const formData = this.reportForm.value;
    this.currentReportType = formData.reportType;
    
    if (formData.reportType === ReportType.STUDENT_BULLETIN) {
      this.generatedReport = {
        generalAverage: 14.5,
        grades: [
          { subject: 'Mathématiques', average: 15.2 },
          { subject: 'Français', average: 13.8 },
          { subject: 'Histoire', average: 14.0 }
        ]
      };
    } else if (formData.reportType === ReportType.CLASS_SUMMARY) {
      this.generatedReport = {
        totalStudents: 25,
        averageGrade: 13.7,
        attendanceRate: 92
      };
    }
  }

  onExportPDF(): void {
    console.log('Export PDF - Non implémenté dans cette démo');
  }

  onExportExcel(): void {
    console.log('Export Excel - Non implémenté dans cette démo');
  }

  clearError(): void {
    this.error = null;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  isStudentBulletin(): boolean {
    return this.currentReportType === ReportType.STUDENT_BULLETIN;
  }

  isClassSummary(): boolean {
    return this.currentReportType === ReportType.CLASS_SUMMARY;
  }
} 