import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OrdenCompraService } from '../../../services/orden-compra.service';

declare var iziToast: any;

@Component({
  selector: 'app-recibir-productos',
  templateUrl: './recibir-productos.component.html',
  styleUrls: ['./recibir-productos.component.css']
})
export class RecibirProductosComponent implements OnInit {

  public orden: any = {};
  public id: any;
  public token;
  public load_data = true;
  public load_btn = false;
  public productos_recepcion: Array<any> = [];

  constructor(
    private _ordenCompraService: OrdenCompraService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.obtenerOrden();
    });
  }

  obtenerOrden() {
    this._ordenCompraService.obtener_orden_compra(this.id, this.token).subscribe(
      response => {
        if (response) {
          this.orden = response;
          
          // Preparar productos para recepción
          this.productos_recepcion = response.detalles.map((detalle: any) => ({
            detalleordencompraid: detalle.detalleordencompraid,
            productoid: detalle.productoid,
            producto_titulo: detalle.producto_titulo,
            cantidad_ordenada: detalle.cantidad,
            cantidad_recibida_anteriormente: detalle.recibido,
            cantidad_pendiente: detalle.cantidad - detalle.recibido,
            cantidad_a_recibir: 0,
            precio_unitario: detalle.precio_unitario,
            observaciones: ''
          }));
          
          this.load_data = false;
        } else {
          this._router.navigate(['/panel/ordenes-compra']);
        }
      },
      error => {
        console.log(error);
        iziToast.error({
          title: 'Error',
          message: 'No se pudo obtener la información de la orden',
          position: 'topRight'
        });
        this._router.navigate(['/panel/ordenes-compra']);
      }
    );
  }

  validar_cantidad(producto: any) {
    if (producto.cantidad_a_recibir < 0) {
      producto.cantidad_a_recibir = 0;
    }
    
    if (producto.cantidad_a_recibir > producto.cantidad_pendiente) {
      producto.cantidad_a_recibir = producto.cantidad_pendiente;
      iziToast.warning({
        title: 'Advertencia',
        message: `No puede recibir más de ${producto.cantidad_pendiente} unidades de ${producto.producto_titulo}`,
        position: 'topRight'
      });
    }
  }

  recibir_todo(producto: any) {
    producto.cantidad_a_recibir = producto.cantidad_pendiente;
  }

  recibir_productos() {
    // Validar que al menos un producto tenga cantidad a recibir
    const productos_a_recibir = this.productos_recepcion.filter(p => p.cantidad_a_recibir > 0);
    
    if (productos_a_recibir.length === 0) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'Debe especificar la cantidad a recibir de al menos un producto',
        position: 'topRight'
      });
      return;
    }

    this.load_btn = true;

    const data = {
      productos_recibidos: productos_a_recibir.map(p => ({
        detalleordencompraid: p.detalleordencompraid,
        cantidad_recibida: p.cantidad_a_recibir
      }))
    };

    this._ordenCompraService.recibir_productos(this.id, data, this.token).subscribe(
      response => {
        iziToast.success({
          title: 'Éxito',
          message: response.message,
          position: 'topRight'
        });
        this._router.navigate(['/panel/ordenes-compra', this.id]);
        this.load_btn = false;
      },
      error => {
        console.log(error);
        let message = 'Error en el servidor';
        if (error.error && error.error.error) {
          message = error.error.error;
        }
        
        iziToast.error({
          title: 'Error',
          message: message,
          position: 'topRight'
        });
        this.load_btn = false;
      }
    );
  }

  calcular_porcentaje_recibido(producto: any): number {
    if (producto.cantidad_ordenada === 0) return 0;
    return (producto.cantidad_recibida_anteriormente / producto.cantidad_ordenada) * 100;
  }

  get_progreso_class(porcentaje: number): string {
    if (porcentaje === 0) return 'bg-secondary';
    if (porcentaje < 50) return 'bg-danger';
    if (porcentaje < 100) return 'bg-warning';
    return 'bg-success';
  }
}