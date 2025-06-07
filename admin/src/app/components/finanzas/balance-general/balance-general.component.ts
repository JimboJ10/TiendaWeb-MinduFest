import { Component, OnInit } from '@angular/core';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-balance-general',
  templateUrl: './balance-general.component.html',
  styleUrls: ['./balance-general.component.css']
})
export class BalanceGeneralComponent implements OnInit {

  public token;
  public balance: any = {};
  public load_data = true;
  public fecha_corte = new Date().toISOString().split('T')[0];
  public mostrar_detalle = false;

  constructor(
    private _financieroService: FinancieroService
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_balance();
  }

  cargar_balance() {
    this.load_data = true;
    this._financieroService.obtener_balance_general(this.fecha_corte, this.token).subscribe(
      response => {
        this.balance = response;
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
        iziToast.error({
          title: 'Error',
          message: 'Error al cargar el balance general',
          position: 'topRight'
        });
      }
    );
  }

  actualizar_balance() {
    this.cargar_balance();
  }

  imprimir_balance() {
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
}