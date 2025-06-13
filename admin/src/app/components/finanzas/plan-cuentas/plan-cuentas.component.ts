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
  public nivel_filtro = '';
  public estado_filtro = 'Activo';
  public tipos_cuenta = ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto'];
  public page = 1;
  public pageSize = 15;
  public Math = Math; // Para usar Math.min en el template

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
        // Filtrar por nivel si está seleccionado
        this.cuentas = this.nivel_filtro 
          ? response.filter((cuenta: any) => cuenta.nivel.toString() === this.nivel_filtro)
          : response;
        
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
        iziToast.error({
          title: 'Error',
          message: 'Error al cargar el plan de cuentas',
          position: 'topRight'
        });
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
    this.nivel_filtro = '';
    this.estado_filtro = 'Activo';
    this.page = 1;
    this.cargar_cuentas();
  }

  // Métodos para contadores
  getContadorTipo(tipo: string): number {
    return this.cuentas.filter(c => c.tipo === tipo).length;
  }

  // Métodos para colores y estilos
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

  getCardColorTipo(tipo: string): string {
    switch (tipo) {
      case 'Activo': return 'bg-gradient-success text-white';
      case 'Pasivo': return 'bg-gradient-danger text-white';
      case 'Patrimonio': return 'bg-gradient-primary text-white';
      case 'Ingreso': return 'bg-gradient-info text-white';
      case 'Gasto': return 'bg-gradient-warning text-white';
      default: return 'bg-gradient-secondary text-white';
    }
  }

  getBadgeTipo(tipo: string): string {
    switch (tipo) {
      case 'Activo': return 'badge-success';
      case 'Pasivo': return 'badge-danger';
      case 'Patrimonio': return 'badge-primary';
      case 'Ingreso': return 'badge-info';
      case 'Gasto': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  getIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'Activo': return 'fa fa-coins';
      case 'Pasivo': return 'fa fa-credit-card';
      case 'Patrimonio': return 'fa fa-user-tie';
      case 'Ingreso': return 'fa fa-chart-line';
      case 'Gasto': return 'fa fa-chart-line-down';
      default: return 'fa fa-folder';
    }
  }

  getColorNivel(nivel: number): string {
    const colores = ['#007bff', '#28a745', '#ffc107'];
    return colores[nivel - 1] || '#6c757d';
  }

  // Navegación
  crear_cuenta() {
    this._router.navigate(['/panel/finanzas/plan-cuentas/crear']);
  }

  editar_cuenta(id: string) {
    this._router.navigate(['/panel/finanzas/plan-cuentas/editar', id]);
  }

  // Optimización para ngFor
  trackByCuenta(index: number, cuenta: any): any {
    return cuenta.cuentaid;
  }
}