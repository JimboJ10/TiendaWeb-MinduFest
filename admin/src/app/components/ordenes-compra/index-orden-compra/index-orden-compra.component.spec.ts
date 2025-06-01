import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexOrdenCompraComponent } from './index-orden-compra.component';

describe('IndexOrdenCompraComponent', () => {
  let component: IndexOrdenCompraComponent;
  let fixture: ComponentFixture<IndexOrdenCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IndexOrdenCompraComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IndexOrdenCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
