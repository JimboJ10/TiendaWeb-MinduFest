import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteEstadoPagosComponent } from './reporte-estado-pagos.component';

describe('ReporteEstadoPagosComponent', () => {
  let component: ReporteEstadoPagosComponent;
  let fixture: ComponentFixture<ReporteEstadoPagosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteEstadoPagosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteEstadoPagosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
