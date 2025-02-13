import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { GLOBAL } from '../../services/GLOBAL';
import { io } from 'socket.io-client';
import { GuestService } from '../../services/guest.service';
import { Router } from '@angular/router';

declare var iziToast: any;
declare var Cleave: any;
declare var StickySidebar: any;
declare var paypal: any;

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {

  @ViewChild('paypal', { static: true }) paypalElement!: ElementRef;
  nombres: string | null = null;
  usuarioid: any;
  carrito_arr: Array<any> = [];
  url: string;
  subtotal = 0;
  total_pagar: number = 0;
  socket = io('http://localhost:3000');
  direccion_principal: any = {};
  envios: Array<any> = [];
  precio_envio = "0";
  envio_titulo: string = 'Envío gratis';
  direccionValida: boolean = false;
  loading: boolean = false;

  constructor(
    private _clienteService: ClienteService,
    private _guestService: GuestService,
    private _router: Router
  ) {
    this.url = GLOBAL.url;

    this._guestService.get_envios().subscribe(
      response => {
        this.envios = response;
      }
    );
  }

  ngOnInit(): void {
    this.nombres = localStorage.getItem('nombres');
    this.usuarioid = localStorage.getItem('usuarioid');

    this.obtenerDireccionPrincipal(this.usuarioid);
    this.init_data();

    const sidebar = new StickySidebar('.sidebar-sticky', { topSpacing: 20 });

    const compraRealizada = localStorage.getItem('compraRealizada');
    if (compraRealizada === 'true') {
      iziToast.show({
        title: 'Success',
        titleColor: '#1DC74C',
        color: '#FFF',
        class: 'text-success',
        position: 'topRight',
        message: 'Compra realizada con éxito',
      });
      localStorage.removeItem('compraRealizada');
    }

    
  }

  ngAfterViewInit(): void {
      console.log(this.paypalElement);
    if (this.paypalElement) {
      this.configurarPayPal();
    } else {
      console.error('Elemento de PayPal no está presente en el DOM.');
    }
  }

  

  configurarPayPal() {
    if (!paypal) {
      console.error('PayPal SDK no está disponible.');
      return;
    }

    paypal.Buttons({
      style: {
        layout: 'horizontal',
      },
      createOrder: (data: any, actions: any) => {
        if (!this.direccion_principal || !this.direccion_principal.direccionid) {
          iziToast.error({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Debe proporcionar una dirección de envío antes de proceder con el pago.',
          });
          return actions.reject();
        }

        if (this.carrito_arr.length === 0) {
          iziToast.error({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'No hay productos en el carrito.',
          });
          return actions.reject();
        }

        const total = typeof this.total_pagar === 'number' ? this.total_pagar.toFixed(2) : '0.00';
        return actions.order.create({
          purchase_units: [{
            description: 'Compra en MinduFest',
            amount: {
              currency_code: 'USD',
              value: total,
            },
          }],
        });
      },
      onApprove: async (data: any, actions: any) => {
        this.loading = true;
        const order = await actions.order.capture();
        this.registrarVenta(order);
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
      },
      onCancel: (data: any, actions: any) => {
        console.log('Pago cancelado:', data);
      },
    }).render(this.paypalElement.nativeElement);
  }

  init_data(){
    this._clienteService.obtenerCarritoCliente(this.usuarioid).subscribe(
      response => {
        this.carrito_arr = response;
        this.calcular_carrito();
      }
    );
  }

  calcular_carrito() {
    this.subtotal = this.carrito_arr.reduce((acc, item) => acc + (parseFloat(item.precio_carrito || '0') * (item.cantidad || 1)), 0);
    this.total_pagar = this.subtotal;
  
    this.subtotal = parseFloat(this.subtotal.toFixed(2)) || 0;
    this.total_pagar = parseFloat(this.total_pagar.toFixed(2)) || 0;
    this.calcular_total();
  }
  

  registrarVenta(order: any) {
    const data = {
      usuarioid: this.usuarioid,
      carrito_arr: this.carrito_arr,
      direccionid: this.direccion_principal.direccionid,
      transaccion: order.id,
      cupon: '', // Si se aplicó un cupón, agregar aquí
      nota: '', // Información adicional
      precio_envio: this.precio_envio,
      envio_titulo: this.envio_titulo,
    };
  
    this._clienteService.registrarVenta(data).subscribe(
      response => {
        if (response.ventaid) {
          this._clienteService.enviarCorreoCompra(response.ventaid).subscribe(
            res => {
              setTimeout(() => {
                this.loading = false;
                iziToast.show({
                  title: 'Éxito',
                  titleColor: '#1DC74C',
                  class: 'text-success',
                  position: 'topRight',
                  message: 'Compra realizada con éxito. Se ha enviado una factura a su correo.'
                });
                this._router.navigate(['/cuenta/ordenes']);
              }, 1000);
            },
            err => {
              this.loading = false;
              console.error('Error al enviar el correo:', err);
              iziToast.show({
                title: 'Error',
                titleColor: '#FF0000',
                class: 'text-danger',
                position: 'topRight',
                message: 'Hubo un problema al enviar la factura por correo.'
              });
            }
          );
        } else {
          this.loading = false;
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            class: 'text-danger',
            position: 'topRight',
            message: 'Hubo un problema al registrar la venta.'
          });
        }
      },
      error => {
        this.loading = false;
        console.error('Error al registrar la venta:', error);
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          class: 'text-danger',
          position: 'topRight',
          message: 'Hubo un problema al realizar la compra.'
        });
      }
    );
  }

  realizarCompra() {
    this.loading = true;
    const data = {
      usuarioid: this.usuarioid,
      carrito_arr: this.carrito_arr,
      direccionid: this.direccion_principal._id,
      transaccion: 'PAYPAL',
      cupon: '',
      nota: '',
      precio_envio: this.precio_envio,
      envio_titulo: this.envio_titulo
    };

    this._clienteService.registrarVenta(data).subscribe(
      response => {
        if (response.ventaid) {
          this._clienteService.enviarCorreoCompra(response.ventaid).subscribe({
            next: (res) => {
                setTimeout(() => {
                    this.loading = false;
                    iziToast.show({
                        title: 'Éxito',
                        titleColor: '#1DC74C',
                        class: 'text-success',
                        position: 'topRight',
                        message: 'Compra realizada con éxito. Se ha enviado una factura a su correo.'
                    });
                    this._router.navigate(['/cuenta/ordenes']);
                }, 1000);
            },
            error: (err) => {
                this.loading = false;
                console.error('Error al enviar el correo:', err);
                iziToast.show({
                    title: 'Error',
                    titleColor: '#FF0000',
                    class: 'text-danger',
                    position: 'topRight',
                    message: `Error al enviar el correo: ${err.error?.details || 'Error desconocido'}`
                });
            }
          });
        } else {
          this.loading = false;
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            class: 'text-danger',
            position: 'topRight',
            message: 'Hubo un problema al registrar la venta.'
          });
        }
      },
      error => {
        this.loading = false;
        console.error('Error al registrar la venta:', error);
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          class: 'text-danger',
          position: 'topRight',
          message: 'Hubo un problema al realizar la compra.'
        });
      }
    );
  }

  eliminar_item(id: any): void {
    this._clienteService.eliminarCarritoCliente(id).subscribe(
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
        this._clienteService.obtenerCarritoCliente(this.usuarioid).subscribe(
          response => {
            this.carrito_arr = response;
            this.calcular_carrito();
          }
        );
      }
    );
  }

  actualizarCarrito(): void {
    this._clienteService.obtenerCarritoCliente(this.usuarioid).subscribe(
      response => {
        this.carrito_arr = response;
        this.calcular_carrito();
      },
      error => {
        console.log(error);
      }
    );
  }
  

  obtenerDireccionPrincipal(usuarioid: string): void {
    this._clienteService.obtenerDireccionPrincipalCliente(usuarioid).subscribe(
      response => {
        this.direccion_principal = response;
        console.log('Direcciones obtenidas:', this.direccion_principal);
        this.verificarDireccion(); // Verificar la dirección después de obtenerla
      },
      error => {
        console.log(error);
      }
    );
  }

  calcular_total() {
    const envio = parseFloat(this.precio_envio) || 0;
    this.total_pagar = parseFloat((this.subtotal + envio).toFixed(2));
  }
  
  verificarDireccion() {
    this.direccionValida = !!this.direccion_principal && !!this.direccion_principal.direccionid;
  }

  actualizarDireccion(direccion: any) {
    this.direccion_principal = direccion;
    this.verificarDireccion();
  }

  guardarDireccion(nuevaDireccion: any) {
    this.actualizarDireccion(nuevaDireccion);
  }



}
