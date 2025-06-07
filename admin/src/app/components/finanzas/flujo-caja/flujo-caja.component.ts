import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-flujo-caja',
  templateUrl: './flujo-caja.component.html',
  styleUrls: ['./flujo-caja.component.css']
})
export class FlujoCajaComponent implements OnInit {

  public token;
  public movimientos: Array<any> = [];
  public load_data = true;
  public fecha_desde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  public fecha_hasta = new Date().toISOString().split('T')[0];
  public tipo_filtro = '';
  public categoria_filtro = '';
  public tipos = ['Ingreso', 'Egreso'];
  public categorias = ['Ventas', 'Compras', 'Gastos Administrativos', 'Gastos de Ventas', 'Otros Ingresos', 'Otros Gastos'];
  public page = 1;
  public pageSize = 15;
  public resumen: any = {};

  constructor(
    private _financieroService: FinancieroService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_movimientos();
    this.cargar_resumen();
  }

  cargar_movimientos() {
    this.load_data = true;
    this._financieroService.listar_flujo_caja(
      this.fecha_desde, 
      this.fecha_hasta, 
      this.tipo_filtro, 
      this.categoria_filtro, 
      this.token
    ).subscribe(
      response => {
        this.movimientos = response;
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
      }
    );
  }

  cargar_resumen() {
    this._financieroService.obtener_resumen_flujo_caja(this.fecha_desde, this.fecha_hasta, this.token).subscribe(
      response => {
        this.resumen = response.resumen;
      },
      error => {
        console.log(error);
      }
    );
  }

  filtrar() {
    this.page = 1;
    this.cargar_movimientos();
    this.cargar_resumen();
  }

  resetear() {
    this.fecha_desde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.fecha_hasta = new Date().toISOString().split('T')[0];
    this.tipo_filtro = '';
    this.categoria_filtro = '';
    this.page = 1;
    this.cargar_movimientos();
    this.cargar_resumen();
  }

  getBadgeTipo(tipo: string): string {
    return tipo === 'Ingreso' ? 'badge-success' : 'badge-danger';
  }

  getIconoTipo(tipo: string): string {
    return tipo === 'Ingreso' ? 'cxi-arrow-up' : 'cxi-arrow-down';
  }

  registrar_movimiento() {
    this._router.navigate(['/panel/finanzas/flujo-caja/registrar']);
  }
}