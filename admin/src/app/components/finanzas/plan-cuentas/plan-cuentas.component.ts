import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-plan-cuentas',
  templateUrl: './plan-cuentas.component.html',
  styleUrls: ['./plan-cuentas.component.css']
})
export class PlanCuentasComponent implements OnInit {

  public token: string;
  public cuentas: Array<any> = [];
  public load_data = true;
  public filtro = '';
  public tipo_filtro = '';
  public estado_filtro = 'Activo';
  public tipos_cuenta = ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto'];
  public page = 1;
  public pageSize = 10;

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
    this.load_data = true;
    this._financieroService.listar_plan_cuentas(this.filtro, this.tipo_filtro, this.estado_filtro, this.token).subscribe(
      response => {
        this.cuentas = response;
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
      }
    );
  }

  filtrar() {
    this.page = 1;
    this.cargar_cuentas();
  }

  resetear() {
    this.filtro = '';
    this.tipo_filtro = '';
    this.estado_filtro = 'Activo';
    this.page = 1;
    this.cargar_cuentas();
  }

  getColorTipoCuenta(tipo: string): string {
    switch (tipo) {
      case 'Activo': return 'text-success';
      case 'Pasivo': return 'text-danger';
      case 'Patrimonio': return 'text-primary';
      case 'Ingreso': return 'text-info';
      case 'Gasto': return 'text-warning';
      default: return 'text-muted';
    }
  }

  getBadgeEstado(estado: string): string {
    return estado === 'Activo' ? 'badge-success' : 'badge-secondary';
  }

  crear_cuenta() {
    this._router.navigate(['/panel/finanzas/plan-cuentas/crear']);
  }

  editar_cuenta(id: string) {
    this._router.navigate(['/panel/finanzas/plan-cuentas/editar', id]);
  }
}