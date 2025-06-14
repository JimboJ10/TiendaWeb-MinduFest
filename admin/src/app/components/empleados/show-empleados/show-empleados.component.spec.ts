import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEmpleadosComponent } from './show-empleados.component';

describe('ShowEmpleadosComponent', () => {
  let component: ShowEmpleadosComponent;
  let fixture: ComponentFixture<ShowEmpleadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowEmpleadosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowEmpleadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
