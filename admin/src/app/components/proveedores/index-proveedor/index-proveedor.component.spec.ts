import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexProveedorComponent } from './index-proveedor.component';

describe('IndexProveedorComponent', () => {
  let component: IndexProveedorComponent;
  let fixture: ComponentFixture<IndexProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IndexProveedorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IndexProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
