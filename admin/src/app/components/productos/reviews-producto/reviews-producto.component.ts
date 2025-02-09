import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from '../../../services/producto.service';
import { RespaldosService } from '../../../services/respaldos.service';
import { GLOBAL } from '../../../services/GLOBAL';

declare var iziToast: any;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-reviews-producto',
  templateUrl: './reviews-producto.component.html',
  styleUrl: './reviews-producto.component.css'
})
export class ReviewsProductoComponent implements OnInit{

  productoid: any;
  producto: any = { };
  url: string;
  public page = 1;
  public pageSize = 3;
  reviews: Array<any> = [];
  rating: number = 0;
  starCount: number[] = [0, 0, 0, 0, 0];

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService,
    private _router: Router, 
    private _respaldos:RespaldosService
  ){
    this.url = GLOBAL.url;
      
  }
  
  ngOnInit(): void {
    this._route.params.subscribe(
      params => {
        this.productoid = params['id'];
        this.obtenerProducto(this.productoid);
        this.obtenerResenas(this.productoid);
      }
    );
    
  }

  obtenerResenas(productoid: number): void {
    this._productoService.ObtenerReviewProductoPublico(productoid).subscribe(
      response => {
        this.reviews = response.reviews;
      },
      error => {
        console.error('Error al obtener las reseñas:', error);
      }
    );
  }

  obtenerProducto(id: string): void {
    this._productoService.obtenerProducto(id).subscribe(
      response => {
        if (response) {
          this.producto = response;
          console.log(this.producto);
        } else {
          this._router.navigate(['/panel/productos']);
        }
      },
      error => {
        console.error(error);
        iziToast.show({
          title: 'ERROR',
          titleColor: '#FF0000',
          message: 'Error en el servidor',
          messageColor: '#FFF',
          position: 'topRight'
        });
      }
    );
  }

}
