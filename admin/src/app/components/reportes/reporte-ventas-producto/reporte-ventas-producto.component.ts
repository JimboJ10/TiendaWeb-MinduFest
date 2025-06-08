import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../../services/reportes.service';
import { ProductoService } from '../../../services/producto.service';
import { ReporteVentasProducto } from '../../../models/reportes.model';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

declare var iziToast: any;

@Component({
  selector: 'app-reporte-ventas-producto',
  templateUrl: './reporte-ventas-producto.component.html',
  styleUrl: './reporte-ventas-producto.component.css'
})
export class ReporteVentasProductoComponent implements OnInit {

  public token: string;
  public reporte: ReporteVentasProducto | null = null;
  public productos: Array<any> = [];
  public load_data = false;
  public filtros = {
    fecha_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    productoid: ''
  };
  public page = 1;
  public pageSize = 15;

  constructor(
    private _reportesService: ReportesService,
    private _productoService: ProductoService
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_productos();
    this.generar_reporte();
  }

  cargar_productos() {
    this._productoService.listarProductos(this.token).subscribe(
      response => {
        this.productos = response.data || response || [];
      },
      error => {
        console.log(error);
      }
    );
  }

  generar_reporte() {
    this.load_data = true;
    console.log('Generando reporte con filtros:', this.filtros);
    
    this._reportesService.reporte_ventas_producto(
      this.filtros.fecha_inicio,
      this.filtros.fecha_fin,
      this.filtros.productoid,
      this.token
    ).subscribe(
      response => {
        console.log('Respuesta del reporte:', response);
        this.reporte = response;
        this.load_data = false;
      },
      error => {
        console.error('Error completo:', error);
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

    const element = document.getElementById('reporte-productos');
    if (element) {
      html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`reporte-ventas-productos-${this.filtros.fecha_inicio}-${this.filtros.fecha_fin}.pdf`);
      });
    }
  }

  get hayDatos(): boolean {
    return !!(this.reporte?.productos && this.reporte.productos.length > 0);
  }

  get productosSeguras() {
    return this.reporte?.productos || [];
  }

  get resumenSeguro() {
    return this.reporte?.resumen || {
      total_productos_vendidos: 0,
      total_unidades_vendidas: 0,
      total_ingresos: 0,
      producto_mas_vendido: 'N/A'
    };
  }

  get_badge_rendimiento(unidades_vendidas: number): string {
    if (unidades_vendidas >= 100) return 'badge-success';
    if (unidades_vendidas >= 50) return 'badge-info';
    if (unidades_vendidas >= 20) return 'badge-warning';
    return 'badge-secondary';
  }

  get_texto_rendimiento(unidades_vendidas: number): string {
    if (unidades_vendidas >= 100) return 'Excelente';
    if (unidades_vendidas >= 50) return 'Bueno';
    if (unidades_vendidas >= 20) return 'Regular';
    return 'Bajo';
  }

  get_badge_stock(stock: number): string {
    if (stock === 0) return 'badge-danger';
    if (stock <= 5) return 'badge-warning';
    if (stock <= 20) return 'badge-info';
    return 'badge-success';
  }
}