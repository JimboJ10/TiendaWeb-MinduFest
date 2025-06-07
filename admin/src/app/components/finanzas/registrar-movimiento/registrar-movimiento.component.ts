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
  public tipos = ['Ingreso', 'Egreso'];
  public categorias: any = {
    'Ingreso': ['Ventas', 'Otros Ingresos', 'Ingresos Financieros'],
    'Egreso': ['Compras', 'Gastos Administrativos', 'Gastos de Ventas', 'Gastos Financieros', 'Otros Gastos']
  };
  public metodos_pago = ['Efectivo', 'Transferencia Bancaria', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Cheque'];
  public cuentas: Array<any> = [];

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
        // Filtrar solo cuentas de caja y bancos
        this.cuentas = response.filter((cuenta: any) => 
          cuenta.codigo.startsWith('110') || cuenta.nombre.toLowerCase().includes('caja') || cuenta.nombre.toLowerCase().includes('banco')
        );
      },
      error => {
        console.log(error);
      }
    );
  }

  get categorias_disponibles() {
    return this.movimiento.tipo ? this.categorias[this.movimiento.tipo] || [] : [];
  }

  on_tipo_change() {
    this.movimiento.categoria = '';
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