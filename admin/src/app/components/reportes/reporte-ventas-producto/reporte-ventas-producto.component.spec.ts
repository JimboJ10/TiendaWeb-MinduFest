import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteVentasProductoComponent } from './reporte-ventas-producto.component';

describe('ReporteVentasProductoComponent', () => {
  let component: ReporteVentasProductoComponent;
  let fixture: ComponentFixture<ReporteVentasProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteVentasProductoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteVentasProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
