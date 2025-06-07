import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlujoCajaComponent } from './flujo-caja.component';

describe('FlujoCajaComponent', () => {
  let component: FlujoCajaComponent;
  let fixture: ComponentFixture<FlujoCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlujoCajaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FlujoCajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
