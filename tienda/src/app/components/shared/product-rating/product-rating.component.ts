import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-product-rating',
  template: `
    <div class="position-absolute" style="top: 15px; right: 15px; z-index: 999;">
      <div class="star-rating p-2 rounded">
        <ng-container *ngFor="let starClass of getStarsArray()">
          <i [class]="starClass" 
             style="margin-right: 2px; color: #ffc107;">
          </i>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .star-rating {
      display: inline-flex;
      align-items: center;
    }
    .star-rating i {
      font-size: 14px;
    }
    .small {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class ProductRatingComponent {
  @Input() rating: number = 0;
  @Input() showValue: boolean = true;

  getStarsArray(): string[] {
    const rating = this.rating || 0;
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Agregar estrellas llenas
    for (let i = 0; i < fullStars; i++) {
      stars.push('fas fa-star');
    }
    
    // Agregar media estrella si corresponde
    if (hasHalfStar) {
      stars.push('fas fa-star-half-alt');
    }
    
    // Completar con estrellas vacías
    while (stars.length < 5) {
      stars.push('far fa-star');
    }
    
    return stars;
  }
}