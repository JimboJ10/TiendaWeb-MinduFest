import { Component, OnInit } from '@angular/core';
import { OrdenCompraService } from '../../../services/orden-compra.service';
import { ProveedorService } from '../../../services/proveedor.service';
import Swal from 'sweetalert2';
declare var iziToast: any;

@Component({
  selector: 'app-index-orden-compra',
  templateUrl: './index-orden-compra.component.html',
  styleUrls: ['./index-orden-compra.component.css']
})
export class IndexOrdenCompraComponent implements OnInit {

  public token;
  public ordenes: Array<any> = [];
  public ordenesFiltradas: Array<any> = [];
  public proveedores: Array<any> = [];
  public estadisticas: any = {};
  public filtro = '';
  public estadoFiltro = '';
  public proveedorFiltro = '';
  public desdeFiltro = '';
  public hastaFiltro = '';
  public page = 1;
  public pageSize = 10;
  public load_data = true;
  public load_estadisticas = true;

  constructor(
    private _ordenCompraService: OrdenCompraService,
    private _proveedorService: ProveedorService
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this.init_Data();
    this.cargar_proveedores();
    this.cargar_estadisticas();
  }

  init_Data() {
    this._ordenCompraService.listar_ordenes_compra('', '', '', '', '', this.token).subscribe(
      response => {
        this.ordenes = response;
        this.ordenesFiltradas = response;
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
      }
    );
  }

  cargar_proveedores() {
    this._proveedorService.listar_proveedores('', 'Activo', this.token).subscribe(
      response => {
        this.proveedores = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  cargar_estadisticas() {
    this._ordenCompraService.obtener_estadisticas_ordenes('', '', this.token).subscribe(
      response => {
        this.estadisticas = response;
        this.load_estadisticas = false;
      },
      error => {
        console.log(error);
        this.load_estadisticas = false;
      }
    );
  }

  filtrar() {
    this._ordenCompraService.listar_ordenes_compra(
      this.filtro, 
      this.estadoFiltro, 
      this.proveedorFiltro, 
      this.desdeFiltro, 
      this.hastaFiltro, 
      this.token
    ).subscribe(
      response => {
        this.ordenesFiltradas = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  resetear() {
    this.filtro = '';
    this.estadoFiltro = '';
    this.proveedorFiltro = '';
    this.desdeFiltro = '';
    this.hastaFiltro = '';
    this.ordenesFiltradas = this.ordenes;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'badge-warning';
      case 'Enviada': return 'badge-info';
      case 'Confirmada': return 'badge-primary';
      case 'En Tránsito': return 'badge-secondary';
      case 'Parcialmente Recibida': return 'badge-info';
      case 'Recibida Completa': return 'badge-success';
      case 'Cancelada': return 'badge-danger';
      case 'Devuelta': return 'badge-dark';
      default: return 'badge-light';
    }
  }

  formatearMoneda(valor: any): string {
    if (!valor || isNaN(valor)) return '0.00';
    
    // Redondeo tradicional (hacia arriba cuando el tercer decimal es 5)
    const factor = 100;
    const rounded = Math.round((parseFloat(valor) + Number.EPSILON) * factor) / factor;
    return rounded.toFixed(2);
  }

  cancelar_orden(id: any) {
    // Obtener información de la orden para mostrar en el modal
    const orden = this.ordenesFiltradas.find(o => o.ordencompraid === id);
    
    Swal.fire({
      title: 'Cancelar Orden',
      html: `
        <div class="text-left">
          <p><strong>Orden:</strong> ${orden?.numero_orden || 'N/A'}</p>
          <p><strong>Proveedor:</strong> ${orden?.nombre_proveedor || 'N/A'}</p>
          <p><strong>Total:</strong> $${this.formatearMoneda(orden?.total)}</p>
          <hr>
          <p>¿Está seguro de que desea cancelar esta orden?</p>
        </div>
      `,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación:',
      inputPlaceholder: 'Escriba el motivo de la cancelación...',
      inputAttributes: {
        'aria-label': 'Motivo de cancelación',
        'style': 'height: 100px;'
      },
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Debe ingresar un motivo para la cancelación';
        }
        if (value.trim().length < 10) {
          return 'El motivo debe tener al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fa fa-times"></i> Cancelar Orden',
      cancelButtonText: '<i class="fa fa-arrow-left"></i> Volver',
      showLoaderOnConfirm: true,
      preConfirm: (motivo) => {
        this.load_data = true;
        return this._ordenCompraService.cancelar_orden_compra(id, { motivo: motivo.trim() }, this.token).toPromise()
          .then(response => {
            return response;
          })
          .catch(error => {
            console.log(error);
            Swal.showValidationMessage('Error al cancelar la orden. Intente nuevamente.');
            throw error;
          });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar mensaje de éxito
        Swal.fire({
          title: '¡Orden Cancelada!',
          text: result.value.message || 'La orden ha sido cancelada correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false
        });
        
        // También mostrar notificación con iziToast
        iziToast.success({
          title: 'Éxito',
          message: result.value.message || 'Orden cancelada correctamente',
          position: 'topRight'
        });
        
        this.init_Data();
      } else {
        this.load_data = false;
      }
    }).catch((error) => {
      this.load_data = false;
      iziToast.error({
        title: 'Error',
        message: 'Error al cancelar la orden',
        position: 'topRight'
      });
    });
  }
}