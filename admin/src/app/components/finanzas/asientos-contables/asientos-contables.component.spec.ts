import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsientosContablesComponent } from './asientos-contables.component';

describe('AsientosContablesComponent', () => {
  let component: AsientosContablesComponent;
  let fixture: ComponentFixture<AsientosContablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AsientosContablesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AsientosContablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
