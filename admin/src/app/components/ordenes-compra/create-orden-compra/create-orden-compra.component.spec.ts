import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOrdenCompraComponent } from './create-orden-compra.component';

describe('CreateOrdenCompraComponent', () => {
  let component: CreateOrdenCompraComponent;
  let fixture: ComponentFixture<CreateOrdenCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateOrdenCompraComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateOrdenCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
