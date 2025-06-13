import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-index-finanzas',
  templateUrl: './index-finanzas.component.html',
  styleUrls: ['./index-finanzas.component.css']
})
export class IndexFinanzasComponent implements OnInit {

  public token;
  public resumen_caja: any = {};
  public load_resumen = true;
  public fecha_desde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  public fecha_hasta = new Date().toISOString().split('T')[0];

  constructor(
    private _financieroService: FinancieroService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_resumen();
  }

  cargar_resumen() {
    this.load_resumen = true;
    console.log('Cargando resumen con fechas:', this.fecha_desde, this.fecha_hasta);
    
    this._financieroService.obtener_resumen_flujo_caja(this.fecha_desde, this.fecha_hasta, this.token).subscribe(
      response => {
        console.log('Respuesta del servidor:', response);
        this.resumen_caja = response;
        this.load_resumen = false;
      },
      error => {
        console.error('Error al cargar resumen:', error);
        this.load_resumen = false;
        iziToast.error({
          title: 'Error',
          message: 'Error al cargar el resumen financiero',
          position: 'topRight'
        });
      }
    );
  }

  filtrar_resumen() {
    console.log('Filtrando resumen...');
    this.cargar_resumen();
  }

  navegar_a(ruta: string) {
    this._router.navigate([ruta]);
  }

  // ✅ Nueva función para contar movimientos por tipo
  contar_movimientos_por_tipo(tipo: string): number {
    if (!this.resumen_caja.ingresos_por_categoria && !this.resumen_caja.egresos_por_categoria) {
      return 0;
    }
    
    if (tipo === 'Ingreso') {
      return this.resumen_caja.ingresos_por_categoria?.length || 0;
    } else if (tipo === 'Egreso') {
      return this.resumen_caja.egresos_por_categoria?.length || 0;
    }
    
    return 0;
  }

  // Métodos de formateo
  formatear_numero(valor: number | string): string {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    if (numero >= 1000000) {
      return (numero / 1000000).toFixed(1) + 'M';
    } else if (numero >= 1000) {
      return (numero / 1000).toFixed(1) + 'K';
    }
    return numero?.toFixed(0) || '0';
  }

  formatear_fecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  }
}