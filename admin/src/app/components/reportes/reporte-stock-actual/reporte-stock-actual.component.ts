import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../../services/reportes.service';
import { ReporteStock, ProductoStock } from '../../../models/reportes.model';

declare var iziToast: any;
declare var jsPDF: any;

@Component({
  selector: 'app-reporte-stock-actual',
  templateUrl: './reporte-stock-actual.component.html',
  styleUrls: ['./reporte-stock-actual.component.css']
})
export class ReporteStockActualComponent implements OnInit {

  public token: string;
  public reporte: ReporteStock | null = null;
  public categorias: any[] = [];
  public load_data = false;
  public filtros = {
    categoria: '',
    estado_stock: 'todos',
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
    this.cargar_categorias();
    this.generar_reporte();
  }

  cargar_categorias() {
    this._reportesService.obtener_categorias(this.token).subscribe(
      response => {
        this.categorias = response;
      },
      error => {
        console.error('Error al cargar categorías:', error);
      }
    );
  }

  generar_reporte() {
    this.load_data = true;
    console.log('Generando reporte de stock con filtros:', this.filtros);
    
    this._reportesService.reporte_stock_actual(
      this.filtros.categoria,
      this.filtros.estado_stock,
      this.filtros.limite,
      this.token
    ).subscribe(
      response => {
        console.log('Respuesta del reporte de stock:', response);
        this.reporte = response;
        this.load_data = false;
      },
      error => {
        console.error('Error en reporte de stock:', error);
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

    const element = document.getElementById('reporte-stock');
    if (element) {
      iziToast.info({
        title: 'Información',
        message: 'Función de PDF en desarrollo',
        position: 'topRight'
      });
    }
  }

  get hayDatos(): boolean {
    return !!(this.reporte?.productos && this.reporte.productos.length > 0);
  }

  get productosSeguras(): ProductoStock[] {
    return this.reporte?.productos || [];
  }

  get resumenSeguro() {
    return this.reporte?.resumen || {
      total_productos: 0,
      total_unidades: 0,
      valor_total_inventario: 0,
      productos_sin_stock: 0,
      productos_stock_bajo: 0
    };
  }

  get_badge_stock(estado_stock: string): string {
    switch (estado_stock) {
      case 'Sin Stock':
        return 'badge-danger';
      case 'Stock Bajo':
        return 'badge-warning';
      case 'Stock Medio':
        return 'badge-info';
      case 'Stock Alto':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }

  get_icono_stock(estado_stock: string): string {
    switch (estado_stock) {
      case 'Sin Stock':
        return 'fa-times-circle';
      case 'Stock Bajo':
        return 'fa-exclamation-triangle';
      case 'Stock Medio':
        return 'fa-minus-circle';
      case 'Stock Alto':
        return 'fa-check-circle';
      default:
        return 'fa-question-circle';
    }
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

  get_color_progreso_stock(stock: number): string {
    if (stock === 0) return 'danger';
    if (stock <= 5) return 'warning';
    if (stock <= 20) return 'info';
    return 'success';
  }

  obtener_cantidad_inventario(producto: ProductoStock): number {
    return producto.cantidad_inventario || 0;
  }

  obtener_total_proveedores(producto: ProductoStock): number {
    return producto.total_proveedores || 0;
  }

  get productos_criticos(): ProductoStock[] {
    return this.productosSeguras.filter(p => p.estado_stock === 'Sin Stock' || p.estado_stock === 'Stock Bajo');
  }

  get productos_criticos_total(): number {
    const sinStock = this.resumenSeguro.productos_sin_stock || 0;
    const stockBajo = this.resumenSeguro.productos_stock_bajo || 0;
    return sinStock + stockBajo;
  }

  get productos_por_estado() {
    const estados = ['Sin Stock', 'Stock Bajo', 'Stock Medio', 'Stock Alto'];
    return estados.map(estado => ({
      estado,
      cantidad: this.productosSeguras.filter(p => p.estado_stock === estado).length,
      porcentaje: this.productosSeguras.length > 0 ? 
        (this.productosSeguras.filter(p => p.estado_stock === estado).length / this.productosSeguras.length) * 100 : 0
    }));
  }
}