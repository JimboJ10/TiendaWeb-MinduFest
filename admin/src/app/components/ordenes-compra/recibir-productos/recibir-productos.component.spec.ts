import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecibirProductosComponent } from './recibir-productos.component';

describe('RecibirProductosComponent', () => {
  let component: RecibirProductosComponent;
  let fixture: ComponentFixture<RecibirProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecibirProductosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecibirProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
