import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexReportesComponent } from './index-reportes.component';

describe('IndexReportesComponent', () => {
  let component: IndexReportesComponent;
  let fixture: ComponentFixture<IndexReportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IndexReportesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IndexReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
