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

  public token: string;
  public asientos: Array<any> = [];
  public load_data = true;
  public fecha_desde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  public fecha_hasta = new Date().toISOString().split('T')[0];
  public tipo_documento = '';
  public estado_filtro = '';
  public tipo_asiento_filtro = '';
  public tipos_documento = ['Venta', 'Compra', 'Pago', 'Cobro', 'Ajuste', 'Otro'];
  public estados = ['Pendiente', 'Aprobado', 'Anulado'];
  public page = 1;
  public pageSize = 10;
  public Math = Math; // Para usar Math.min en el template

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
        // Filtrar por tipo de asiento si está seleccionado
        this.asientos = this.tipo_asiento_filtro 
          ? response.filter((asiento: any) => asiento.tipo_asiento === this.tipo_asiento_filtro)
          : response;
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
        iziToast.error({
          title: 'Error',
          message: 'Error al cargar los asientos contables',
          position: 'topRight'
        });
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
    this.tipo_asiento_filtro = '';
    this.page = 1;
    this.cargar_asientos();
  }

  // Métodos para contadores del resumen
  getContadorEstado(estado: string): number {
    return this.asientos.filter(a => a.estado === estado).length;
  }

  getContadorTipo(tipo: string): number {
    return this.asientos.filter(a => a.tipo_asiento === tipo).length;
  }

  // Métodos para badges y estilos
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

  getIconoEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'fa fa-clock';
      case 'Aprobado': return 'fa fa-check-circle';
      case 'Anulado': return 'fa fa-times-circle';
      default: return 'fa fa-question-circle';
    }
  }

  getIconoTipoAsiento(tipo: string): string {
    switch (tipo) {
      case 'Manual': return 'fa fa-pencil-alt';
      case 'Automatico': return 'fa fa-robot';
      case 'Ajuste': return 'fa fa-wrench';
      default: return 'fa fa-file';
    }
  }

  // Navegación
  crear_asiento() {
    this._router.navigate(['/panel/finanzas/asientos/crear']);
  }

  ver_asiento(id: string) {
    this._router.navigate(['/panel/finanzas/asientos/ver', id]);
  }

  editar_asiento(id: string) {
    // TODO: Implementar ruta de edición si es necesario
    iziToast.info({
      title: 'Información',
      message: 'Función de edición próximamente disponible',
      position: 'topRight'
    });
  }

  aprobar_asiento(id: string) {
    iziToast.question({
      timeout: 20000,
      close: false,
      overlay: true,
      displayMode: 'once',
      id: 'question',
      zindex: 999,
      title: 'Confirmar',
      message: '¿Está seguro de aprobar este asiento contable?',
      position: 'center',
      buttons: [
        ['<button><b>SÍ</b></button>', (instance: any, toast: any) => {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          
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
        }, true],
        ['<button>NO</button>', (instance: any, toast: any) => {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
        }]
      ]
    });
  }

  // Optimización para ngFor
  trackByAsiento(index: number, asiento: any): any {
    return asiento.asientoid;
  }
}