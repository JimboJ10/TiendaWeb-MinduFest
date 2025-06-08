import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../../services/reportes.service';
import { ReporteMovimientos, MovimientoInventario } from '../../../models/reportes.model';

declare var iziToast: any;
declare var jsPDF: any;

@Component({
  selector: 'app-reporte-movimientos-inventario',
  templateUrl: './reporte-movimientos-inventario.component.html',
  styleUrls: ['./reporte-movimientos-inventario.component.css']
})
export class ReporteMovimientosInventarioComponent implements OnInit {

  public token: string;
  public reporte: ReporteMovimientos | null = null;
  public productos: any[] = [];
  public load_data = false;
  public load_productos = false;
  public filtros = {
    fecha_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    tipo_movimiento: 'todos',
    productoid: '',
    limite: '100'
  };
  public page = 1;
  public pageSize = 15;
  
  // Exponer Math para usar en el template
  public Math = Math;

  constructor(
    private _reportesService: ReportesService
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_productos();
    this.generar_reporte();
  }

  cargar_productos() {
    this.load_productos = true;
    
    // Crear un método específico para obtener productos
    this._reportesService.obtener_productos(this.token).subscribe(
      response => {
        console.log('Productos recibidos:', response);
        this.productos = response || [];
        this.load_productos = false;
      },
      error => {
        console.error('Error al cargar productos:', error);
        this.productos = [];
        this.load_productos = false;
      }
    );
  }

  generar_reporte() {
    this.load_data = true;
    console.log('Generando reporte de movimientos con filtros:', this.filtros);
    
    this._reportesService.reporte_movimientos_inventario(
      this.filtros.fecha_inicio,
      this.filtros.fecha_fin,
      this.filtros.tipo_movimiento,
      this.filtros.productoid,
      this.token
    ).subscribe(
      response => {
        console.log('Respuesta del reporte de movimientos:', response);
        this.reporte = response;
        this.load_data = false;
        
        // Mostrar mensaje informativo si no hay datos para ciertos tipos
        if ((response as any).mensaje && response.movimientos.length === 0) {
          iziToast.info({
            title: 'Información',
            message: (response as any).mensaje,
            position: 'topRight'
          });
        }
      },
      error => {
        console.error('Error en reporte de movimientos:', error);
        this.load_data = false;
        this.reporte = null;
        iziToast.error({
          title: 'Error',
          message: 'Error al generar el reporte: ' + (error.error?.message || error.message),
          position: 'topRight'
        });
      }
    );
  }

  exportar_excel() {
    if (!this.hayDatos) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'No hay datos para exportar',
        position: 'topRight'
      });
      return;
    }
    
    iziToast.info({
      title: 'Información',
      message: 'Función de exportación en desarrollo',
      position: 'topRight'
    });
  }

  generar_pdf() {
    if (!this.hayDatos) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'No hay datos para generar PDF',
        position: 'topRight'
      });
      return;
    }

    const element = document.getElementById('reporte-movimientos');
    if (element) {
      iziToast.info({
        title: 'Información',
        message: 'Función de PDF en desarrollo',
        position: 'topRight'
      });
    }
  }

  // ✅ Getters principales
  get hayDatos(): boolean {
    return !!(this.reporte?.movimientos && this.reporte.movimientos.length > 0);
  }

  get movimientosSeguras(): MovimientoInventario[] {
    return this.reporte?.movimientos || [];
  }

  get resumenSeguro() {
    return this.reporte?.resumen || {
      total_movimientos: 0,
      total_entradas: 0,
      total_salidas: 0,
      productos_afectados: 0,
      valor_total_movimientos: 0
    };
  }

  // ✅ Funciones de formateo y utilidad
  get_badge_movimiento(tipo_movimiento: string): string {
    switch (tipo_movimiento.toLowerCase()) {
      case 'venta':
        return 'badge-danger';
      case 'compra':
        return 'badge-success';
      case 'ajuste':
        return 'badge-warning';
      case 'devolucion':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  get_icono_movimiento(tipo_movimiento: string): string {
    switch (tipo_movimiento.toLowerCase()) {
      case 'venta':
        return 'fa-arrow-down';
      case 'compra':
        return 'fa-arrow-up';
      case 'ajuste':
        return 'fa-edit';
      case 'devolucion':
        return 'fa-undo';
      default:
        return 'fa-exchange-alt';
    }
  }

  get_color_direccion(direccion: string): string {
    return direccion === 'Entrada' ? 'text-success' : 'text-danger';
  }

  formatear_fecha(fecha: string): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatear_moneda(cantidad: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(cantidad || 0);
  }

  formatear_numero(numero: number): string {
    return new Intl.NumberFormat('es-ES').format(numero || 0);
  }

  get movimientos_por_tipo() {
    const tipos = ['Venta', 'Compra', 'Ajuste', 'Devolución'];
    return tipos.map(tipo => ({
      tipo,
      cantidad: this.movimientosSeguras.filter(m => m.tipo_movimiento === tipo).length,
      porcentaje: this.movimientosSeguras.length > 0 ? 
        (this.movimientosSeguras.filter(m => m.tipo_movimiento === tipo).length / this.movimientosSeguras.length) * 100 : 0
    }));
  }

  get movimientos_recientes(): MovimientoInventario[] {
    return this.movimientosSeguras.slice(0, 5);
  }

  obtener_contacto_seguro(movimiento: MovimientoInventario): string {
    return movimiento.cliente || movimiento.proveedor || 'N/A';
  }
}