import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportesService } from '../../../services/reportes.service';

declare var iziToast: any;

@Component({
  selector: 'app-index-reportes',
  templateUrl: './index-reportes.component.html',
  styleUrls: ['./index-reportes.component.css']
})
export class IndexReportesComponent implements OnInit {

  public token: string;
  public dashboard: any = {};
  public load_dashboard = true;
  public periodo_seleccionado = 30;

  constructor(
    private _reportesService: ReportesService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_dashboard();
  }

  cargar_dashboard() {
    this.load_dashboard = true;
    this._reportesService.dashboard_reportes(this.periodo_seleccionado.toString(), this.token).subscribe(
      response => {
        this.dashboard = response;
        this.load_dashboard = false;
      },
      error => {
        console.log(error);
        this.load_dashboard = false;
        iziToast.error({
          title: 'Error',
          message: 'Error al cargar el dashboard de reportes',
          position: 'topRight'
        });
      }
    );
  }

  cambiar_periodo() {
    this.cargar_dashboard();
  }

  navegar_a(ruta: string) {
    this._router.navigate([ruta]);
  }
}