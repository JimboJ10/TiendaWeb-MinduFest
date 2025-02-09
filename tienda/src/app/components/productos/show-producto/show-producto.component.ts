import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { ActivatedRoute } from '@angular/router';
import { GLOBAL } from '../../../services/GLOBAL';
import { io } from 'socket.io-client';
import { GuestService } from '../../../services/guest.service';

declare var iziToast :any;

@Component({
  selector: 'app-show-producto',
  templateUrl: './show-producto.component.html',
  styleUrls: ['./show-producto.component.css']
})
export class ShowProductoComponent implements OnInit{

  nombres: string | null = null;
  producto:  any = {};
  url: string;
  carrito_data : any = {
    cantidad: '1',
  };
  socket = io('http://localhost:3000');
  reviews: Array<any> = [];
  rating: number = 0;
  starCount: number[] = [0, 0, 0, 0, 0];
  public page = 1;
  public pageSize = 4;

  constructor(private clienteService: ClienteService, private route: ActivatedRoute, private guestService: GuestService)
  {
    this.url = GLOBAL.url;
  }


  ngOnInit(): void {
    this.nombres = localStorage.getItem('nombres');
    this.route.params.subscribe(params => {
      const titulo = decodeURIComponent(params['titulo']);
      this.clienteService.obtenerProductoPorTitulo(encodeURIComponent(titulo)).subscribe(
        response => {
          this.producto = response;
          this.obtenerResenas(this.producto.productoid);
        },
        error => {
          console.error('Error al obtener el producto:', error);
        }
      );
    });
    

  }

  obtenerResenas(productoid: number): void {
    this.guestService.ObtenerReviewProductoPublico(productoid).subscribe(
      response => {
        this.reviews = response.reviews;
        this.rating = Number(response.rating.toFixed(1));
        this.starCount = response.starCount;
      },
      error => {
        console.error('Error al obtener las reseñas:', error);
      }
    );
  }

  // Método helper para generar array de estrellas
  getStarsArray(rating: number): string[] {
    rating = rating || 0;
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

  agregar_producto() {
    if (this.producto.stock <= 0) {
      iziToast.show({
        title: 'ERROR',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'El producto no está disponible actualmente.'
      });
      return;
    }
  
    if (this.carrito_data.cantidad <= this.producto.stock) {
      let data = {
        productoid: this.producto.productoid,
        usuarioid: localStorage.getItem('usuarioid'),
        cantidad: this.carrito_data.cantidad,
        precio: this.producto.precio,
      }
      this.clienteService.agregarProductoAlCarrito(data).subscribe(
        response => {
          iziToast.show({
            title: 'Success',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Se agregó el producto al carrito',
          });
          this.socket.emit('add-carrito-add', { data: true })
        },
        error => {
          if (error.status === 400) {
            iziToast.show({
              title: 'Error',
              titleColor: '#FF0000',
              color: '#FFF',
              class: 'text-danger',
              position: 'topRight',
              message: 'El producto ya existe en el carrito'
            });
          }
        }
      )
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'La máxima cantidad disponible es ' + this.producto.stock,
      });
    }
  }


}
