import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassroomOverviewComponent } from './classroom-overview.component';

describe('ClassroomOverviewComponent', () => {
  let component: ClassroomOverviewComponent;
  let fixture: ComponentFixture<ClassroomOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassroomOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassroomOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
