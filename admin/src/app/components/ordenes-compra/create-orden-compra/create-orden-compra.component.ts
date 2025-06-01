import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrdenCompraService } from '../../../services/orden-compra.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { ProductoService } from '../../../services/producto.service';

declare var iziToast: any;

@Component({
  selector: 'app-create-orden-compra',
  templateUrl: './create-orden-compra.component.html',
  styleUrls: ['./create-orden-compra.component.css']
})
export class CreateOrdenCompraComponent implements OnInit {

  public orden: any = {
    proveedorid: '',
    fecha_entrega_esperada: '',
    observaciones: '',
    metodo_pago: '',
    descuento_porcentaje: 0,
    impuesto_porcentaje: 0,
    productos: []
  };
  
  public proveedores: Array<any> = [];
  public productos: Array<any> = [];
  public productos_proveedor: Array<any> = [];
  public token;
  public load_btn = false;
  public load_proveedores = true;
  public load_productos = false;

  // Para agregar productos
  public producto_seleccionado: any = {};
  public cantidad_producto = 1;
  public precio_unitario = 0;
  public descuento_porcentaje = 0;

  constructor(
    private _ordenCompraService: OrdenCompraService,
    private _proveedorService: ProveedorService,
    private _productoService: ProductoService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this.cargar_proveedores();
    this.cargar_productos();
  }

  cargar_proveedores() {
    this._proveedorService.listar_proveedores('', 'Activo', this.token).subscribe(
      response => {
        this.proveedores = response;
        this.load_proveedores = false;
      },
      error => {
        console.log(error);
        this.load_proveedores = false;
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

  on_proveedor_change() {
    if (this.orden.proveedorid) {
      this.load_productos = true;
      this._proveedorService.obtener_productos_proveedor(this.orden.proveedorid, this.token).subscribe(
        response => {
          this.productos_proveedor = response;
          this.load_productos = false;
        },
        error => {
          console.log(error);
          this.load_productos = false;
        }
      );
    }
  }

  on_producto_change() {
    if (this.producto_seleccionado.productoid) {
      // Buscar el producto para obtener el precio sugerido
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

  registro(registroForm: any) {
    if (registroForm.valid && this.orden.productos.length > 0) {
      this.load_btn = true;
      
      // Preparar datos para enviar al backend
      const ordenData = {
        proveedorid: this.orden.proveedorid,
        fecha_entrega_esperada: this.orden.fecha_entrega_esperada,
        observaciones: this.orden.observaciones,
        metodo_pago: this.orden.metodo_pago,
        descuento_porcentaje: this.orden.descuento_porcentaje / 100, // Convertir a decimal
        impuesto_porcentaje: this.orden.impuesto_porcentaje / 100,   // Convertir a decimal
        productos: this.orden.productos.map((p: any) => ({
          productoid: p.productoid,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          descuento_porcentaje: p.descuento_porcentaje / 100 // Convertir a decimal
        }))
      };
      
      this._ordenCompraService.crear_orden_compra(ordenData, this.token).subscribe(
        response => {
          iziToast.success({
            title: 'Éxito',
            message: response.message,
            position: 'topRight'
          });
          this._router.navigate(['/panel/ordenes-compra']);
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