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
  public resumen: any = null;

  // Paginación
  public page: number = 1;
  public pageSize: number = 20;

  constructor(
    private _financieroService: FinancieroService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.listar_movimientos();
    this.obtener_resumen();
  }

  listar_movimientos() {
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
        iziToast.error({
          title: 'Error',
          message: 'Error al cargar movimientos',
          position: 'topRight'
        });
      }
    );
  }

  obtener_resumen() {
    this._financieroService.obtener_resumen_flujo_caja(
      this.fecha_desde, 
      this.fecha_hasta, 
      this.token
    ).subscribe(
      response => {
        this.resumen = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  aplicar_filtros() {
    this.page = 1;
    this.listar_movimientos();
    this.obtener_resumen();
  }

  limpiar_filtros() {
    this.tipo_filtro = '';
    this.categoria_filtro = '';
    this.fecha_desde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.fecha_hasta = new Date().toISOString().split('T')[0];
    this.aplicar_filtros();
  }

  formatear_moneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  }

  formatear_fecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  get_badge_tipo(tipo: string): string {
    return tipo === 'Ingreso' ? 'badge-success' : 'badge-danger';
  }

  get_badge_categoria(categoria: string): string {
    switch (categoria) {
      case 'Ventas': return 'badge-success';
      case 'Compras': return 'badge-warning';
      case 'Gastos Administrativos': return 'badge-info';
      case 'Gastos de Ventas': return 'badge-primary';
      default: return 'badge-secondary';
    }
  }

  nuevo_movimiento() {
    this._router.navigate(['/panel/finanzas/flujo-caja/registrar']);
  }

  regresar() {
    this._router.navigate(['/panel/finanzas']);
  }
}