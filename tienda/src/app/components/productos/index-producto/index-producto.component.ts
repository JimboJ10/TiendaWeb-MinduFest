import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { ActivatedRoute, Route } from '@angular/router';
import { GLOBAL } from '../../../services/GLOBAL';
import $, { param } from 'jquery';
import { io } from 'socket.io-client';
import { GuestService } from '../../../services/guest.service';

declare var noUiSlider : any;
declare var iziToast : any;

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css']
})
export class IndexProductoComponent implements OnInit{

  nombres: string | null = null;
  filtro_producto = '';
  categorias: any[] = []; 
  filter_categoria = '';
  productos: Array<any> = [];
  productosFiltrados: Array<any> = [];
  url: string;
  filter_cat_productos = 'todos';
  route_categoria: string | null = null;
  page = 1;
  pageSize = 5;
  sort_by = 'Defecto'
  carrito_data : any = {
    cantidad: '1',
  };
  socket = io('http://localhost:3000');
  productRatings: { [key: number]: number } = {};

  constructor(
    private clienteService: ClienteService, 
    private route: ActivatedRoute,
    private guestService: GuestService
  ){ 
    this.url = GLOBAL.url; 
  }

  ngOnInit(): void {
    this.nombres = localStorage.getItem('nombres');
    this.obtenerCategorias();
    this.cargarProductos();
    this.route.params.subscribe(params => {
      this.route_categoria = params['categoria'];
      this.filtrarPorRutaCategoria();
    });
    var slider : any = document.getElementById('slider');
    noUiSlider.create(slider, {
        start: [0, 3000],
        connect: true,
        decimals: false,
        range: {
            'min': 0,
            'max': 3000
        },
        tooltips: [true,true],
        pips: {
          mode: 'count', 
          values: 5,
          
        }
    })

    slider.noUiSlider.on('update', function (values:any) {
        $('.cs-range-slider-value-min').val(values[0]);
        $('.cs-range-slider-value-max').val(values[1]);
    });
    $('.noUi-tooltip').css('font-size','11px');

    this.cargarProductos();
    
  }

  obtenerCategorias(): void {
    this.clienteService.obtenerCategorias().subscribe(
      data => {
        // Asegurarse de que data sea un array
        this.categorias = Array.isArray(data) ? data : Object.values(data);
      },
      error => {
        console.error('Error al obtener las categorías', error);
      }
    );
  }

  buscar_categorias(): void {
    if (this.filter_categoria) {
      this.clienteService.buscarCategorias(this.filter_categoria).subscribe(
        data => {
          // Asegurarse de que data sea un array
          this.categorias = Array.isArray(data) ? data : Object.values(data);
        },
        error => {
          console.error('Error al buscar las categorías', error);
        }
      );
    } else {
      this.obtenerCategorias();
    }
  }

  cargarProductos(): void {
    this.clienteService.listarProductos().subscribe(
      response => {
        this.productos = response;
        this.productosFiltrados = this.productos;
        this.productos.forEach(producto => {
          this.obtenerRatingProducto(producto.productoid);
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

  obtenerRatingProducto(productoid: number): void {
    this.guestService.ObtenerReviewProductoPublico(productoid).subscribe(
        response => {
            this.productRatings[productoid] = Number(response.rating || 0);
        },
        error => {
            console.error('Error al obtener rating:', error);
            this.productRatings[productoid] = 0; // Valor por defecto si hay error
        }
    );
}

  getStarsArray(rating: number): number[] {
      rating = rating || 0; // Aseguramos que rating tenga un valor
      return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  filtrar() {
    if (this.filtro_producto) {
      this.productosFiltrados = this.productos.filter(item => item.titulo.toLowerCase().includes(this.filtro_producto.toLowerCase()));
    } else {
      this.productosFiltrados = this.productos;
    }
  }

  buscar_precio(){
    let minStr = $('.cs-range-slider-value-min').val();
    let maxStr = $('.cs-range-slider-value-max').val();

    let min = minStr !== undefined ? parseInt(minStr as string) : 0;
    let max = maxStr !== undefined ? parseInt(maxStr as string) : 0;

    this.productosFiltrados = this.productos.filter((item) => {
      return item.precio >= min && item.precio <= max
    })

    console.log(min);
    console.log(max);
  }

  buscar_por_categoria(){
    if(this.filter_cat_productos == 'todos'){
      this.cargarProductos();
    } else {
      this.productosFiltrados = this.productos.filter(item => item.categoria == this.filter_cat_productos)
    }
  }

  filtrarPorRutaCategoria() {
    if (this.route_categoria) {
      this.productosFiltrados = this.productos.filter(item => item.categoria.toLowerCase() === this.route_categoria!.toLowerCase());
    } else {
      this.productosFiltrados = this.productos;
    }
  }

  reset_productos(){
    this.filtro_producto = '';
    this.cargarProductos();
  }

  orden_por() {
    switch (this.sort_by) {
      case 'Defecto':
        this.cargarProductos();
        break;
      case '+-Precio':
        this.productosFiltrados.sort((a, b) => b.precio - a.precio);
        break;
      case '-+Precio':
        this.productosFiltrados.sort((a, b) => a.precio - b.precio);
        break;
      case 'azTitulo':
        this.productosFiltrados.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      case 'zaTitulo':
        this.productosFiltrados.sort((a, b) => b.titulo.localeCompare(a.titulo));
        break;
    }
  }

  agregar_producto(producto: any) {
    // Verificar stock antes de proceder
    if (producto.stock <= 0) {
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
  
    let data = {
      productoid: producto.productoid,
      usuarioid: localStorage.getItem('usuarioid'),
      cantidad: 1,
      precio: producto.precio
    };
  
    const token = this.clienteService.getToken();
    if (!token) {
      iziToast.show({
        title: '!!!',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Por favor, inicia sesión.'
      });
      return;
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
        this.socket.emit('add-carrito-add', { data: true });
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
        } else {
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Inicié sesión por favor'
          });
        }
      }
    );
  }

}
