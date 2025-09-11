import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluationDto, Grade } from '../../models';
import { Location } from '@angular/common';
import { EvaluationService } from '../../services/evaluation.service';
import { GradeService } from '../../services/grade.service';

@Component({
  selector: 'app-evaluation-detail',
  templateUrl: './evaluation-detail.component.html',
  styleUrl: './evaluation-detail.component.css'
})
export class EvaluationDetailComponent implements OnInit {
  evaluationId!: number;
  evaluation: EvaluationDto | null = null;
  grades: Grade[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private evaluationService: EvaluationService, private gradeService: GradeService, private location: Location) {}

  ngOnInit(): void {
    this.evaluationId = Number(this.route.snapshot.paramMap.get('evaluationId'));
    if (this.evaluationId) {
      this.load();
    }
  }

  load() {
    this.isLoading = true;
    this.evaluationService.getGrades(this.evaluationId).subscribe({
      next: (dtos) => {
        this.grades = (dtos || []).map((d: any) => (this.gradeService as any)['mapDtoToGrade'](d));
        this.isLoading = false;
      },
      error: (err) => { this.error = 'Erreur chargement notes'; this.isLoading = false; console.error(err); }
    });
  }

  goBack() {
    this.location.back();
  }

  // UI helpers
  getStatusLabel(raw: string | null | undefined): string {
    const status = (raw || 'PRESENT').toString();
    switch (status) {
      case 'PRESENT': return 'Présent';
      case 'ABSENT_JUSTIFIED': return 'Absent justifié';
      case 'ABSENT_UNJUSTIFIED': return 'Absent';
      case 'NOT_SUBMITTED': return 'Non rendu';
      default: return status;
    }
  }

  getStatusBadgeClass(raw: string | null | undefined): string {
    const status = (raw || 'PRESENT').toString();
    // Base pill styles + per-status colors
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'PRESENT':
        return base + ' bg-emerald-100 text-emerald-800';
      case 'ABSENT_JUSTIFIED':
        return base + ' bg-blue-100 text-blue-800';
      case 'ABSENT_UNJUSTIFIED':
        return base + ' bg-red-100 text-red-800';
      case 'NOT_SUBMITTED':
        return base + ' bg-yellow-100 text-yellow-800';
      default:
        return base + ' bg-gray-100 text-gray-800';
    }
  }

  formatGrade(g: Grade): string {
    if (g.value === undefined || g.value === null) {
      return '-';
    }
    return `${g.value}/${g.maxValue}`;
  }
}
