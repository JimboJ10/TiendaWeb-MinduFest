import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../../services/reportes.service';
import { Router } from '@angular/router';
import { TransaccionPago, ResumenEstadoPagos, ReporteEstadoPagos } from '../../../models/reportes.model';

declare let $: any;
declare let iziToast: any;

@Component({
  selector: 'app-reporte-estado-pagos',
  templateUrl: './reporte-estado-pagos.component.html',
  styleUrls: ['./reporte-estado-pagos.component.css']
})
export class ReporteEstadoPagosComponent implements OnInit {

  public token: string = '';
  public load_data: boolean = true;
  public transacciones: TransaccionPago[] = [];
  public transacciones_filtradas: TransaccionPago[] = [];
  public resumen: ResumenEstadoPagos = {
    total_transacciones: 0,
    pagos_exitosos: 0,
    pagos_fallidos: 0,
    entregas_completadas: 0,
    ventas_canceladas: 0,
    en_proceso: 0,
    total_cobrado: 0,
    total_perdido: 0,
    clientes_afectados: 0
  };

  // Filtros
  public fecha_corte: string = '';
  public filtro_estado_pago: string = 'todos';
  public filtro_estado_venta: string = 'todos';
  public filtro_busqueda: string = '';

  // Paginación
  public page: number = 1;
  public pageSize: number = 10;

  // Estados únicos para filtros
  public estados_pago: string[] = [];
  public estados_venta: string[] = [];

  Math = Math;

  constructor(
    private _reportesService: ReportesService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.inicializar_fecha();
    this.generar_reporte();
  }

  inicializar_fecha(): void {
    const hoy = new Date();
    this.fecha_corte = hoy.toISOString().split('T')[0];
  }

  generar_reporte(): void {
    if (!this.fecha_corte) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'Debe seleccionar una fecha de corte',
        position: 'topRight'
      });
      return;
    }

    this.load_data = true;

    this._reportesService.reporte_estado_pagos(this.fecha_corte, this.token).subscribe(
      (response: ReporteEstadoPagos) => {
        console.log('Respuesta del reporte:', response);
        
        this.transacciones = response.transacciones;
        this.resumen = response.resumen;
        this.transacciones_filtradas = [...this.transacciones];
        
        // Extraer estados únicos para filtros
        this.extraer_estados_unicos();
        
        this.aplicar_filtros();
        this.load_data = false;

        if (response.mensaje) {
          iziToast.info({
            title: 'Información',
            message: response.mensaje,
            position: 'topRight'
          });
        }
      },
      error => {
        console.error('Error al obtener reporte:', error);
        this.load_data = false;
        iziToast.error({
          title: 'Error',
          message: 'Error al cargar el reporte de estado de pagos',
          position: 'topRight'
        });
      }
    );
  }

  extraer_estados_unicos(): void {
    this.estados_pago = [...new Set(this.transacciones.map(t => t.estado_pago))].sort();
    this.estados_venta = [...new Set(this.transacciones.map(t => t.estado_venta))].sort();
  }

  aplicar_filtros(): void {
    let transacciones_temp = [...this.transacciones];

    // Filtro por estado de pago
    if (this.filtro_estado_pago !== 'todos') {
      transacciones_temp = transacciones_temp.filter(t => 
        t.estado_pago === this.filtro_estado_pago
      );
    }

    // Filtro por estado de venta
    if (this.filtro_estado_venta !== 'todos') {
      transacciones_temp = transacciones_temp.filter(t => 
        t.estado_venta === this.filtro_estado_venta
      );
    }

    // Filtro de búsqueda
    if (this.filtro_busqueda.trim()) {
      const busqueda = this.filtro_busqueda.toLowerCase().trim();
      transacciones_temp = transacciones_temp.filter(t => 
        t.nventa.toLowerCase().includes(busqueda) ||
        t.cliente.toLowerCase().includes(busqueda) ||
        t.email.toLowerCase().includes(busqueda) ||
        (t.pais && t.pais.toLowerCase().includes(busqueda))
      );
    }

    this.transacciones_filtradas = transacciones_temp;
    this.page = 1; // Reiniciar paginación
  }

  limpiar_filtros(): void {
    this.filtro_estado_pago = 'todos';
    this.filtro_estado_venta = 'todos';
    this.filtro_busqueda = '';
    this.aplicar_filtros();
  }

  // Métodos de formateo
  formatear_fecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatear_moneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  }

  // Métodos para clases CSS
  get_badge_estado_pago(estado: string): string {
    switch (estado) {
      case 'Pagado': return 'badge-success';
      case 'Error de Pago': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  get_badge_estado_venta(estado: string): string {
    switch (estado) {
      case 'Completado': return 'badge-success';
      case 'Entregado': return 'badge-success';
      case 'En Envío': return 'badge-info';
      case 'En Preparación': return 'badge-warning';
      case 'Procesando': return 'badge-secondary';
      case 'Cancelado': return 'badge-danger';
      default: return 'badge-light';
    }
  }

  get_color_riesgo(dias: number): string {
    if (dias <= 7) return 'text-success';
    if (dias <= 30) return 'text-warning';
    return 'text-danger';
  }

  calcular_porcentaje_exitoso(): number {
    if (this.resumen.total_transacciones === 0) return 0;
    return (this.resumen.pagos_exitosos / this.resumen.total_transacciones) * 100;
  }

  calcular_porcentaje_fallido(): number {
    if (this.resumen.total_transacciones === 0) return 0;
    return (this.resumen.pagos_fallidos / this.resumen.total_transacciones) * 100;
  }

  // Exportar datos
  exportar_csv(): void {
    if (!this.transacciones_filtradas.length) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'No hay datos para exportar',
        position: 'topRight'
      });
      return;
    }

    const headers = [
      'ID Venta', 'Número Venta', 'Fecha', 'Cliente', 'Email', 'País',
      'Total Venta', 'Estado Pago', 'Estado Venta', 'Método Pago', 'Días Transcurridos'
    ];

    const csvContent = [
      headers.join(','),
      ...this.transacciones_filtradas.map(t => [
        t.ventaid,
        `"${t.nventa}"`,
        `"${this.formatear_fecha(t.fecha)}"`,
        `"${t.cliente}"`,
        `"${t.email}"`,
        `"${t.pais || ''}"`,
        t.total_venta,
        `"${t.estado_pago}"`,
        `"${t.estado_venta}"`,
        `"${t.metodo_pago}"`,
        t.dias_transcurridos
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estado_pagos_${this.fecha_corte}.csv`;
    link.click();

    iziToast.success({
      title: 'Éxito',
      message: 'Reporte exportado correctamente',
      position: 'topRight'
    });
  }

  obtener_telefono_seguro(transaccion: TransaccionPago): string {
    return transaccion.telefono || 'No disponible';
  }

  // Navegación
  regresar(): void {
    this._router.navigate(['/panel/reportes']);
  }
}