import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '../../../../services/GLOBAL';
import { ClienteService } from '../../../../services/cliente.service';
import { ActivatedRoute } from '@angular/router';

declare var iziToast :any;

@Component({
  selector: 'app-detalle-orden',
  templateUrl: './detalle-orden.component.html',
  styleUrls: ['./detalle-orden.component.css']  // Asegúrate de que el archivo esté nombrado correctamente
})
export class DetalleOrdenComponent implements OnInit {
  
  ventaid: any;
  detalles: Array<any> = []; 
  url: string;
  load_data = true;
  orden: any = {};
  review: any = { estrellas: 0, comentario: '' };
  tempRating: number = 0;

  constructor(
    private _clienteService: ClienteService, 
    private _route: ActivatedRoute,
  ) {
    this.url = GLOBAL.url;
    this._route.params.subscribe(
      params => {
        this.ventaid = params['ventaid'];
      }
    );
  }

  ngOnInit(): void {
    this.obtenerDetallesOrden();
  }

  setTempRating(rating: number): void {
    this.tempRating = rating;
  }

  resetTempRating(): void {
    this.tempRating = 0;
  }

  setRating(rating: number): void {
    this.review.estrellas = rating;
  }

  obtenerDetallesOrden(): void {
    this._clienteService.obtenerDetallesVenta(this.ventaid).subscribe(
      response => {
        if (response) {
          this.orden = response[0];
          this.detalles = response.map((item: any) => {
            const resenaEmitida = localStorage.getItem(`resenaEmitida_${item.productoid}`);
            return {
              ...item,
              resenaEmitida: resenaEmitida === 'true'
            };
          });
          this.load_data = false;
        }
      },
      error => {
        console.error('Error al obtener los detalles de la venta', error);
        this.load_data = false;
      }
    );
  }

  emitirResena(productoid: string, modal: any): void {
    if (this.review.estrellas === 0 || this.review.comentario.trim() === '') {
      iziToast.error({
        title: 'Error',
        message: 'Debe proporcionar una calificación y un comentario',
        position: 'topRight'
      });
      return;
    }

    const data = {
      productoid,
      usuarioid: this.orden.usuarioid,
      ventaid: this.ventaid,
      estrellas: this.review.estrellas,
      comentario: this.review.comentario
    };

    this._clienteService.emitirReviewProductoCliente(data).subscribe(
      response => {
        iziToast.success({
          title: 'Éxito',
          message: 'Reseña emitida correctamente',
          position: 'topRight'
        });
        this.review = { estrellas: 0, comentario: '' };
        modal.hide();
        this.detalles = this.detalles.map(item => {
          if (item.productoid === productoid) {
            localStorage.setItem(`resenaEmitida_${productoid}`, 'true');
            return { ...item, resenaEmitida: true };
          }
          return item;
        });
      },
      error => {
        console.error('Error al emitir la reseña', error);
        iziToast.error({
          title: 'Error',
          message: 'No se pudo emitir la reseña',
          position: 'topRight'
        });
      }
    );
  }

  obtenerResenas(productoid: string): void {
    this._clienteService.obtenerReviewProductoCliente(productoid).subscribe(
      response => {
        console.log('Reseñas obtenidas:', response);
      },
      error => {
        console.error('Error al obtener las reseñas', error);
      }
    );
  }
  
}
