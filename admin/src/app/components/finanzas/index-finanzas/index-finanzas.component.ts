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
    this._financieroService.obtener_resumen_flujo_caja(this.fecha_desde, this.fecha_hasta, this.token).subscribe(
      response => {
        this.resumen_caja = response;
        this.load_resumen = false;
      },
      error => {
        console.log(error);
        this.load_resumen = false;
      }
    );
  }

  filtrar_resumen() {
    this.cargar_resumen();
  }

  navegar_a(ruta: string) {
    this._router.navigate([ruta]);
  }
}