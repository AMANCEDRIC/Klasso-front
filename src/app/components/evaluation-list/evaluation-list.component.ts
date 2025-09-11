import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluationDto } from '../../models';
import { EvaluationService } from '../../services/evaluation.service';

@Component({
  selector: 'app-evaluation-list',
  templateUrl: './evaluation-list.component.html',
  styleUrl: './evaluation-list.component.css'
})
export class EvaluationListComponent implements OnInit {
  classroomId!: string;
  evaluations: EvaluationDto[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private evaluationService: EvaluationService) {}

  ngOnInit(): void {
    this.classroomId = this.route.snapshot.paramMap.get('classroomId')!;
    if (this.classroomId) {
      this.load();
    }
  }

  load() {
    this.isLoading = true;
    this.evaluationService.getByClassroom(this.classroomId).subscribe({
      next: (list) => { this.evaluations = list || []; this.isLoading = false; },
      error: (err) => { this.error = 'Erreur chargement évaluations'; this.isLoading = false; console.error(err); }
    });
  }

  openDetail(e: EvaluationDto) {
    this.router.navigate(['/evaluations', e.id]);
  }
}
