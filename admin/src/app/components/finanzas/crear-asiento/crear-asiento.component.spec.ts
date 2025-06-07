import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearAsientoComponent } from './crear-asiento.component';

describe('CrearAsientoComponent', () => {
  let component: CrearAsientoComponent;
  let fixture: ComponentFixture<CrearAsientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CrearAsientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrearAsientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
