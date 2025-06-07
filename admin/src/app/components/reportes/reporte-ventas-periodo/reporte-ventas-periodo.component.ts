import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../../services/reportes.service';
import { ReporteVentasPeriodo } from '../../../models/reportes.model';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

declare var iziToast: any;

@Component({
  selector: 'app-reporte-ventas-periodo',
  templateUrl: './reporte-ventas-periodo.component.html',
  styleUrls: ['./reporte-ventas-periodo.component.css']
})
export class ReporteVentasPeriodoComponent implements OnInit {

  public token: string;
  public reporte: ReporteVentasPeriodo | null = null;
  public load_data = false;
  public fecha_inicio = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  public fecha_fin = new Date().toISOString().split('T')[0];
  public page = 1;
  public pageSize = 10;

  constructor(
    private _reportesService: ReportesService
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.generar_reporte();
  }

  generar_reporte() {
    this.load_data = true;
    this._reportesService.reporte_ventas_periodo(this.fecha_inicio, this.fecha_fin, 'general', this.token).subscribe(
      response => {
        this.reporte = response;
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
        this.reporte = null; // Asegurar que se resetee en caso de error
        iziToast.error({
          title: 'Error',
          message: 'Error al generar el reporte',
          position: 'topRight'
        });
      }
    );
  }

  exportar_excel() {
    if (!this.reporte?.ventas?.length) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'No hay datos para exportar',
        position: 'topRight'
      });
      return;
    }
    
    // Implementar exportación a Excel
    iziToast.info({
      title: 'Información',
      message: 'Función de exportación en desarrollo',
      position: 'topRight'
    });
  }

  generar_pdf() {
    if (!this.reporte?.ventas?.length) {
      iziToast.warning({
        title: 'Advertencia',
        message: 'No hay datos para generar PDF',
        position: 'topRight'
      });
      return;
    }

    const element = document.getElementById('reporte-ventas');
    if (element) {
      html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`reporte-ventas-${this.fecha_inicio}-${this.fecha_fin}.pdf`);
      });
    }
  }

  get_badge_estado(estado: string): string {
    switch (estado) {
      case 'Procesando': return 'badge-warning';
      case 'Confirmado': return 'badge-info';
      case 'Enviado': return 'badge-primary';
      case 'Entregado': return 'badge-success';
      case 'Cancelado': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  // Getter para verificar si hay datos de manera más segura
  get hayDatos(): boolean {
    return !!(this.reporte?.ventas && this.reporte.ventas.length > 0);
  }

  // Getter para obtener ventas de manera segura
  get ventasSeguras() {
    return this.reporte?.ventas || [];
  }

  // Getter para obtener resumen de manera segura
  get resumenSeguro() {
    return this.reporte?.resumen || {
      total_ventas: 0,
      total_facturado: 0,
      promedio_venta: 0,
      total_productos_vendidos: 0
    };
  }
}