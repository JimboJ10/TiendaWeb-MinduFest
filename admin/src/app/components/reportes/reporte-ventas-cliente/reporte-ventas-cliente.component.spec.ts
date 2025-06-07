import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteVentasClienteComponent } from './reporte-ventas-cliente.component';

describe('ReporteVentasClienteComponent', () => {
  let component: ReporteVentasClienteComponent;
  let fixture: ComponentFixture<ReporteVentasClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteVentasClienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteVentasClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
