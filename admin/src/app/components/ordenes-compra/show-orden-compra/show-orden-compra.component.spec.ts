import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowOrdenCompraComponent } from './show-orden-compra.component';

describe('ShowOrdenCompraComponent', () => {
  let component: ShowOrdenCompraComponent;
  let fixture: ComponentFixture<ShowOrdenCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowOrdenCompraComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowOrdenCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
