import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OrdenCompraService } from '../../../services/orden-compra.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { ProductoService } from '../../../services/producto.service';

declare var iziToast: any;

@Component({
  selector: 'app-edit-orden-compra',
  templateUrl: './edit-orden-compra.component.html',
  styleUrls: ['./edit-orden-compra.component.css']
})
export class EditOrdenCompraComponent implements OnInit {

  public orden: any = {
    productos: []
  };
  public id: any;
  public proveedores: Array<any> = [];
  public productos: Array<any> = [];
  public token;
  public load_btn = false;
  public load_data = true;

  // Para agregar productos
  public producto_seleccionado: any = {};
  public cantidad_producto = 1;
  public precio_unitario = 0;
  public descuento_porcentaje = 0;

  constructor(
    private _ordenCompraService: OrdenCompraService,
    private _proveedorService: ProveedorService,
    private _productoService: ProductoService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.obtenerOrden();
      this.cargar_proveedores();
      this.cargar_productos();
    });
  }

  obtenerOrden() {
    this._ordenCompraService.obtener_orden_compra(this.id, this.token).subscribe(
      response => {
        if (response) {
          this.orden = {
            proveedorid: response.proveedorid,
            fecha_entrega_esperada: response.fecha_entrega_esperada?.split('T')[0],
            observaciones: response.observaciones,
            metodo_pago: response.metodo_pago,
            descuento_porcentaje: 0, // Inicializar en 0, se calculará después
            impuesto_porcentaje: 0,  // Inicializar en 0, se calculará después
            productos: response.detalles.map((detalle: any) => {
              // Calcular porcentaje de descuento del producto
              const precio_base = detalle.cantidad * detalle.precio_unitario;
              const descuento_porcentaje = precio_base > 0 ? (detalle.descuento_item / precio_base) * 100 : 0;
              
              return {
                productoid: detalle.productoid,
                titulo: detalle.producto_titulo,
                cantidad: detalle.cantidad,
                precio_unitario: detalle.precio_unitario,
                descuento_porcentaje: descuento_porcentaje,
                descuento_dolares: detalle.descuento_item || 0,
                subtotal: detalle.subtotal
              };
            })
          };
          
          // Calcular porcentajes generales basados en los valores actuales
          if (response.subtotal > 0) {
            this.orden.descuento_porcentaje = (response.descuento / response.subtotal) * 100;
            const base_impuesto = response.subtotal - response.descuento;
            if (base_impuesto > 0) {
              this.orden.impuesto_porcentaje = (response.impuestos / base_impuesto) * 100;
            }
          }
          
          this.calcular_totales();
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

  cargar_proveedores() {
    this._proveedorService.listar_proveedores('', 'Activo', this.token).subscribe(
      response => {
        this.proveedores = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  cargar_productos() {
    this._productoService.listarProductos().subscribe(
      response => {
        this.productos = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  on_producto_change() {
    if (this.producto_seleccionado.productoid) {
      const producto = this.productos.find(p => p.productoid == this.producto_seleccionado.productoid);
      if (producto) {
        this.precio_unitario = producto.precio;
      }
    }
  }

  agregar_producto() {
    if (!this.producto_seleccionado.productoid || this.cantidad_producto <= 0 || this.precio_unitario <= 0) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'Complete todos los campos del producto',
        position: 'topRight'
      });
      return;
    }

    const existe = this.orden.productos.find((p: any) => p.productoid == this.producto_seleccionado.productoid);
    if (existe) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'Este producto ya está en la orden',
        position: 'topRight'
      });
      return;
    }

    const producto = this.productos.find(p => p.productoid == this.producto_seleccionado.productoid);
    
    // Cálculo con porcentajes
    const precio_base = this.cantidad_producto * this.precio_unitario;
    const descuento_dolares = precio_base * (this.descuento_porcentaje / 100);
    const subtotal = precio_base - descuento_dolares;

    this.orden.productos.push({
      productoid: this.producto_seleccionado.productoid,
      titulo: producto.titulo,
      cantidad: this.cantidad_producto,
      precio_unitario: this.precio_unitario,
      descuento_porcentaje: this.descuento_porcentaje,
      descuento_dolares: descuento_dolares,
      subtotal: subtotal
    });

    // Limpiar formulario
    this.producto_seleccionado = {};
    this.cantidad_producto = 1;
    this.precio_unitario = 0;
    this.descuento_porcentaje = 0;

    this.calcular_totales();
  }

  eliminar_producto(index: number) {
    this.orden.productos.splice(index, 1);
    this.calcular_totales();
  }

  actualizar_subtotal(index: number) {
    const producto = this.orden.productos[index];
    const precio_base = producto.cantidad * producto.precio_unitario;
    producto.descuento_dolares = precio_base * (producto.descuento_porcentaje / 100);
    producto.subtotal = precio_base - producto.descuento_dolares;
    this.calcular_totales();
  }

  calcular_totales() {
    let subtotal = 0;
    this.orden.productos.forEach((producto: any) => {
      subtotal += producto.subtotal;
    });

    // Calcular descuento general en dólares
    const descuento_general_dolares = subtotal * (this.orden.descuento_porcentaje / 100);
    
    // Base para impuestos
    const base_impuesto = subtotal - descuento_general_dolares;
    
    // Calcular impuestos en dólares
    const impuestos_dolares = base_impuesto * (this.orden.impuesto_porcentaje / 100);

    this.orden.subtotal = subtotal;
    this.orden.descuento_dolares = descuento_general_dolares;
    this.orden.impuestos_dolares = impuestos_dolares;
    this.orden.total = base_impuesto + impuestos_dolares;
  }

  on_porcentaje_change() {
    this.calcular_totales();
  }

  actualizar(actualizarForm: any) {
    if (actualizarForm.valid && this.orden.productos.length > 0) {
      this.load_btn = true;
      
      // Preparar datos para enviar al backend
      const ordenData = {
        proveedorid: this.orden.proveedorid,
        fecha_entrega_esperada: this.orden.fecha_entrega_esperada,
        observaciones: this.orden.observaciones,
        metodo_pago: this.orden.metodo_pago,
        descuento_porcentaje: this.orden.descuento_porcentaje / 100,
        impuesto_porcentaje: this.orden.impuesto_porcentaje / 100,
        productos: this.orden.productos.map((p: any) => ({
          productoid: p.productoid,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          descuento_porcentaje: p.descuento_porcentaje / 100
        }))
      };
      
      this._ordenCompraService.actualizar_orden_compra(this.id, ordenData, this.token).subscribe(
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
    } else {
      iziToast.warning({
        title: 'Advertencia',
        message: 'Complete todos los campos requeridos y agregue al menos un producto',
        position: 'topRight'
      });
    }
  }
}