import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteStockActualComponent } from './reporte-stock-actual.component';

describe('ReporteStockActualComponent', () => {
  let component: ReporteStockActualComponent;
  let fixture: ComponentFixture<ReporteStockActualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteStockActualComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteStockActualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
