import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { GLOBAL } from '../../services/GLOBAL';
import { GuestService } from '../../services/guest.service';

declare var iziToast: any;

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {

  productos: Array<any> = [];
  productosFiltrados: Array<any> = [];
  url: string;
  productRatings: { [key: number]: number } = {};

  constructor(
    private _productoService: ClienteService,
    private guestService: GuestService
  ) {
    this.url = GLOBAL.url;
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this._productoService.listarProductos().subscribe(
      response => {
        this.productos = response;
        this.productosFiltrados = [...this.productos, ...this.productos, ...this.productos];
        document.documentElement.style.setProperty('--product-count', this.productos.length.toString());
        
        // Cargar ratings para cada producto
        this.productos.forEach(producto => {
          this.cargarRatingProducto(producto.productoid);
        });
      },
      error => {
        console.error(error);
        iziToast.show({
          title: 'ERROR',
          titleColor: '#FF0000',
          class: 'text-danger',
          position: 'topRight',
          message: 'Error al cargar los productos.'
        });
      }
    );
  }

  cargarRatingProducto(productoid: number): void {
    this.guestService.ObtenerReviewProductoPublico(productoid).subscribe(
      response => {
        this.productRatings[productoid] = Number(response.rating.toFixed(1));
      },
      error => {
        console.error('Error al cargar rating:', error);
      }
    );
  }

  getStarsArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }
}