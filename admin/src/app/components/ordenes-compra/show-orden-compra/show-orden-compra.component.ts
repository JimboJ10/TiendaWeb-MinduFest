import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OrdenCompraService } from '../../../services/orden-compra.service';
import Swal from 'sweetalert2';

declare var iziToast: any;

@Component({
  selector: 'app-show-orden-compra',
  templateUrl: './show-orden-compra.component.html',
  styleUrls: ['./show-orden-compra.component.css']
})
export class ShowOrdenCompraComponent implements OnInit {

  public orden: any = {};
  public id: any;
  public token;
  public load_data = true;
  public estados_disponibles: Array<any> = [];
  public nuevo_estado = '';
  public observaciones_estado = '';

  constructor(
    private _ordenCompraService: OrdenCompraService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.obtenerOrden();
      this.cargar_estados();
    });
  }

  obtenerOrden() {
    this._ordenCompraService.obtener_orden_compra(this.id, this.token).subscribe(
      response => {
        if (response) {
          this.orden = response;
          this.load_data = false;
        } else {
          this._router.navigate(['/panel/ordenes-compra']);
        }
      },
      error => {
        console.log(error);
        iziToast.error({
          title: 'Error',
          message: 'No se pudo obtener la información de la orden',
          position: 'topRight'
        });
        this._router.navigate(['/panel/ordenes-compra']);
      }
    );
  }

  cargar_estados() {
    this._ordenCompraService.obtener_estados_orden(this.token).subscribe(
      response => {
        this.estados_disponibles = response;
      },
      error => {
        console.log(error);
      }
    );
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

  cambiar_estado() {
    // Crear opciones para el select de estados
    const estadosOptions: { [key: string]: string } = {};
    this.estados_disponibles.forEach(estado => {
      estadosOptions[estado.nombre] = estado.nombre;
    });

    Swal.fire({
      title: 'Cambiar Estado de la Orden',
      html: `
        <div class="text-left" style="margin-bottom: 20px;">
          <p><strong>Orden:</strong> ${this.orden.numero_orden}</p>
          <p><strong>Estado actual:</strong> <span class="badge ${this.getEstadoClass(this.orden.estado)}">${this.orden.estado}</span></p>
          <hr>
        </div>
        <div class="form-group text-left">
          <label for="swal-select-estado" class="form-label"><strong>Nuevo estado:</strong></label>
          <select id="swal-select-estado" class="form-control">
            <option value="">Seleccione un estado</option>
            ${this.estados_disponibles.map(estado => 
              `<option value="${estado.nombre}">${estado.nombre}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group text-left" style="margin-top: 15px;">
          <label for="swal-textarea-observaciones" class="form-label"><strong>Observaciones (opcional):</strong></label>
          <textarea id="swal-textarea-observaciones" class="form-control" rows="3" 
                    placeholder="Observaciones del cambio de estado..."></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fa fa-check"></i> Cambiar Estado',
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const estadoSelect = document.getElementById('swal-select-estado') as HTMLSelectElement;
        const observacionesTextarea = document.getElementById('swal-textarea-observaciones') as HTMLTextAreaElement;
        
        const nuevoEstado = estadoSelect.value;
        const observaciones = observacionesTextarea.value;

        if (!nuevoEstado) {
          Swal.showValidationMessage('Debe seleccionar un nuevo estado');
          return false;
        }
        
        if (nuevoEstado === this.orden.estado) {
          Swal.showValidationMessage('El nuevo estado debe ser diferente al actual');
          return false;
        }

        const data = {
          estado: nuevoEstado,
          observaciones: observaciones
        };

        return this._ordenCompraService.cambiar_estado_orden(this.id, data, this.token).toPromise()
          .then(response => {
            return response;
          })
          .catch(error => {
            console.log(error);
            Swal.showValidationMessage('Error al cambiar el estado. Intente nuevamente.');
            throw error;
          });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: '¡Estado Actualizado!',
          text: result.value.message || 'El estado de la orden ha sido actualizado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false
        });
        
        iziToast.success({
          title: 'Éxito',
          message: result.value.message || 'Estado actualizado correctamente',
          position: 'topRight'
        });
        
        this.obtenerOrden();
      }
    }).catch((error) => {
      iziToast.error({
        title: 'Error',
        message: 'Error al cambiar el estado',
        position: 'topRight'
      });
    });
  }

  formatearMoneda(valor: any): string {
    if (!valor || isNaN(valor)) return '0.00';
    
    // Redondeo tradicional (hacia arriba cuando el tercer decimal es 5)
    const factor = 100;
    const rounded = Math.round((parseFloat(valor) + Number.EPSILON) * factor) / factor;
    return rounded.toFixed(2);
  }

  cancelar_orden() {
    Swal.fire({
      title: 'Cancelar Orden de Compra',
      html: `
        <div class="text-left">
          <p><strong>Orden:</strong> ${this.orden.numero_orden}</p>
          <p><strong>Proveedor:</strong> ${this.orden.nombre_proveedor}</p>
          <p><strong>Total:</strong> $${this.formatearMoneda(this.orden.total)}</p>
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
        return this._ordenCompraService.cancelar_orden_compra(this.id, { motivo: motivo.trim() }, this.token).toPromise()
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
        Swal.fire({
          title: '¡Orden Cancelada!',
          text: result.value.message || 'La orden ha sido cancelada correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false
        });
        
        iziToast.success({
          title: 'Éxito',
          message: result.value.message || 'Orden cancelada correctamente',
          position: 'topRight'
        });
        
        this.obtenerOrden();
      }
    }).catch((error) => {
      iziToast.error({
        title: 'Error',
        message: 'Error al cancelar la orden',
        position: 'topRight'
      });
    });
  }

  calcular_porcentaje_recibido(detalle: any): number {
    if (detalle.cantidad === 0) return 0;
    return (detalle.recibido / detalle.cantidad) * 100;
  }

  get_progreso_class(porcentaje: number): string {
    if (porcentaje === 0) return 'bg-secondary';
    if (porcentaje < 50) return 'bg-danger';
    if (porcentaje < 100) return 'bg-warning';
    return 'bg-success';
  }
}