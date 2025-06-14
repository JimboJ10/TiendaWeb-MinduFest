import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesEmpleadosComponent } from './roles-empleados.component';

describe('RolesEmpleadosComponent', () => {
  let component: RolesEmpleadosComponent;
  let fixture: ComponentFixture<RolesEmpleadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RolesEmpleadosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RolesEmpleadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
