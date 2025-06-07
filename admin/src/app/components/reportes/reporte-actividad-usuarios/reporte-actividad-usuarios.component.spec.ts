import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteActividadUsuariosComponent } from './reporte-actividad-usuarios.component';

describe('ReporteActividadUsuariosComponent', () => {
  let component: ReporteActividadUsuariosComponent;
  let fixture: ComponentFixture<ReporteActividadUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteActividadUsuariosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteActividadUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
