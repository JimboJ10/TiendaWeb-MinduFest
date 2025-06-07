import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteVentasPeriodoComponent } from './reporte-ventas-periodo.component';

describe('ReporteVentasPeriodoComponent', () => {
  let component: ReporteVentasPeriodoComponent;
  let fixture: ComponentFixture<ReporteVentasPeriodoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteVentasPeriodoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteVentasPeriodoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
