import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../../services/reportes.service';
import { ReporteVentasCliente, ClienteVenta } from '../../../models/reportes.model';

declare var iziToast: any;
declare var jsPDF: any;

@Component({
  selector: 'app-reporte-ventas-cliente',
  templateUrl: './reporte-ventas-cliente.component.html',
  styleUrls: ['./reporte-ventas-cliente.component.css']
})
export class ReporteVentasClienteComponent implements OnInit {

  public token: string;
  public reporte: ReporteVentasCliente | null = null;
  public load_data = false;
  public filtros = {
    fecha_inicio: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    limite: '50',
    pais: '',
    min_compras: ''
  };
  public page = 1;
  public pageSize = 15;
  public paises: string[] = [];
  public Math = Math;

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
    console.log('Generando reporte de clientes con filtros:', this.filtros);
    
    this._reportesService.reporte_ventas_cliente(
      this.filtros.fecha_inicio,
      this.filtros.fecha_fin,
      this.filtros.limite,
      this.filtros.pais,
      this.filtros.min_compras,
      this.token
    ).subscribe(
      response => {
        console.log('Respuesta del reporte de clientes:', response);
        this.reporte = response;
        this.extraer_paises();
        this.load_data = false;
      },
      error => {
        console.error('Error en reporte de clientes:', error);
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

  extraer_paises() {
    if (this.reporte?.clientes) {
      const paisesUnicos = [...new Set(this.reporte.clientes.map(c => c.pais))];
      this.paises = paisesUnicos.filter(p => p && p !== 'No especificado').sort();
    }
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

    const element = document.getElementById('reporte-clientes');
    if (element) {
      iziToast.info({
        title: 'Información',
        message: 'Función de PDF en desarrollo',
        position: 'topRight'
      });
    }
  }

  get hayDatos(): boolean {
    return !!(this.reporte?.clientes && this.reporte.clientes.length > 0);
  }

  get clientesSeguras(): ClienteVenta[] {
    return this.reporte?.clientes || [];
  }

  get resumenSeguro() {
    return this.reporte?.resumen || {
      total_clientes: 0,
      total_clientes_activos: 0,
      total_facturado: 0,
      promedio_facturado_por_cliente: 0,
      cliente_top: 'N/A'
    };
  }

  formatear_tiempo_desde_compra(cliente: ClienteVenta): string {
    if (!cliente.ultima_compra) return 'N/A';
    
    const ultimaCompra = new Date(cliente.ultima_compra);
    const ahora = new Date();
    const diferenciaMs = ahora.getTime() - ultimaCompra.getTime();
    
    // Convertir a horas
    const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
    
    if (horas < 1) {
      const minutos = Math.floor(diferenciaMs / (1000 * 60));
      return `Hace ${minutos} min`;
    } else if (horas < 24) {
      return `Hace ${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      if (dias === 1) {
        return 'Hace 1 día';
      } else if (dias < 30) {
        return `Hace ${dias} días`;
      } else if (dias < 365) {
        const meses = Math.floor(dias / 30);
        return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
      } else {
        const años = Math.floor(dias / 365);
        return `Hace ${años} ${años === 1 ? 'año' : 'años'}`;
      }
    }
  }

  formatear_fecha(fecha: string): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  formatear_moneda(cantidad: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(cantidad || 0);
  }

  obtener_dni(cliente: ClienteVenta): string {
    return cliente.dni || 'Sin DNI';
  }

  get_badge_actividad_tiempo(cliente: ClienteVenta): string {
    if (!cliente.ultima_compra) return 'badge-secondary';
    
    const ultimaCompra = new Date(cliente.ultima_compra);
    const ahora = new Date();
    const horas = Math.floor((ahora.getTime() - ultimaCompra.getTime()) / (1000 * 60 * 60));
    
    if (horas <= 24) return 'badge-success';  // Menos de 1 día
    if (horas <= 168) return 'badge-info';    // Menos de 1 semana
    if (horas <= 720) return 'badge-warning'; // Menos de 1 mes
    return 'badge-danger';                    // Más de 1 mes
  }

  get_texto_actividad_tiempo(cliente: ClienteVenta): string {
    if (!cliente.ultima_compra) return 'N/A';
    
    const ultimaCompra = new Date(cliente.ultima_compra);
    const ahora = new Date();
    const horas = Math.floor((ahora.getTime() - ultimaCompra.getTime()) / (1000 * 60 * 60));
    
    if (horas <= 24) return 'Muy Activo';
    if (horas <= 168) return 'Activo';
    if (horas <= 720) return 'Moderado';
    return 'Inactivo';
  }

  obtener_telefono_seguro(cliente: ClienteVenta): string {
    return cliente.telefono && cliente.telefono.trim() !== '' ? cliente.telefono : 'Sin teléfono';
  }

  obtener_dni_seguro(cliente: ClienteVenta): string {
    return cliente.dni && cliente.dni.trim() !== '' ? cliente.dni : 'Sin DNI';
  }
}