import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOrdenCompraComponent } from './edit-orden-compra.component';

describe('EditOrdenCompraComponent', () => {
  let component: EditOrdenCompraComponent;
  let fixture: ComponentFixture<EditOrdenCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditOrdenCompraComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditOrdenCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
