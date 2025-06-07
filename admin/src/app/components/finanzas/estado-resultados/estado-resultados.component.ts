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
  public mostrar_detalle = false;

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
        this.estado_resultados = response;
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

  imprimir_estado() {
    window.print();
  }

  exportar_excel() {
    // Implementar exportación a Excel
    iziToast.info({
      title: 'Información',
      message: 'Función de exportación en desarrollo',
      position: 'topRight'
    });
  }

  toggle_detalle() {
    this.mostrar_detalle = !this.mostrar_detalle;
  }

  get_clase_utilidad(valor: number): string {
    if (valor > 0) return 'text-success';
    if (valor < 0) return 'text-danger';
    return 'text-muted';
  }
}