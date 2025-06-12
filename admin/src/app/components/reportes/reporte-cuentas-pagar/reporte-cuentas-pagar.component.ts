import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../../services/reportes.service';
import { Router } from '@angular/router';
import { CuentaPorPagar, ResumenCuentasPagar, ReporteCuentasPagar } from '../../../models/reportes.model';

declare let $: any;
declare let iziToast: any;

@Component({
  selector: 'app-reporte-cuentas-pagar',
  templateUrl: './reporte-cuentas-pagar.component.html',
  styleUrls: ['./reporte-cuentas-pagar.component.css']
})
export class ReporteCuentasPagarComponent implements OnInit {

  public token: string = '';
  public load_data: boolean = true;
  public ordenes: CuentaPorPagar[] = [];
  public ordenes_filtradas: CuentaPorPagar[] = [];
  public resumen: ResumenCuentasPagar = {
    total_ordenes: 0,
    total_por_pagar: 0,
    antiguedad_0_30: 0,
    antiguedad_31_60: 0,
    antiguedad_61_90: 0,
    antiguedad_mas_90: 0
  };

  // Filtros
  public fecha_corte: string = '';
  public filtro_estado: string = 'todos';
  public filtro_proveedor: string = 'todos';
  public filtro_busqueda: string = '';

  // Paginación
  public page: number = 1;
  public pageSize: number = 10;

  // Estados únicos para filtros
  public estados: string[] = [];
  public proveedores: string[] = [];

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

    this._reportesService.reporte_cuentas_por_pagar(this.fecha_corte, this.token).subscribe(
      (response: ReporteCuentasPagar) => {
        console.log('Respuesta del reporte:', response);
        
        this.ordenes = response.ordenes;
        this.resumen = response.resumen;
        this.ordenes_filtradas = [...this.ordenes];
        
        // Extraer valores únicos para filtros
        this.extraer_valores_unicos();
        
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
          message: 'Error al cargar el reporte de cuentas por pagar',
          position: 'topRight'
        });
      }
    );
  }

  extraer_valores_unicos(): void {
    this.estados = [...new Set(this.ordenes.map(o => o.estado))].sort();
    this.proveedores = [...new Set(this.ordenes.map(o => o.proveedor))].sort();
  }

  aplicar_filtros(): void {
    let ordenes_temp = [...this.ordenes];

    // Filtro por estado
    if (this.filtro_estado !== 'todos') {
      ordenes_temp = ordenes_temp.filter(o => o.estado === this.filtro_estado);
    }

    // Filtro por proveedor
    if (this.filtro_proveedor !== 'todos') {
      ordenes_temp = ordenes_temp.filter(o => o.proveedor === this.filtro_proveedor);
    }

    // Filtro de búsqueda
    if (this.filtro_busqueda.trim()) {
      const busqueda = this.filtro_busqueda.toLowerCase().trim();
      ordenes_temp = ordenes_temp.filter(o => 
        o.numero_orden.toLowerCase().includes(busqueda) ||
        o.proveedor.toLowerCase().includes(busqueda) ||
        o.email.toLowerCase().includes(busqueda)
      );
    }

    this.ordenes_filtradas = ordenes_temp;
    this.page = 1; // Reiniciar paginación
  }

  limpiar_filtros(): void {
    this.filtro_estado = 'todos';
    this.filtro_proveedor = 'todos';
    this.filtro_busqueda = '';
    this.aplicar_filtros();
  }

  // Métodos de formateo
  formatear_fecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatear_moneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  }

  // Métodos para clases CSS
  get_badge_estado(estado: string): string {
    switch (estado) {
      case 'Recibida Completa': return 'badge-success';
      case 'Parcialmente Recibida': return 'badge-warning';
      case 'Confirmada': return 'badge-info';
      case 'Pendiente': return 'badge-secondary';
      case 'Cancelada': return 'badge-danger';
      default: return 'badge-light';
    }
  }

  get_badge_antiguedad(rango: string): string {
    switch (rango) {
      case '0-30 días': return 'badge-success';
      case '31-60 días': return 'badge-warning';
      case '61-90 días': return 'badge-danger';
      case 'Más de 90 días': return 'badge-dark';
      default: return 'badge-light';
    }
  }

  get_color_urgencia(dias: number): string {
    if (dias <= 30) return 'text-success';
    if (dias <= 60) return 'text-warning';
    return 'text-danger';
  }

  calcular_porcentaje_antiguedad(valor: number): number {
    if (this.resumen.total_por_pagar === 0) return 0;
    return (valor / this.resumen.total_por_pagar) * 100;
  }

  // Exportar datos
  exportar_csv(): void {
    if (!this.ordenes_filtradas.length) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'No hay datos para exportar',
        position: 'topRight'
      });
      return;
    }

    const headers = [
      'ID Orden', 'Número Orden', 'Fecha Orden', 'Proveedor', 'Email', 'Teléfono',
      'Total Orden', 'Saldo Pendiente', 'Estado', 'Días Orden', 'Rango Antigüedad'
    ];

    const csvContent = [
      headers.join(','),
      ...this.ordenes_filtradas.map(o => [
        o.ordencompraid,
        `"${o.numero_orden}"`,
        `"${this.formatear_fecha(o.fecha_orden)}"`,
        `"${o.proveedor}"`,
        `"${o.email}"`,
        `"${o.telefono || ''}"`,
        o.total_orden,
        o.saldo_pendiente,
        `"${o.estado}"`,
        o.dias_desde_orden,
        `"${o.rango_antiguedad}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cuentas_por_pagar_${this.fecha_corte}.csv`;
    link.click();

    iziToast.success({
      title: 'Éxito',
      message: 'Reporte exportado correctamente',
      position: 'topRight'
    });
  }

  obtener_telefono_seguro(orden: CuentaPorPagar): string {
    return orden.telefono || 'No disponible';
  }

  // Navegación
  regresar(): void {
    this._router.navigate(['/panel/reportes']);
  }

  ver_orden(ordenId: number): void {
    this._router.navigate(['/panel/ordenes-compra', ordenId]);
  }
}