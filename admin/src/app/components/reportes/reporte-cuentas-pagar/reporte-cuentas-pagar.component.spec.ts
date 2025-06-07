import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteCuentasPagarComponent } from './reporte-cuentas-pagar.component';

describe('ReporteCuentasPagarComponent', () => {
  let component: ReporteCuentasPagarComponent;
  let fixture: ComponentFixture<ReporteCuentasPagarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteCuentasPagarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteCuentasPagarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
