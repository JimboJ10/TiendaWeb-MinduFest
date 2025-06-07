import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-asientos-contables',
  templateUrl: './asientos-contables.component.html',
  styleUrls: ['./asientos-contables.component.css']
})
export class AsientosContablesComponent implements OnInit {

  public token;
  public asientos: Array<any> = [];
  public load_data = true;
  public fecha_desde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  public fecha_hasta = new Date().toISOString().split('T')[0];
  public tipo_documento = '';
  public estado_filtro = '';
  public tipos_documento = ['Venta', 'Compra', 'Pago', 'Cobro', 'Ajuste', 'Otro'];
  public estados = ['Pendiente', 'Aprobado', 'Anulado'];
  public page = 1;
  public pageSize = 10;

  constructor(
    private _financieroService: FinancieroService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_asientos();
  }

  cargar_asientos() {
    this.load_data = true;
    this._financieroService.listar_asientos_contables(
      this.fecha_desde, 
      this.fecha_hasta, 
      this.tipo_documento, 
      this.estado_filtro, 
      this.token
    ).subscribe(
      response => {
        this.asientos = response;
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
    this.cargar_asientos();
  }

  resetear() {
    this.fecha_desde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.fecha_hasta = new Date().toISOString().split('T')[0];
    this.tipo_documento = '';
    this.estado_filtro = '';
    this.page = 1;
    this.cargar_asientos();
  }

  getBadgeEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'badge-warning';
      case 'Aprobado': return 'badge-success';
      case 'Anulado': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getBadgeTipoAsiento(tipo: string): string {
    switch (tipo) {
      case 'Manual': return 'badge-primary';
      case 'Automatico': return 'badge-info';
      case 'Ajuste': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  crear_asiento() {
    this._router.navigate(['/panel/finanzas/asientos/crear']);
  }

  ver_asiento(id: string) {
    this._router.navigate(['/panel/finanzas/asientos/ver', id]);
  }

  aprobar_asiento(id: string) {
    if (confirm('¿Está seguro de aprobar este asiento contable?')) {
      this._financieroService.aprobar_asiento_contable(id, this.token).subscribe(
        response => {
          iziToast.success({
            title: 'Éxito',
            message: 'Asiento aprobado correctamente',
            position: 'topRight'
          });
          this.cargar_asientos();
        },
        error => {
          console.log(error);
          iziToast.error({
            title: 'Error',
            message: 'Error al aprobar el asiento',
            position: 'topRight'
          });
        }
      );
    }
  }
}