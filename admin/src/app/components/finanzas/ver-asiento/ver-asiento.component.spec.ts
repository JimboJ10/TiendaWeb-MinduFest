import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerAsientoComponent } from './ver-asiento.component';

describe('VerAsientoComponent', () => {
  let component: VerAsientoComponent;
  let fixture: ComponentFixture<VerAsientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerAsientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerAsientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
