import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EmpleadosService } from '../../../services/empleados.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-show-empleados',
  templateUrl: './show-empleados.component.html',
  styleUrls: ['./show-empleados.component.css']
})
export class ShowEmpleadosComponent implements OnInit {

  public token = localStorage.getItem('token');
  public id: any;
  
  // Datos del empleado
  public empleado: any = {};
  public historial_salarios: Array<any> = [];
  public historial_cargos: Array<any> = [];

  // Estados de carga
  public load_data = true;
  public load_historial = true;

  // Configuración de pestañas
  public tab_activa = 'general';

  // Configuración para exportar
  public mostrar_exportar = false;

  constructor(
    private _empleadosService: EmpleadosService,
    private _router: Router,
    private _route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.cargar_empleado();
    });
  }

  // ======================== CARGA DE DATOS ========================

  cargar_empleado() {
    this.load_data = true;
    this._empleadosService.obtener_empleado(this.id, this.token).subscribe(
      response => {
        this.empleado = response;
        
        // Verificar datos y agregar valores por defecto
        if (!this.empleado.departamento) {
          this.empleado.departamento = 'Sin departamento asignado';
        }
        if (!this.empleado.cargo) {
          this.empleado.cargo = 'Sin cargo asignado';
        }
        
        this.load_data = false;
        
        // Cargar datos relacionados
        this.cargar_historial_salarios();
        this.cargar_historial_cargos();
        
        // Debug: Ver qué datos llegan
        console.log('Datos del empleado:', this.empleado);
      },
      error => {
        console.error('Error al cargar empleado:', error);
        this.load_data = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos',
          text: 'No se pudieron cargar los datos del empleado',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          this._router.navigate(['/panel/empleados']);
        });
      }
    );
  }

  cargar_historial_salarios() {
    this.load_historial = true;
    this._empleadosService.obtener_historial_salarios(this.id, this.token).subscribe(
      response => {
        this.historial_salarios = response;
        this.load_historial = false;
      },
      error => {
        console.error('Error al cargar historial de salarios:', error);
        this.load_historial = false;
      }
    );
  }

  cargar_historial_cargos() {
    this._empleadosService.obtener_historial_cargos(this.id, this.token).subscribe(
      response => {
        this.historial_cargos = response;
      },
      error => {
        console.error('Error al cargar historial de cargos:', error);
      }
    );
  }

  // ======================== NAVEGACIÓN ========================

  volver() {
    this._router.navigate(['/panel/empleados']);
  }

  editar_empleado() {
    this._router.navigate(['/panel/empleados/edit', this.id]);
  }

  cambiar_tab(tab: string) {
    this.tab_activa = tab;
  }

  // ======================== ACCIONES CON SWEETALERT2 ========================

  async confirmar_baja_empleado() {
    const fechaActual = new Date().toISOString().split('T')[0];

    const { value: formValues } = await Swal.fire({
      title: `<i class="fa fa-user-times"></i> Dar de Baja Empleado`,
      html: `
        <div class="text-left mb-3">
          <div class="alert alert-warning text-left">
            <i class="fa fa-exclamation-triangle"></i>
            <strong>¿Estás seguro de dar de baja a este empleado?</strong><br>
            <small class="text-muted">
              ${this.empleado.nombres} ${this.empleado.apellidos} - ${this.empleado.codigo_empleado}
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

      this._empleadosService.dar_baja_empleado(this.id, formValues, this.token).subscribe(
        response => {
          Swal.fire({
            icon: 'success',
            title: '¡Empleado dado de baja!',
            text: `${this.empleado.nombres} ${this.empleado.apellidos} ha sido dado de baja exitosamente`,
            confirmButtonColor: '#28a745',
            timer: 3000,
            timerProgressBar: true
          }).then(() => {
            this._router.navigate(['/panel/empleados']);
          });
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

  mostrar_historial_completo(tipo: string) {
    let datos: any[] = [];
    let titulo = '';
    let columnas: string[] = [];

    switch(tipo) {
      case 'salarios':
        datos = this.historial_salarios;
        titulo = 'Historial Completo de Salarios';
        columnas = ['Fecha', 'Salario Anterior', 'Salario Nuevo', 'Motivo', 'Usuario'];
        break;
      case 'cargos':
        datos = this.historial_cargos;
        titulo = 'Historial Completo de Cargos';
        columnas = ['Fecha', 'Cargo Anterior', 'Cargo Nuevo', 'Departamento', 'Usuario'];
        break;
    }

    if (datos.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay registros en el historial seleccionado',
        confirmButtonColor: '#17a2b8'
      });
      return;
    }

    const filas = datos.map(item => {
      switch(tipo) {
        case 'salarios':
          return `
            <tr>
              <td>${this.formatear_fecha(item.fecha_cambio)}</td>
              <td>$${item.salario_anterior}</td>
              <td class="text-success font-weight-bold">$${item.salario_nuevo}</td>
              <td>${item.motivo || '-'}</td>
              <td>${item.usuario_cambio || '-'}</td>
            </tr>
          `;
        case 'cargos':
          return `
            <tr>
              <td>${this.formatear_fecha(item.fecha_cambio)}</td>
              <td>${item.cargo_anterior}</td>
              <td class="text-primary font-weight-bold">${item.cargo_nuevo}</td>
              <td>${item.departamento}</td>
              <td>${item.usuario_cambio || '-'}</td>
            </tr>
          `;
        default:
          return '';
      }
    }).join('');

    const cabeceras = columnas.map(col => `<th>${col}</th>`).join('');

    Swal.fire({
      title: titulo,
      html: `
        <div style="max-height: 400px; overflow-y: auto;">
          <table class="table table-striped table-sm">
            <thead class="table-dark">
              <tr>${cabeceras}</tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </div>
      `,
      width: '800px',
      confirmButtonText: '<i class="fa fa-times"></i> Cerrar',
      confirmButtonColor: '#6c757d'
    });
  }

  // ======================== EXPORTAR DATOS ========================

  async exportar_perfil_empleado() {
    const confirmacion = await Swal.fire({
      title: 'Exportar Perfil Completo',
      text: `¿Deseas exportar toda la información de ${this.empleado.nombres} ${this.empleado.apellidos}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-download"></i> Exportar PDF',
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    });

    if (confirmacion.isConfirmed) {
      this.generar_pdf_perfil();
    }
  }

  generar_pdf_perfil() {
    // Importar jsPDF dinámicamente
    import('jspdf').then(jsPDF => {
      const doc = new jsPDF.default();
      
      // Configuración
      const margen = 20;
      let y = margen;
      
      // Título
      doc.setFontSize(18);
      doc.setTextColor(0, 123, 255);
      doc.text('PERFIL DE EMPLEADO', margen, y);
      y += 15;
      
      // Línea separadora
      doc.setDrawColor(0, 123, 255);
      doc.line(margen, y, 190, y);
      y += 15;
      
      // Información personal
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('INFORMACIÓN PERSONAL', margen, y);
      y += 10;
      
      doc.setFontSize(10);
      const infoPrimaria = [
        `Código: ${this.empleado.codigo_empleado}`,
        `Nombres: ${this.empleado.nombres} ${this.empleado.apellidos}`,
        `DNI: ${this.empleado.dni}`,
        `Email: ${this.empleado.email}`,
        `Teléfono: ${this.empleado.telefono || 'N/A'}`,
        `País: ${this.empleado.pais}`,
        `Fecha Nacimiento: ${this.formatear_fecha(this.empleado.fNacimiento)}`,
        `Género: ${this.empleado.genero === 'M' ? 'Masculino' : this.empleado.genero === 'F' ? 'Femenino' : 'Otro'}`
      ];
      
      infoPrimaria.forEach(info => {
        doc.text(info, margen + 5, y);
        y += 6;
      });
      
      y += 10;
      
      // Información laboral
      doc.setFontSize(14);
      doc.text('INFORMACIÓN LABORAL', margen, y);
      y += 10;
      
      doc.setFontSize(10);
      const infoLaboral = [
        `Fecha Ingreso: ${this.formatear_fecha(this.empleado.fecha_ingreso)}`,
        `Departamento: ${this.empleado.departamento}`,
        `Cargo: ${this.empleado.cargo}`,
        `Salario Actual: $${this.empleado.salario_actual}`,
        `Tipo Contrato: ${this.empleado.tipo_contrato}`,
        `Estado: ${this.empleado.estado_empleado}`,
        `Supervisor: ${this.empleado.supervisor_nombres || 'Sin supervisor'}`,
        `Dirección Trabajo: ${this.empleado.direccion_trabajo || 'N/A'}`
      ];
      
      infoLaboral.forEach(info => {
        doc.text(info, margen + 5, y);
        y += 6;
      });
      
      // Verificar si necesitamos nueva página
      if (y > 250) {
        doc.addPage();
        y = margen;
      }
      
      y += 10;
      
      // Roles
      if (this.empleado.roles && this.empleado.roles.length > 0) {
        doc.setFontSize(14);
        doc.text('ROLES ASIGNADOS', margen, y);
        y += 10;
        
        doc.setFontSize(10);
        this.empleado.roles.forEach((rol: any) => {
          doc.text(`• ${rol.nombre} (Nivel ${rol.nivel_acceso})`, margen + 5, y);
          y += 6;
        });
        y += 5;
      }
      
      // Observaciones
      if (this.empleado.observaciones) {
        doc.setFontSize(14);
        doc.text('OBSERVACIONES', margen, y);
        y += 10;
        
        doc.setFontSize(10);
        const observaciones = doc.splitTextToSize(this.empleado.observaciones, 170);
        doc.text(observaciones, margen + 5, y);
        y += observaciones.length * 6;
      }
      
      // Footer
      const fechaGeneracion = new Date().toLocaleDateString('es-ES');
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generado el ${fechaGeneracion}`, margen, 280);
      
      // Descargar
      doc.save(`perfil_${this.empleado.nombres}_${this.empleado.apellidos}.pdf`);
      
      Swal.fire({
        icon: 'success',
        title: 'PDF generado',
        text: 'El perfil del empleado se ha descargado exitosamente',
        confirmButtonColor: '#28a745',
        timer: 2000,
        timerProgressBar: true
      });
    });
  }

  // ======================== UTILITIES ========================

  formatear_fecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  formatear_salario(salario: number): string {
    if (!salario) return '$0.00';
    return '$' + salario.toLocaleString('en-US', { minimumFractionDigits: 2 });
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

  calcular_tiempo_empresa(): string {
    if (!this.empleado.fecha_ingreso) return 'N/A';
    
    const fechaIngreso = new Date(this.empleado.fecha_ingreso);
    const fechaActual = new Date();
    const diffMs = fechaActual.getTime() - fechaIngreso.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''} y ${months} mes${months !== 1 ? 'es' : ''}`;
    } else if (months > 0) {
      return `${months} mes${months > 1 ? 'es' : ''} y ${days} día${days !== 1 ? 's' : ''}`;
    } else {
      return `${days} día${days !== 1 ? 's' : ''}`;
    }
  }

  obtener_icono_tab(tab: string): string {
    const iconos: any = {
      'general': 'fa-user',
      'historial': 'fa-history',
      'ausencias': 'fa-calendar-times',
      'evaluaciones': 'fa-star',
      'documentos': 'fa-file-alt'
    };
    return iconos[tab] || 'fa-circle';
  }

}