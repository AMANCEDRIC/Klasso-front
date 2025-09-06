import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// Composants
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ProfileComponent } from './components/profile/profile.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EstablishmentListComponent } from './components/establishment-list/establishment-list.component';
import { ClassroomListComponent } from './components/classroom-list/classroom-list.component';
import { StudentListComponent } from './components/student-list/student-list.component';
import { GradeManagementComponent } from './components/grade-management/grade-management.component';
import { AttendanceManagementComponent } from './components/attendance-management/attendance-management.component';
import { ReportGenerationComponent } from './components/report-generation/report-generation.component';
import { ClassroomOverviewComponent } from './components/classroom-overview/classroom-overview.component';

const routes: Routes = [
  // Route par défaut - redirection vers le login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Routes publiques (authentification)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  
  // Routes protégées par authentification
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'profile', 
    component: ProfileComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'establishments', 
    component: EstablishmentListComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'establishments/:establishmentId/classrooms', 
    component: ClassroomListComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'classrooms/:classroomId/students', 
    component: StudentListComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'classrooms/:classroomId/students/:studentId/grades', 
    component: GradeManagementComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'classrooms/:classroomId/students/:studentId/attendances', 
    component: AttendanceManagementComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'classrooms/:classroomId/grades', 
    component: GradeManagementComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'classrooms/:classroomId/attendances', 
    component: AttendanceManagementComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'classrooms/:classroomId/overview', 
    component: ClassroomOverviewComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'reports', 
    component: ReportGenerationComponent, 
    canActivate: [AuthGuard] 
  },
  
  // Route wildcard pour les pages non trouvées - redirection vers login
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
