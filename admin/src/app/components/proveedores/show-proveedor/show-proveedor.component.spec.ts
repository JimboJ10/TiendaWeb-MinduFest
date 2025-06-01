import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowProveedorComponent } from './show-proveedor.component';

describe('ShowProveedorComponent', () => {
  let component: ShowProveedorComponent;
  let fixture: ComponentFixture<ShowProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowProveedorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
