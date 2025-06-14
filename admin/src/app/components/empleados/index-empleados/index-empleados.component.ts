import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmpleadosService } from '../../../services/empleados.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-index-empleados',
  templateUrl: './index-empleados.component.html',
  styleUrls: ['./index-empleados.component.css']
})
export class IndexEmpleadosComponent implements OnInit {

  public token = localStorage.getItem('token');
  public empleados: Array<any> = [];
  public departamentos: Array<any> = [];
  public cargos: Array<any> = [];
  public estadisticas: any = {};
  
  // Filtros
  public filtros = {
    departamento: 'todos',
    cargo: 'todos', 
    estado: 'Activo',
    filtro: '',
    limite: 50,
    pagina: 1
  };
  
  public paginacion: any = {};
  public load_data = true;
  public load_estadisticas = true;

  public Math = Math;

  constructor(
    private _empleadosService: EmpleadosService,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.cargar_datos_iniciales();
  }

  cargar_datos_iniciales() {
    this.cargar_departamentos();
    this.cargar_cargos();
    this.cargar_estadisticas();
    this.listar_empleados();
  }

  // ======================== CARGA DE DATOS ========================

  listar_empleados() {
    this.load_data = true;
    this._empleadosService.listar_empleados(this.filtros, this.token).subscribe(
      response => {
        if (response.empleados) {
          this.empleados = response.empleados;
          this.paginacion = response.paginacion;
        }
        this.load_data = false;
      },
      error => {
        console.error('Error al listar empleados:', error);
        this.load_data = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los empleados',
          confirmButtonColor: '#dc3545'
        });
      }
    );
  }

  cargar_departamentos() {
    this._empleadosService.listar_departamentos(this.token).subscribe(
      response => {
        this.departamentos = response;
      },
      error => {
        console.error('Error al cargar departamentos:', error);
      }
    );
  }

  cargar_cargos(departamentoid?: any) {
    this._empleadosService.listar_cargos(departamentoid, this.token).subscribe(
      response => {
        this.cargos = response;
      },
      error => {
        console.error('Error al cargar cargos:', error);
      }
    );
  }

  cargar_estadisticas() {
    this.load_estadisticas = true;
    this._empleadosService.obtener_estadisticas_empleados(this.token).subscribe(
      response => {
        this.estadisticas = response;
        this.load_estadisticas = false;
      },
      error => {
        console.error('Error al cargar estadísticas:', error);
        this.load_estadisticas = false;
      }
    );
  }

  // ======================== FILTROS Y PAGINACIÓN ========================

  aplicar_filtros() {
    this.filtros.pagina = 1;
    this.listar_empleados();
  }

  limpiar_filtros() {
    this.filtros = {
      departamento: 'todos',
      cargo: 'todos',
      estado: 'Activo',
      filtro: '',
      limite: 50,
      pagina: 1
    };
    this.listar_empleados();
  }

  cambiar_pagina(pagina: number) {
    this.filtros.pagina = pagina;
    this.listar_empleados();
  }

  cambiar_departamento() {
    this.filtros.cargo = 'todos';
    if (this.filtros.departamento !== 'todos') {
      this.cargar_cargos(this.filtros.departamento);
    } else {
      this.cargar_cargos();
    }
    this.aplicar_filtros();
  }

  // ======================== NAVEGACIÓN ========================

  crear_empleado() {
    this._router.navigate(['/panel/empleados/registro']);
  }

  ver_empleado(id: any) {
    this._router.navigate(['/panel/empleados/', id]);
  }

  editar_empleado(id: any) {
    this._router.navigate(['/panel/empleados/edit/', id]);
  }

  // ======================== ACCIONES CON SWEETALERT2 ========================

  async confirmar_baja_empleado(empleado: any) {
    // Obtener fecha actual en formato YYYY-MM-DD
    const fechaActual = new Date().toISOString().split('T')[0];

    const { value: formValues } = await Swal.fire({
      title: `<i class="fa fa-user-times"></i> Dar de Baja Empleado`,
      html: `
        <div class="text-left mb-3">
          <div class="alert alert-warning text-left">
            <i class="fa fa-exclamation-triangle"></i>
            <strong>¿Estás seguro de dar de baja a este empleado?</strong><br>
            <small class="text-muted">
              ${empleado.nombres} ${empleado.apellidos} - ${empleado.codigo_empleado}
            </small>
          </div>
        </div>
        
        <div class="form-group text-left mb-3">
          <label for="fecha_salida" class="form-label font-weight-bold">
            <i class="fa fa-calendar text-primary"></i> Fecha de salida *
          </label>
          <input 
            id="fecha_salida" 
            type="date" 
            class="form-control swal2-input" 
            value="${fechaActual}"
            style="margin: 0; width: 100%; max-width: 100%;"
            required
          >
        </div>
        
        <div class="form-group text-left">
          <label for="motivo_baja" class="form-label font-weight-bold">
            <i class="fa fa-comment text-primary"></i> Motivo de baja
          </label>
          <textarea 
            id="motivo_baja" 
            class="form-control swal2-textarea" 
            rows="3"
            placeholder="Descripción del motivo de la baja..."
            style="margin: 0; width: 100%; max-width: 100%;">
          </textarea>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-check"></i> Confirmar Baja',
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      focusConfirm: false,
      preConfirm: () => {
        const fechaSalida = (document.getElementById('fecha_salida') as HTMLInputElement).value;
        const motivoBaja = (document.getElementById('motivo_baja') as HTMLTextAreaElement).value;
        
        if (!fechaSalida) {
          Swal.showValidationMessage('<i class="fa fa-exclamation-circle"></i> Por favor, selecciona la fecha de salida');
          return false;
        }
        
        return {
          fecha_salida: fechaSalida,
          motivo: motivoBaja || 'Baja del empleado'
        };
      }
    });

    if (formValues) {
      // Mostrar loading
      Swal.fire({
        title: 'Procesando...',
        text: 'Dando de baja al empleado',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Ejecutar la baja
      this._empleadosService.dar_baja_empleado(empleado.empleadoid, formValues, this.token).subscribe(
        response => {
          Swal.fire({
            icon: 'success',
            title: '¡Empleado dado de baja!',
            text: `${empleado.nombres} ${empleado.apellidos} ha sido dado de baja exitosamente`,
            confirmButtonColor: '#28a745',
            timer: 3000,
            timerProgressBar: true
          });
          
          this.listar_empleados();
          this.cargar_estadisticas();
        },
        error => {
          console.error('Error al dar de baja:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al dar de baja',
            text: 'No se pudo completar la operación. Inténtalo nuevamente.',
            confirmButtonColor: '#dc3545'
          });
        }
      );
    }
  }

  // Confirmación antes de eliminar empleado (si implementas esta función)
  confirmar_eliminar_empleado(empleado: any) {
    Swal.fire({
      title: '¿Eliminar empleado?',
      text: `Esta acción eliminará permanentemente a ${empleado.nombres} ${empleado.apellidos}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-trash"></i> Sí, eliminar',
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí iría la lógica para eliminar
        Swal.fire({
          icon: 'success',
          title: 'Empleado eliminado',
          text: 'El empleado ha sido eliminado exitosamente',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  }

  // Función para mostrar información rápida del empleado
  mostrar_info_empleado(empleado: any) {
    const fechaIngreso = this.formatear_fecha(empleado.fecha_ingreso);
    const fechaSalida = empleado.fecha_salida ? this.formatear_fecha(empleado.fecha_salida) : 'N/A';
    
    Swal.fire({
      title: `<i class="fa fa-user"></i> ${empleado.nombres} ${empleado.apellidos}`,
      html: `
        <div class="text-left">
          <div class="row">
            <div class="col-6">
              <strong><i class="fa fa-id-card text-primary"></i> Código:</strong><br>
              <span class="text-muted">${empleado.codigo_empleado}</span><br><br>
              
              <strong><i class="fa fa-envelope text-primary"></i> Email:</strong><br>
              <span class="text-muted">${empleado.email}</span><br><br>
              
              <strong><i class="fa fa-building text-primary"></i> Departamento:</strong><br>
              <span class="badge badge-info">${empleado.departamento || 'Sin asignar'}</span><br><br>
              
              <strong><i class="fa fa-calendar text-primary"></i> Ingreso:</strong><br>
              <span class="text-muted">${fechaIngreso}</span>
            </div>
            <div class="col-6">
              <strong><i class="fa fa-phone text-primary"></i> Teléfono:</strong><br>
              <span class="text-muted">${empleado.telefono || 'N/A'}</span><br><br>
              
              <strong><i class="fa fa-briefcase text-primary"></i> Cargo:</strong><br>
              <span class="text-muted">${empleado.cargo || 'Sin asignar'}</span><br><br>
              
              <strong><i class="fa fa-dollar-sign text-primary"></i> Salario:</strong><br>
              <span class="text-success font-weight-bold">${this.formatear_salario(empleado.salario_actual)}</span><br><br>
              
              <strong><i class="fa fa-info-circle text-primary"></i> Estado:</strong><br>
              <span class="badge badge-${this.obtener_color_estado(empleado.estado_empleado)}">${empleado.estado_empleado}</span>
            </div>
          </div>
          
          ${empleado.roles ? `
            <hr>
            <strong><i class="fa fa-user-tag text-primary"></i> Roles:</strong><br>
            <span class="text-muted">${empleado.roles || 'Sin roles asignados'}</span>
          ` : ''}
        </div>
      `,
      width: '600px',
      confirmButtonText: '<i class="fa fa-edit"></i> Editar',
      showCancelButton: true,
      cancelButtonText: '<i class="fa fa-times"></i> Cerrar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.editar_empleado(empleado.empleadoid);
      }
    });
  }

  // ======================== UTILITIES ========================

  formatear_fecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  formatear_salario(salario: number): string {
    if (!salario || salario === 0) return '$0.00';
    return '$' + salario.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  obtener_salario_promedio(): number {
    // Usar el promedio de empleados activos preferentemente
    return this.estadisticas?.estadisticas?.salario_promedio_activos || 
           this.estadisticas?.estadisticas?.salario_promedio_general || 0;
  }

  obtener_badge_estado(estado: string): string {
    switch (estado) {
      case 'Activo': return 'badge-success';
      case 'Inactivo': return 'badge-warning'; 
      case 'Suspendido': return 'badge-danger';
      case 'Retirado': return 'badge-secondary';
      default: return 'badge-light';
    }
  }

  obtener_color_estado(estado: string): string {
    switch (estado) {
      case 'Activo': return 'success';
      case 'Inactivo': return 'warning'; 
      case 'Suspendido': return 'danger';
      case 'Retirado': return 'secondary';
      default: return 'light';
    }
  }

  obtener_badge_contrato(tipo: string): string {
    switch (tipo) {
      case 'Indefinido': return 'badge-primary';
      case 'Temporal': return 'badge-warning';
      case 'Por Obra': return 'badge-info';
      default: return 'badge-light';
    }
  }
}