import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import $, { param } from 'jquery';
import { GLOBAL } from '../../services/GLOBAL';
import { io } from 'socket.io-client';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

declare var iziToast:any;

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit{

  nombres: string | null = null;
  usuarioid: any;
  categorias: any[] = [];
  op_cart = false;
  carrito_arr: Array<any> = [];
  url: string;
  subtotal = 0;
  socket = io('http://localhost:3000');
  rutaActual: string = '';
  searchTerm: string = '';
  searchResults: any[] = [];
  showResults: boolean = false;
  isNavbarCollapsed = false;

  // Añadir Subject para implementar debounce
  private searchSubject = new Subject<string>();

  toggleNavbar() {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
    if (this.isNavbarCollapsed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeNavbar() {
    if (this.isNavbarCollapsed) {
      this.isNavbarCollapsed = false;
      document.body.style.overflow = '';
    }
  }

  constructor(private clienteService: ClienteService, private router: Router) {
    this.url = GLOBAL.url;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.rutaActual = event.url;
        this.isNavbarCollapsed = false; // Cerrar el menú al navegar
      }
    });
  }


  ngOnInit(): void {
    this.nombres = localStorage.getItem('nombres');
    this.usuarioid = localStorage.getItem('usuarioid');

    this.guardarCarritoEnLocalStorage();

    this.clienteService.obtenerCarritoCliente(this.usuarioid).subscribe(
      response => {
        this.carrito_arr = response;
        this.calcular_carrito();
        this.guardarCarritoEnLocalStorage();
      }
    );
    this.obtenerCategorias();

    this.socket.on('new-carrito', (data) => {
      this.clienteService.obtenerCarritoCliente(this.usuarioid).subscribe(
        response => {
          this.carrito_arr = response;
          this.calcular_carrito();
          this.guardarCarritoEnLocalStorage();
        }
      );
    });

    this.socket.on('new-carrito-add', (data) => {
      this.clienteService.obtenerCarritoCliente(this.usuarioid).subscribe(
        response => {
          this.carrito_arr = response;
          this.calcular_carrito();
          this.guardarCarritoEnLocalStorage();
        }
      );
    });

    this.socket.on('new-carrito-add', (data) => {
      this.clienteService.obtenerCarritoCliente(this.usuarioid).subscribe(
        response => {
          this.carrito_arr = response;
          this.calcular_carrito();
        }
      );
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      if (term.length >= 2) {
          this.buscarProductos(term);
      } else {
          this.searchResults = [];
          this.showResults = false;
      }
    });
  }

  onSearch(event: any) {
    const term = event.target.value;
    this.searchSubject.next(term);
  }
  
  buscarProductos(termino: string) {
      this.clienteService.buscarProductos(termino).subscribe(
          response => {
              this.searchResults = response;
              this.showResults = true;
          },
          error => {
              console.error('Error en la búsqueda:', error);
          }
      );
  }
  
  hideResults() {
      setTimeout(() => {
          this.showResults = false;
      }, 200);
  }

  
  get isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.clear();
    this.nombres = null;
  }

  obtenerCategorias(): void {
    this.clienteService.obtenerCategorias().subscribe(
      (data: any) => {
        // Asegúrate de que data sea un array
        this.categorias = Array.isArray(data) ? data : Object.values(data);
      },
      error => {
        console.error('Error al obtener las categorías', error);
      }
    );
  }

  op_modalcart(): void {
    if (this.rutaActual === '/carrito') {
      return;
    }
    this.op_cart = !this.op_cart;
    $('#cart').toggleClass('show');
  }


  decrementarCantidad(item: any): void {
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      this.clienteService.decrementarCantidadCarrito(item.carritoid).subscribe(
        response => {
          this.calcular_carrito();
          this.guardarCarritoEnLocalStorage();
        },
        error => {
          item.cantidad += 1; // Revertir el decremento en caso de error
          console.error('Error al decrementar cantidad', error);
        }
      );
    }
  }

  guardarCarritoEnLocalStorage(): void {
    localStorage.setItem('carrito', JSON.stringify(this.carrito_arr));
  }

  cargarCarritoDesdeLocalStorage(): void {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      this.carrito_arr = JSON.parse(carritoGuardado);
      this.calcular_carrito();  // Recalcular el subtotal después de cargar el carrito
    }
  }

  calcular_carrito(): void {
    this.subtotal = this.carrito_arr.reduce((acc, item) => acc + parseFloat(item.precio_carrito) * item.cantidad, 0).toFixed(2);
  }

  eliminar_item(id: any): void {
    this.clienteService.eliminarCarritoCliente(id).subscribe(
      response => {
        iziToast.show({
          title: 'Success',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Se quito el producto correctamente',
        });
        this.socket.emit('delete-carrito', { data: response.data });
        this.calcular_carrito();  // Recalcular el subtotal después de eliminar un producto
        this.guardarCarritoEnLocalStorage();
      }
    );
  }

  incrementarCantidad(item: any): void {
    if (item.cantidad >= item.stock) {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'No hay más stock disponible'
      });
      return;
    }
  
    item.cantidad += 1;
    this.clienteService.incrementarCantidadCarrito(item.carritoid).subscribe(
      response => {
        this.calcular_carrito();
        this.guardarCarritoEnLocalStorage();
      },
      error => {
        item.cantidad -= 1; // Revertir el incremento en caso de error
        console.error('Error al incrementar cantidad', error);
      }
    );
  }

  
}
