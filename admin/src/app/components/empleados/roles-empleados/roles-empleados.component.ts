import { Component, OnInit } from '@angular/core';
import { EmpleadosService } from '../../../services/empleados.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles-empleados',
  templateUrl: './roles-empleados.component.html',
  styleUrls: ['./roles-empleados.component.css']
})
export class RolesEmpleadosComponent implements OnInit {

  public token = localStorage.getItem('token');
  
  // Pestañas activas
  public tab_activa = 'roles';
  
  // ======================== DATOS DE ROLES ========================
  public roles: Array<any> = [];
  public rol_seleccionado: any = null;
  public empleados_por_rol: Array<any> = [];
  
  // Formulario de rol
  public rol_form = {
    rolid: null,
    nombre: '',
    descripcion: '',
    nivel_acceso: 1,
    estado: 'Activo'
  };
  
  // ======================== DATOS DE PERMISOS ========================
  public permisos: Array<any> = [];
  public permisos_por_modulo: any = {};
  public permiso_seleccionado: any = null;
  
  // Formulario de permiso
  public permiso_form = {
    permisoid: null,
    nombre: '',
    descripcion: '',
    modulo: '',
    accion: '',
    codigo: '',
    estado: 'Activo'
  };
  
  // ======================== ESTADOS DE CARGA ========================
  public load_data = true;
  public load_roles = false;
  public load_permisos = false;
  public load_empleados_rol = false;
  public load_btn = false;
  
  // ======================== CONFIGURACIÓN ========================
  public modulos_disponibles = [
    { codigo: 'usuarios', nombre: 'Usuarios', icono: 'fa-users' },
    { codigo: 'empleados', nombre: 'Empleados', icono: 'fa-user-tie' },
    { codigo: 'productos', nombre: 'Productos', icono: 'fa-box' },
    { codigo: 'finanzas', nombre: 'Finanzas', icono: 'fa-calculator' },
    { codigo: 'ventas', nombre: 'Ventas', icono: 'fa-shopping-cart' },
    { codigo: 'compras', nombre: 'Compras', icono: 'fa-shopping-basket' },
    { codigo: 'marketing', nombre: 'Marketing', icono: 'fa-bullhorn' },
    { codigo: 'logistica', nombre: 'Logística', icono: 'fa-truck' },
    { codigo: 'atencion', nombre: 'Atención al Cliente', icono: 'fa-headset' },
    { codigo: 'reportes', nombre: 'Reportes', icono: 'fa-chart-bar' }
  ];
  
  public acciones_disponibles = [
    'leer', 'crear', 'actualizar', 'eliminar', 'aprobar', 'exportar'
  ];
  
  public niveles_acceso = [
    { valor: 1, nombre: 'Básico', descripcion: 'Acceso limitado' },
    { valor: 2, nombre: 'Intermedio', descripcion: 'Acceso moderado' },
    { valor: 3, nombre: 'Avanzado', descripcion: 'Acceso amplio' },
    { valor: 4, nombre: 'Administrador', descripcion: 'Acceso completo' }
  ];
  
  // Modales
  public modal_rol = false;
  public modal_permiso = false;
  public modal_empleados_rol = false;
  public editando_rol = false;
  public editando_permiso = false;
  
  // Filtros
  public filtro_roles = '';
  public filtro_permisos = '';
  public filtro_modulo = '';
  
  // Errores
  public errores: any = {};

  constructor(
    private _empleadosService: EmpleadosService
  ) { }

  ngOnInit(): void {
    this.cargar_datos_iniciales();
  }

  // ======================== CARGA DE DATOS ========================

  cargar_datos_iniciales() {
    this.load_data = true;
    
    Promise.all([
      this.cargar_roles(),
      this.cargar_permisos()
    ]).then(() => {
      this.load_data = false;
    }).catch(error => {
      console.error('Error al cargar datos:', error);
      this.load_data = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos de roles y permisos'
      });
    });
  }

  cargar_roles(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._empleadosService.listar_roles(this.token).subscribe(
        response => {
          this.roles = response || [];
          resolve(response);
        },
        error => {
          console.error('Error al cargar roles:', error);
          reject(error);
        }
      );
    });
  }

  cargar_permisos(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._empleadosService.listar_permisos(null, this.token).subscribe(
        response => {
          this.permisos = response || [];
          this.organizar_permisos_por_modulo();
          resolve(response);
        },
        error => {
          console.error('Error al cargar permisos:', error);
          reject(error);
        }
      );
    });
  }

  organizar_permisos_por_modulo() {
    this.permisos_por_modulo = {};
    this.permisos.forEach(permiso => {
      if (!this.permisos_por_modulo[permiso.modulo]) {
        this.permisos_por_modulo[permiso.modulo] = [];
      }
      this.permisos_por_modulo[permiso.modulo].push(permiso);
    });
  }

  // ======================== GESTIÓN DE PESTAÑAS ========================

  cambiar_tab(tab: string) {
    this.tab_activa = tab;
    this.cerrar_modales();
  }

  // ======================== GESTIÓN DE ROLES ========================

  abrir_modal_rol(rol?: any) {
    this.editando_rol = !!rol;
    this.modal_rol = true;
    this.errores = {};
    
    if (rol) {
      // CORREGIDO: copiar todos los datos incluyendo el ID
      this.rol_form = {
        rolid: rol.rolid,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        nivel_acceso: rol.nivel_acceso,
        estado: rol.estado
      };
    } else {
      // Resetear formulario para nuevo rol
      this.rol_form = {
        rolid: null,
        nombre: '',
        descripcion: '',
        nivel_acceso: 1,
        estado: 'Activo'
      };
    }
  }

  async guardar_rol() {
    if (!this.validar_formulario_rol()) {
      return;
    }

    this.load_btn = true;

    if (this.editando_rol) {
      this._empleadosService.actualizar_rol(this.rol_form.rolid, this.rol_form, this.token).subscribe(
        response => {
          this.load_btn = false;
          this.modal_rol = false;
          
          Swal.fire({
            icon: 'success',
            title: '¡Rol actualizado!',
            text: 'El rol ha sido actualizado exitosamente',
            timer: 2000,
            timerProgressBar: true
          });
          
          this.cargar_roles();
        },
        error => {
          this.load_btn = false;
          console.error('Error al actualizar rol:', error);
          
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.error || 'Error al actualizar el rol'
          });
        }
      );
    } else {
      this._empleadosService.crear_rol(this.rol_form, this.token).subscribe(
        response => {
          this.load_btn = false;
          this.modal_rol = false;
          
          Swal.fire({
            icon: 'success',
            title: '¡Rol creado!',
            text: 'El rol ha sido creado exitosamente',
            timer: 2000,
            timerProgressBar: true
          });
          
          this.cargar_roles();
        },
        error => {
          this.load_btn = false;
          console.error('Error al crear rol:', error);
          
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.error || 'Error al crear el rol'
          });
        }
      );
    }
  }

  validar_formulario_rol(): boolean {
    this.errores = {};

    if (!this.rol_form.nombre || this.rol_form.nombre.trim().length < 3) {
      this.errores.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!this.rol_form.descripcion || this.rol_form.descripcion.trim().length < 10) {
      this.errores.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!this.rol_form.nivel_acceso || this.rol_form.nivel_acceso < 1 || this.rol_form.nivel_acceso > 4) {
      this.errores.nivel_acceso = 'Selecciona un nivel de acceso válido';
    }

    return Object.keys(this.errores).length === 0;
  }

  async eliminar_rol(rol: any) {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar rol?',
      text: `¿Estás seguro de eliminar el rol "${rol.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (!confirmacion.isConfirmed) return;

    this._empleadosService.eliminar_rol(rol.rolid, this.token).subscribe(
      response => {
        Swal.fire({
          icon: 'success',
          title: '¡Rol eliminado!',
          text: 'El rol ha sido eliminado exitosamente',
          timer: 2000,
          timerProgressBar: true
        });
        
        this.cargar_roles();
      },
      error => {
        console.error('Error al eliminar rol:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.error || 'No se puede eliminar el rol. Puede estar en uso.'
        });
      }
    );
  }

  ver_empleados_rol(rol: any) {
    this.rol_seleccionado = rol;
    this.modal_empleados_rol = true;
    this.load_empleados_rol = true;
    
    this._empleadosService.obtener_empleados_por_rol(rol.rolid, this.token).subscribe(
      response => {
        this.empleados_por_rol = response || [];
        this.load_empleados_rol = false;
      },
      error => {
        console.error('Error al cargar empleados por rol:', error);
        this.empleados_por_rol = [];
        this.load_empleados_rol = false;
      }
    );
  }

  // ======================== GESTIÓN DE PERMISOS ========================

  abrir_modal_permiso(permiso?: any) {
    this.editando_permiso = !!permiso;
    this.modal_permiso = true;
    this.errores = {};
    
    if (permiso) {
      // CORREGIDO: copiar todos los datos incluyendo el ID
      this.permiso_form = {
        permisoid: permiso.permisoid,
        nombre: permiso.nombre,
        descripcion: permiso.descripcion,
        modulo: permiso.modulo,
        accion: permiso.accion,
        codigo: permiso.codigo,
        estado: permiso.estado
      };
    } else {
      // Resetear formulario para nuevo permiso
      this.permiso_form = {
        permisoid: null,
        nombre: '',
        descripcion: '',
        modulo: '',
        accion: '',
        codigo: '',
        estado: 'Activo'
      };
    }
  }

  async guardar_permiso() {
    if (!this.validar_formulario_permiso()) {
      return;
    }

    // Auto-generar código si no existe
    if (!this.permiso_form.codigo.trim()) {
      this.permiso_form.codigo = `${this.permiso_form.modulo}.${this.permiso_form.accion}`;
    }

    this.load_btn = true;

    if (this.editando_permiso) {
      this._empleadosService.actualizar_permiso(this.permiso_form.permisoid, this.permiso_form, this.token).subscribe(
        response => {
          this.load_btn = false;
          this.modal_permiso = false;
          
          Swal.fire({
            icon: 'success',
            title: '¡Permiso actualizado!',
            text: 'El permiso ha sido actualizado exitosamente',
            timer: 2000,
            timerProgressBar: true
          });
          
          this.cargar_permisos();
        },
        error => {
          this.load_btn = false;
          console.error('Error al actualizar permiso:', error);
          
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.error || 'Error al actualizar el permiso'
          });
        }
      );
    } else {
      this._empleadosService.crear_permiso(this.permiso_form, this.token).subscribe(
        response => {
          this.load_btn = false;
          this.modal_permiso = false;
          
          Swal.fire({
            icon: 'success',
            title: '¡Permiso creado!',
            text: 'El permiso ha sido creado exitosamente',
            timer: 2000,
            timerProgressBar: true
          });
          
          this.cargar_permisos();
        },
        error => {
          this.load_btn = false;
          console.error('Error al crear permiso:', error);
          
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.error || 'Error al crear el permiso'
          });
        }
      );
    }
  }

  validar_formulario_permiso(): boolean {
    this.errores = {};

    if (!this.permiso_form.nombre || this.permiso_form.nombre.trim().length < 3) {
      this.errores.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!this.permiso_form.descripcion || this.permiso_form.descripcion.trim().length < 10) {
      this.errores.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!this.permiso_form.modulo) {
      this.errores.modulo = 'Selecciona un módulo';
    }

    if (!this.permiso_form.accion) {
      this.errores.accion = 'Selecciona una acción';
    }

    return Object.keys(this.errores).length === 0;
  }

  actualizar_codigo_permiso() {
    if (this.permiso_form.modulo && this.permiso_form.accion) {
      this.permiso_form.codigo = `${this.permiso_form.modulo}.${this.permiso_form.accion}`;
    }
  }

  async eliminar_permiso(permiso: any) {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar permiso?',
      text: `¿Estás seguro de eliminar el permiso "${permiso.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (!confirmacion.isConfirmed) return;

    this._empleadosService.eliminar_permiso(permiso.permisoid, this.token).subscribe(
      response => {
        Swal.fire({
          icon: 'success',
          title: '¡Permiso eliminado!',
          text: 'El permiso ha sido eliminado exitosamente',
          timer: 2000,
          timerProgressBar: true
        });
        
        this.cargar_permisos();
      },
      error => {
        console.error('Error al eliminar permiso:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.error || 'No se puede eliminar el permiso. Puede estar en uso.'
        });
      }
    );
  }

  // ======================== UTILIDADES ========================

  cerrar_modales() {
    this.modal_rol = false;
    this.modal_permiso = false;
    this.modal_empleados_rol = false;
    this.editando_rol = false;
    this.editando_permiso = false;
    this.errores = {};
  }

  obtener_roles_filtrados() {
    if (!this.filtro_roles.trim()) {
      return this.roles;
    }
    
    return this.roles.filter(rol => 
      rol.nombre.toLowerCase().includes(this.filtro_roles.toLowerCase()) ||
      rol.descripcion.toLowerCase().includes(this.filtro_roles.toLowerCase())
    );
  }

  obtener_permisos_filtrados() {
    let permisos_filtrados = this.permisos;
    
    // Filtro por texto
    if (this.filtro_permisos.trim()) {
      permisos_filtrados = permisos_filtrados.filter(permiso => 
        permiso.nombre.toLowerCase().includes(this.filtro_permisos.toLowerCase()) ||
        permiso.descripcion.toLowerCase().includes(this.filtro_permisos.toLowerCase())
      );
    }
    
    // Filtro por módulo
    if (this.filtro_modulo && this.filtro_modulo !== 'todos') {
      permisos_filtrados = permisos_filtrados.filter(permiso => 
        permiso.modulo === this.filtro_modulo
      );
    }
    
    return permisos_filtrados;
  }

  obtener_badge_nivel(nivel: number): string {
    switch (nivel) {
      case 1: return 'badge-secondary';
      case 2: return 'badge-info';
      case 3: return 'badge-warning';
      case 4: return 'badge-danger';
      default: return 'badge-light';
    }
  }

  obtener_badge_estado(estado: string): string {
    switch (estado) {
      case 'Activo': return 'badge-success';
      case 'Inactivo': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  obtener_icono_modulo(modulo: string): string {
    const moduloObj = this.modulos_disponibles.find(m => m.codigo === modulo);
    return moduloObj ? moduloObj.icono : 'fa-cog';
  }

  obtener_nombre_modulo(modulo: string): string {
    const moduloObj = this.modulos_disponibles.find(m => m.codigo === modulo);
    return moduloObj ? moduloObj.nombre : modulo;
  }

  obtener_descripcion_nivel(nivel: number): string {
    const nivelObj = this.niveles_acceso.find(n => n.valor === nivel);
    return nivelObj ? nivelObj.descripcion : '';
  }

  obtener_cantidad_permisos_modulo(modulo: string): number {
    return this.permisos_por_modulo[modulo] ? this.permisos_por_modulo[modulo].length : 0;
  }
}