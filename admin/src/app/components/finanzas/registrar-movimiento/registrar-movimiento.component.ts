import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-registrar-movimiento',
  templateUrl: './registrar-movimiento.component.html',
  styleUrls: ['./registrar-movimiento.component.css']
})
export class RegistrarMovimientoComponent implements OnInit {

  public token;
  public movimiento: any = {
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Ingreso',
    estado: 'Confirmado'
  };
  public load_btn = false;
  public load_ordenes = false;
  public tipos = ['Ingreso', 'Egreso'];
  public categorias: any = {
    'Ingreso': ['Ventas', 'Otros Ingresos', 'Ingresos Financieros'],
    'Egreso': ['Compras', 'Gastos Administrativos', 'Gastos de Ventas', 'Gastos Financieros', 'Otros Gastos']
  };
  public metodos_pago = ['Efectivo', 'Transferencia Bancaria', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Cheque', 'PayPal'];
  public cuentas: Array<any> = [];
  public ordenes_pendientes: Array<any> = [];
  public es_pago_proveedor = false;

  constructor(
    private _financieroService: FinancieroService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_cuentas();
  }

  cargar_cuentas() {
    this._financieroService.listar_plan_cuentas('', '', 'Activo', this.token).subscribe(
      response => {
        // Mostrar todas las cuentas activas de nivel 3 para el selector
        this.cuentas = response.filter((cuenta: any) => 
          cuenta.nivel >= 3 && cuenta.estado === 'Activo'
        );
        
        // Ordenar por código para mejor visualización
        this.cuentas.sort((a, b) => a.codigo.localeCompare(b.codigo));
      },
      error => {
        console.log(error);
      }
    );
  }

  // NUEVAS FUNCIONES HELPER para filtrar cuentas por tipo
  get cuentas_activo() {
    return this.cuentas.filter(cuenta => cuenta.tipo === 'Activo');
  }

  get cuentas_pasivo() {
    return this.cuentas.filter(cuenta => cuenta.tipo === 'Pasivo');
  }

  get cuentas_patrimonio() {
    return this.cuentas.filter(cuenta => cuenta.tipo === 'Patrimonio');
  }

  get cuentas_ingreso() {
    return this.cuentas.filter(cuenta => cuenta.tipo === 'Ingreso');
  }

  get cuentas_gasto() {
    return this.cuentas.filter(cuenta => cuenta.tipo === 'Gasto');
  }

  cargar_ordenes_pendientes() {
    if (this.es_pago_proveedor) {
      this.load_ordenes = true;
      this._financieroService.listar_ordenes_pendientes_pago('', this.token).subscribe(
        response => {
          this.ordenes_pendientes = response;
          this.load_ordenes = false;
        },
        error => {
          console.log(error);
          this.load_ordenes = false;
        }
      );
    }
  }

  get categorias_disponibles() {
    return this.movimiento.tipo ? this.categorias[this.movimiento.tipo] || [] : [];
  }

  on_tipo_change() {
    this.movimiento.categoria = '';
    if (this.movimiento.tipo === 'Egreso') {
      this.es_pago_proveedor = false;
      this.movimiento.orden_compra_id = '';
      this.movimiento.referencia_documento = '';
    }
  }

  on_categoria_change() {
    if (this.movimiento.categoria === 'Compras' && this.movimiento.tipo === 'Egreso') {
      this.es_pago_proveedor = true;
      this.cargar_ordenes_pendientes();
    } else {
      this.es_pago_proveedor = false;
      this.movimiento.orden_compra_id = '';
    }
  }

  on_orden_change() {
    const orden_seleccionada = this.ordenes_pendientes.find(o => o.ordencompraid == this.movimiento.orden_compra_id);
    if (orden_seleccionada) {
      this.movimiento.referencia_documento = orden_seleccionada.numero_orden;
      this.movimiento.concepto = `Pago orden de compra ${orden_seleccionada.numero_orden} - ${orden_seleccionada.proveedor}`;
      if (!this.movimiento.monto) {
        this.movimiento.monto = orden_seleccionada.saldo_pendiente;
      }
    }
  }

  registrar(registrarForm: any) {
    if (registrarForm.valid) {
      if (!this.movimiento.monto || this.movimiento.monto <= 0) {
        iziToast.error({
          title: 'Error',
          message: 'El monto debe ser mayor a 0',
          position: 'topRight'
        });
        return;
      }

      if (this.es_pago_proveedor && this.movimiento.categoria === 'Compras' && !this.movimiento.referencia_documento) {
        iziToast.error({
          title: 'Error',
          message: 'Para pagos de compras debe especificar la referencia del documento',
          position: 'topRight'
        });
        return;
      }

      this.load_btn = true;

      this._financieroService.registrar_movimiento_caja(this.movimiento, this.token).subscribe(
        response => {
          iziToast.success({
            title: 'Éxito',
            message: response.message,
            position: 'topRight'
          });
          this._router.navigate(['/panel/finanzas/flujo-caja']);
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
        message: 'Complete todos los campos requeridos',
        position: 'topRight'
      });
    }
  }
}