import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EvaluationDto } from '../models';
import {environment} from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  //private apiUrl = 'http://localhost:8081/api/evaluations';
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createEvaluation(payload: Omit<EvaluationDto, 'id'>): Observable<EvaluationDto> {
    return this.http.post<any>(this.apiUrl, payload).pipe(map(res => res.data ?? res));
  }

  getByClassroom(classroomId: string): Observable<EvaluationDto[]> {
    return this.http.get<any>(`${this.apiUrl}/evaluations/classroom/${classroomId}`).pipe(map(res => res.data ?? res));
  }

  saveGradesBulk(evaluationId: number, body: { grades: Array<{ studentId: number; value?: number; status: string }> }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/evaluations/${evaluationId}/grades`, body).pipe(map(res => res.data ?? res));
  }

  getGrades(evaluationId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/evaluations/${evaluationId}/grades`).pipe(map(res => res.data ?? res));
  }
}


