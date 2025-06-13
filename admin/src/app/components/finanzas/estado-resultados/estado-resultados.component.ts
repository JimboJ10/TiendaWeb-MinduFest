import { Component, OnInit } from '@angular/core';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-estado-resultados',
  templateUrl: './estado-resultados.component.html',
  styleUrls: ['./estado-resultados.component.css']
})
export class EstadoResultadosComponent implements OnInit {

  public token: string;
  public estado_resultados: any = {};
  public load_data = true;
  public fecha_inicio = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]; // Inicio del año
  public fecha_fin = new Date().toISOString().split('T')[0];
  public Math = Math; // ✅ Para usar Math.abs en template

  constructor(
    private _financieroService: FinancieroService
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_estado_resultados();
  }

  cargar_estado_resultados() {
    this.load_data = true;
    this._financieroService.obtener_estado_resultados(this.fecha_inicio, this.fecha_fin, this.token).subscribe(
      response => {
        console.log('Estado de resultados:', response);
        this.estado_resultados = response;
        
        // ✅ Debug adicional para verificar los valores
        console.log('Utilidad neta:', this.estado_resultados.totales?.utilidad_neta);
        console.log('Margen neto:', this.estado_resultados.ratios?.margen_neto);
        console.log('¿Es pérdida?', this.estado_resultados.totales?.utilidad_neta < 0);
        console.log('¿Margen negativo?', this.estado_resultados.ratios?.margen_neto < 0);
        
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
        iziToast.error({
          title: 'Error',
          message: 'Error al cargar el estado de resultados',
          position: 'topRight'
        });
      }
    );
  }

  actualizar_estado() {
    this.cargar_estado_resultados();
  }

  get_clase_utilidad(valor: number): string {
    if (valor > 0) return 'text-success';
    if (valor < 0) return 'text-danger';
    return 'text-muted';
  }

  formatear_margen(margen: number): string {
    if (margen >= 0) {
      return `${margen.toFixed(1)}%`;
    } else {
      return `${margen.toFixed(1)}%`;
    }
  }

  obtener_mayor_gasto(): string {
    if (!this.estado_resultados.gastos_operacionales || this.estado_resultados.gastos_operacionales.length === 0) {
      return 'N/A';
    }
    
    const mayorGasto = this.estado_resultados.gastos_operacionales.reduce((prev: any, current: any) => {
      return (prev.total > current.total) ? prev : current;
    });
    
    return mayorGasto.nombre;
  }

  calcular_eficiencia(): string {
    const totalIngresos = this.estado_resultados.totales?.total_ingresos || 0;
    const totalGastos = this.estado_resultados.totales?.total_gastos || 0;
    
    if (totalIngresos === 0) return 'N/A';
    
    const eficiencia = (totalGastos / totalIngresos) * 100;
    
    if (eficiencia <= 70) {
      return `Excelente (${eficiencia.toFixed(1)}%)`;
    } else if (eficiencia <= 90) {
      return `Buena (${eficiencia.toFixed(1)}%)`;
    } else if (eficiencia <= 100) {
      return `Regular (${eficiencia.toFixed(1)}%)`;
    } else {
      return `Crítica (${eficiencia.toFixed(1)}%)`;
    }
  }

  get_clase_eficiencia(): string {
    const totalIngresos = this.estado_resultados.totales?.total_ingresos || 0;
    const totalGastos = this.estado_resultados.totales?.total_gastos || 0;
    
    if (totalIngresos === 0) return 'text-muted';
    
    const eficiencia = (totalGastos / totalIngresos) * 100;
    
    if (eficiencia <= 70) return 'text-success';
    if (eficiencia <= 90) return 'text-info';
    if (eficiencia <= 100) return 'text-warning';
    return 'text-danger';
  }

  formatear_numero(valor: number): string {
    if (valor >= 1000000) {
      return (valor / 1000000).toFixed(1) + 'M';
    } else if (valor >= 1000) {
      return (valor / 1000).toFixed(1) + 'K';
    }
    return valor?.toFixed(0) || '0';
  }

  obtener_porcentaje_gasto(total_gasto: number): number {
    const total_gastos = this.estado_resultados.totales?.total_gastos || 1;
    return (total_gasto / total_gastos) * 100;
  }

  obtener_porcentaje_ingreso(total_ingreso: number): number {
    const total_ingresos = this.estado_resultados.totales?.total_ingresos || 1;
    return (total_ingreso / total_ingresos) * 100;
  }
}