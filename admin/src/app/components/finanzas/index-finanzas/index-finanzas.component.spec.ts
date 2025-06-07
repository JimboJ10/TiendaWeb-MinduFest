import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexFinanzasComponent } from './index-finanzas.component';

describe('IndexFinanzasComponent', () => {
  let component: IndexFinanzasComponent;
  let fixture: ComponentFixture<IndexFinanzasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IndexFinanzasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IndexFinanzasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
