import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinancieroService } from '../../../services/financiero.service';

declare var iziToast: any;

@Component({
  selector: 'app-crear-asiento',
  templateUrl: './crear-asiento.component.html',
  styleUrls: ['./crear-asiento.component.css']
})
export class CrearAsientoComponent implements OnInit {

  public token;
  public asiento: any = {
    fecha_asiento: new Date().toISOString().split('T')[0],
    tipo_asiento: 'Manual',
    detalles: []
  };
  public load_btn = false;
  public tipos_documento = ['Venta', 'Compra', 'Pago', 'Cobro', 'Ajuste', 'Otro'];
  public cuentas: Array<any> = [];
  public total_debe = 0;
  public total_haber = 0;
  public diferencia = 0;

  constructor(
    private _financieroService: FinancieroService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    this.cargar_cuentas();
    this.agregar_detalle();
    this.agregar_detalle();
  }

  cargar_cuentas() {
    this._financieroService.listar_plan_cuentas('', '', 'Activo', this.token).subscribe(
      response => {
        this.cuentas = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  agregar_detalle() {
    this.asiento.detalles.push({
      cuentaid: '',
      debe: 0,
      haber: 0,
      descripcion: ''
    });
  }

  eliminar_detalle(index: number) {
    if (this.asiento.detalles.length > 2) {
      this.asiento.detalles.splice(index, 1);
      this.calcular_totales();
    } else {
      iziToast.warning({
        title: 'Advertencia',
        message: 'Debe tener al menos 2 líneas de detalle',
        position: 'topRight'
      });
    }
  }

  calcular_totales() {
    this.total_debe = 0;
    this.total_haber = 0;

    this.asiento.detalles.forEach((detalle: any) => {
      this.total_debe += parseFloat(detalle.debe || 0);
      this.total_haber += parseFloat(detalle.haber || 0);
    });

    this.diferencia = this.total_debe - this.total_haber;
  }

  get esta_balanceado(): boolean {
    return Math.abs(this.diferencia) < 0.01 && this.total_debe > 0;
  }

  get nombre_cuenta() {
    return (cuentaid: string) => {
      const cuenta = this.cuentas.find(c => c.cuentaid == cuentaid);
      return cuenta ? `${cuenta.codigo} - ${cuenta.nombre}` : '';
    };
  }

  crear(crearForm: any) {
    if (crearForm.valid) {
      if (!this.esta_balanceado) {
        iziToast.error({
          title: 'Error',
          message: 'El asiento debe estar balanceado (Debe = Haber)',
          position: 'topRight'
        });
        return;
      }

      if (this.asiento.detalles.length < 2) {
        iziToast.error({
          title: 'Error',
          message: 'Debe tener al menos 2 líneas de detalle',
          position: 'topRight'
        });
        return;
      }

      // Validar que todas las líneas tengan cuenta y al menos debe o haber
      const lineasValidas = this.asiento.detalles.every((detalle: any) => {
        return detalle.cuentaid && (parseFloat(detalle.debe || 0) > 0 || parseFloat(detalle.haber || 0) > 0);
      });

      if (!lineasValidas) {
        iziToast.error({
          title: 'Error',
          message: 'Todas las líneas deben tener cuenta y monto',
          position: 'topRight'
        });
        return;
      }

      this.load_btn = true;

      this._financieroService.crear_asiento_contable(this.asiento, this.token).subscribe(
        response => {
          iziToast.success({
            title: 'Éxito',
            message: response.message,
            position: 'topRight'
          });
          this._router.navigate(['/panel/finanzas/asientos']);
          this.load_btn = false;
        },
        error => {
          console.log(error);
          let message = 'Error en el servidor';
          if (error.error && error.error.error) {
            message = error.error.error;
          }
          
          iziToast.error({
            title: 'Error',
            message: message,
            position: 'topRight'
          });
          this.load_btn = false;
        }
      );
    } else {
      iziToast.warning({
        title: 'Advertencia',
        message: 'Complete todos los campos requeridos',
        position: 'topRight'
      });
    }
  }
}