import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-ver-asiento',
  templateUrl: './ver-asiento.component.html',
  styleUrls: ['./ver-asiento.component.css']
})
export class VerAsientoComponent implements OnInit {

  public token: string;
  public asiento: any = {};
  public load_data = true;
  public id: string | null = null;

  constructor(
    private _financieroService: FinancieroService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    this.id = this._route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    if (this.id) {
      this.cargar_asiento();
    } else {
      this._router.navigate(['/panel/finanzas/asientos']);
    }
  }

  cargar_asiento() {
    if (!this.id) {
      this._router.navigate(['/panel/finanzas/asientos']);
      return;
    }

    this.load_data = true;
    this._financieroService.obtener_asiento_contable(this.id, this.token).subscribe(
      response => {
        this.asiento = response;
        this.load_data = false;
      },
      error => {
        console.log(error);
        iziToast.error({
          title: 'Error',
          message: 'No se pudo cargar el asiento contable',
          position: 'topRight'
        });
        this._router.navigate(['/panel/finanzas/asientos']);
      }
    );
  }

  getBadgeEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'badge-warning';
      case 'Aprobado': return 'badge-success';
      case 'Anulado': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getBadgeTipoAsiento(tipo: string): string {
    switch (tipo) {
      case 'Manual': return 'badge-primary';
      case 'Automatico': return 'badge-info';
      case 'Ajuste': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  aprobar_asiento() {
    if (!this.id) {
      return;
    }

    if (confirm('¿Está seguro de aprobar este asiento contable?')) {
      this._financieroService.aprobar_asiento_contable(this.id, this.token).subscribe(
        response => {
          iziToast.success({
            title: 'Éxito',
            message: 'Asiento aprobado correctamente',
            position: 'topRight'
          });
          this.cargar_asiento();
        },
        error => {
          console.log(error);
          iziToast.error({
            title: 'Error',
            message: 'Error al aprobar el asiento',
            position: 'topRight'
          });
        }
      );
    }
  }

  regresar() {
    this._router.navigate(['/panel/finanzas/asientos']);
  }
}