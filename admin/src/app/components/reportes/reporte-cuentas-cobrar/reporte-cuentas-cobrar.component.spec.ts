import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteCuentasCobrarComponent } from './reporte-cuentas-cobrar.component';

describe('ReporteCuentasCobrarComponent', () => {
  let component: ReporteCuentasCobrarComponent;
  let fixture: ComponentFixture<ReporteCuentasCobrarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteCuentasCobrarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteCuentasCobrarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
