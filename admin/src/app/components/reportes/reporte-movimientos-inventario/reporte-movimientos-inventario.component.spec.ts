import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteMovimientosInventarioComponent } from './reporte-movimientos-inventario.component';

describe('ReporteMovimientosInventarioComponent', () => {
  let component: ReporteMovimientosInventarioComponent;
  let fixture: ComponentFixture<ReporteMovimientosInventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteMovimientosInventarioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteMovimientosInventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
