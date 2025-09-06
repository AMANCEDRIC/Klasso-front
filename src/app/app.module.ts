import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ProfileComponent } from './components/profile/profile.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EstablishmentListComponent } from './components/establishment-list/establishment-list.component';
import { ClassroomListComponent } from './components/classroom-list/classroom-list.component';
import { StudentListComponent } from './components/student-list/student-list.component';
import { GradeManagementComponent } from './components/grade-management/grade-management.component';
import { AttendanceManagementComponent } from './components/attendance-management/attendance-management.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ReportGenerationComponent } from './components/report-generation/report-generation.component';
import { ClassroomOverviewComponent } from './components/classroom-overview/classroom-overview.component';
import { RegisterComponent } from './components/register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ProfileComponent,
    DashboardComponent,
    EstablishmentListComponent,
    ClassroomListComponent,
    StudentListComponent,
    GradeManagementComponent,
    AttendanceManagementComponent,
    NavbarComponent,
    ReportGenerationComponent,
    ClassroomOverviewComponent,
    RegisterComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
