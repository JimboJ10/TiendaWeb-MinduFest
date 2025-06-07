import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-crear-cuenta',
  templateUrl: './crear-cuenta.component.html',
  styleUrls: ['./crear-cuenta.component.css']
})
export class CrearCuentaComponent implements OnInit {

  public token: string;
  public cuenta: any = {
    nivel: 1
  };
  public load_btn = false;
  public tipos_cuenta = ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto'];
  public subtipos_por_tipo: any = {
    'Activo': ['Corriente', 'No Corriente', 'Fijo'],
    'Pasivo': ['Corriente', 'No Corriente'],
    'Patrimonio': ['Capital', 'Utilidades', 'Reservas'],
    'Ingreso': ['Operacional', 'No Operacional'],
    'Gasto': ['Operacional', 'No Operacional']
  };
  public cuentas_padre: Array<any> = [];

  constructor(
    private _financieroService: FinancieroService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_cuentas_padre();
  }

  cargar_cuentas_padre() {
    this._financieroService.listar_plan_cuentas('', '', 'Activo', this.token).subscribe(
      response => {
        this.cuentas_padre = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  get subtipos_disponibles() {
    return this.cuenta.tipo ? this.subtipos_por_tipo[this.cuenta.tipo] || [] : [];
  }

  on_tipo_change() {
    this.cuenta.subtipo = '';
  }

  crear(crearForm: any) {
    if (crearForm.valid) {
      this.load_btn = true;

      this._financieroService.crear_cuenta_contable(this.cuenta, this.token).subscribe(
        response => {
          iziToast.success({
            title: 'Éxito',
            message: response.message,
            position: 'topRight'
          });
          this._router.navigate(['/panel/finanzas/plan-cuentas']);
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