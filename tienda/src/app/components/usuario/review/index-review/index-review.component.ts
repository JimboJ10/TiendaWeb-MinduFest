import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../../services/cliente.service';

@Component({
  selector: 'app-index-review',
  templateUrl: './index-review.component.html',
  styleUrl: './index-review.component.css'
})
export class IndexReviewComponent implements OnInit {

  public load_data = true;
  public reviews: Array<any> = [];
  public page = 1;
  public pageSize = 3;

  constructor(private _clienteService:ClienteService) { }

  ngOnInit(): void {
    this._clienteService.obtenerReviewCliente(localStorage.getItem('usuarioid')).subscribe(
      (response) => {
        this.reviews = response;
        this.load_data = false;
      },
      (error) => {
        console.log(error);
        this.load_data = false;
      }
    )
  }

  getStarsArray(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Agrega estrellas llenas
    for (let i = 0; i < fullStars; i++) {
      stars.push('fas fa-star');
    }
    
    // Agrega media estrella si corresponde
    if (hasHalfStar) {
      stars.push('fas fa-star-half-alt');
    }
    
    // Completa con estrellas vacías
    while (stars.length < 5) {
      stars.push('far fa-star');
    }
    
    return stars;
  }
}
