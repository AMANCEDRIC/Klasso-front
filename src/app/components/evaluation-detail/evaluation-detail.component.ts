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
}
