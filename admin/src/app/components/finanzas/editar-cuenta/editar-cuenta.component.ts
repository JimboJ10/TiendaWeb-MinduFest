import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-editar-cuenta',
  templateUrl: './editar-cuenta.component.html',
  styleUrls: ['./editar-cuenta.component.css']
})
export class EditarCuentaComponent implements OnInit {

  public token: string;
  public cuenta: any = {
    nivel: 1,
    estado: 'Activo'
  };
  public id!: string;
  public load_btn = false;
  public load_data = true;
  public tipos_cuenta = ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto'];
  public subtipos_por_tipo: any = {
    'Activo': ['Corriente', 'No Corriente', 'Fijo', 'Principal'],
    'Pasivo': ['Corriente', 'No Corriente', ' Fijo', 'Principal'],
    'Patrimonio': ['Capital', 'Utilidades', 'Reservas', 'Ajustes'],
    'Ingreso': ['Operacional', 'No Operacional'],
    'Gasto': ['Operacional', 'No Operacional']
  };
  public cuentas_padre: Array<any> = [];

  constructor(
    private _financieroService: FinancieroService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.cargar_cuenta();
      this.cargar_cuentas_padre();
    });
  }

  cargar_cuenta() {
    this.load_data = true;
    this._financieroService.obtener_cuenta_contable(this.id, this.token).subscribe(
      response => {
        if (response) {
          this.cuenta = response;
          this.load_data = false;
        } else {
          this._router.navigate(['/panel/finanzas/plan-cuentas']);
        }
      },
      error => {
        console.log(error);
        iziToast.error({
          title: 'Error',
          message: 'No se pudo obtener la información de la cuenta',
          position: 'topRight'
        });
        this._router.navigate(['/panel/finanzas/plan-cuentas']);
      }
    );
  }

  cargar_cuentas_padre() {
    this._financieroService.listar_plan_cuentas('', '', 'Activo', this.token).subscribe(
      response => {
        // Filtrar la cuenta actual para evitar dependencias circulares
        this.cuentas_padre = response.filter((cuenta: any) => cuenta.cuentaid != this.id);
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

  actualizar(actualizarForm: any) {
    if (actualizarForm.valid) {
      this.load_btn = true;

      this._financieroService.actualizar_cuenta_contable(this.id, this.cuenta, this.token).subscribe(
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