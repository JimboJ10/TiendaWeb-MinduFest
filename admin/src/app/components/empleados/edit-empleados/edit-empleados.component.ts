import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EmpleadosService } from '../../../services/empleados.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-empleados',
  templateUrl: './edit-empleados.component.html',
  styleUrls: ['./edit-empleados.component.css']
})
export class EditEmpleadosComponent implements OnInit {

  public token = localStorage.getItem('token');
  public id: any;
  
  // Datos del formulario
  public empleado: any = {
    // Datos usuario
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    pais: 'Ecuador',
    fNacimiento: '',
    genero: 'M',
    password: '',
    confirm_password: '',
    cambiar_password: false,
    
    // Datos empleado
    codigo_empleado: '',
    fecha_ingreso: '',
    cargoid: '',
    departamentoid: '',
    salario_actual: 0,
    tipo_contrato: 'Indefinido',
    supervisor_id: '',
    direccion_trabajo: '',
    observaciones: '',
    estado_empleado: 'Activo',
    
    // Roles y permisos
    roles: [],
    permisos: []
  };

  public empleado_original: any = {}; // Para comparar cambios

  // Datos auxiliares
  public departamentos: Array<any> = [];
  public cargos: Array<any> = [];
  public cargos_filtrados: Array<any> = [];
  public roles: Array<any> = [];
  public permisos: Array<any> = [];
  public permisos_por_modulo: any = {};
  public empleados_supervisores: Array<any> = [];

  // Estados de carga
  public load_btn = false;
  public load_data = true;

  // Configuración
  public paises = [
    'Ecuador', 'Colombia', 'Perú', 'Venezuela', 'Argentina', 
    'Chile', 'Brasil', 'México', 'España', 'Estados Unidos'
  ];

  public tipos_contrato = [
    'Indefinido', 'Temporal', 'Por Obra', 'Prácticas', 'Freelance'
  ];

  public estados_empleado = [
    'Activo', 'Inactivo', 'Suspendido', 'Retirado'
  ];

  public modulos_disponibles = [
    'usuarios', 'empleados', 'productos', 'finanzas', 'ventas',
    'compras', 'marketing', 'logistica', 'atencion', 'reportes'
  ];

  // Validaciones
  public errores: any = {};

  constructor(
    private _empleadosService: EmpleadosService,
    private _router: Router,
    private _route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.cargar_datos_iniciales();
    });
  }

  // ======================== CARGA DE DATOS ========================

  cargar_datos_iniciales() {
    this.load_data = true;
    
    Promise.all([
      this.cargar_empleado(),
      this.cargar_departamentos(),
      this.cargar_cargos(),
      this.cargar_roles(),
      this.cargar_permisos(),
      this.cargar_empleados_supervisores()
    ]).then(() => {
      this.load_data = false;
      this.empleado_original = JSON.parse(JSON.stringify(this.empleado));
    }).catch(error => {
      console.error('Error al cargar datos iniciales:', error);
      this.load_data = false;
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar datos',
        text: 'No se pudieron cargar los datos del empleado',
        confirmButtonColor: '#dc3545'
      }).then(() => {
        this._router.navigate(['/panel/empleados']);
      });
    });
  }

  cargar_empleado(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._empleadosService.obtener_empleado(this.id, this.token).subscribe(
        response => {
          this.empleado = {
            // Datos usuario
            dni: response.dni || '',
            nombres: response.nombres || '',
            apellidos: response.apellidos || '',
            email: response.email || '',
            telefono: response.telefono || '',
            pais: response.pais || 'Ecuador',
            fNacimiento: response.fNacimiento ? response.fNacimiento.split('T')[0] : '',
            genero: response.genero || 'M',
            password: '',
            confirm_password: '',
            cambiar_password: false,
            
            // Datos empleado
            codigo_empleado: response.codigo_empleado || '',
            fecha_ingreso: response.fecha_ingreso ? response.fecha_ingreso.split('T')[0] : '',
            cargoid: response.cargoid || '',
            departamentoid: response.departamentoid || '',
            salario_actual: response.salario_actual || 0,
            tipo_contrato: response.tipo_contrato || 'Indefinido',
            supervisor_id: response.supervisor_id || '',
            direccion_trabajo: response.direccion_trabajo || '',
            observaciones: response.observaciones || '',
            estado_empleado: response.estado_empleado || 'Activo',
            
            // Roles y permisos
            roles: response.roles ? response.roles.map((r: any) => r.rolid) : [],
            permisos: response.permisos ? response.permisos.map((p: any) => p.permisoid) : []
          };
          resolve(response);
        },
        error => {
          console.error('Error al cargar empleado:', error);
          reject(error);
        }
      );
    });
  }

  cargar_departamentos(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._empleadosService.listar_departamentos(this.token).subscribe(
        response => {
          this.departamentos = response;
          resolve(response);
        },
        error => {
          console.error('Error al cargar departamentos:', error);
          reject(error);
        }
      );
    });
  }

  cargar_cargos(departamentoid?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this._empleadosService.listar_cargos(departamentoid, this.token).subscribe(
        response => {
          this.cargos = response;
          this.filtrar_cargos();
          resolve(response);
        },
        error => {
          console.error('Error al cargar cargos:', error);
          reject(error);
        }
      );
    });
  }

  cargar_roles(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._empleadosService.listar_roles(this.token).subscribe(
        response => {
          this.roles = response;
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
          this.permisos = response;
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

  cargar_empleados_supervisores(): Promise<any> {
    return new Promise((resolve, reject) => {
      const filtros = { estado: 'Activo', limite: 100, pagina: 1 };
      this._empleadosService.listar_empleados(filtros, this.token).subscribe(
        response => {
          this.empleados_supervisores = (response.empleados || []).filter(
            (emp: any) => emp.empleadoid != this.id // Excluir al mismo empleado
          );
          resolve(response);
        },
        error => {
          console.error('Error al cargar supervisores:', error);
          reject(error);
        }
      );
    });
  }

  // ======================== MANEJO DE FORMULARIO ========================

  cambiar_departamento() {
    this.empleado.cargoid = '';
    this.filtrar_cargos();
  }

  filtrar_cargos() {
    if (this.empleado.departamentoid) {
      this.cargos_filtrados = this.cargos.filter(cargo => 
        cargo.departamentoid == this.empleado.departamentoid
      );
    } else {
      this.cargos_filtrados = this.cargos;
    }
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

  cambiar_cargo() {
    const cargo_seleccionado = this.cargos.find(cargo => 
      cargo.cargoid == this.empleado.cargoid
    );
    if (cargo_seleccionado && cargo_seleccionado.salario_base) {
      // Preguntar si quiere actualizar el salario
      Swal.fire({
        title: 'Actualizar salario',
        text: `¿Deseas actualizar el salario a $${cargo_seleccionado.salario_base} (salario base del cargo)?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'No, mantener actual',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.empleado.salario_actual = cargo_seleccionado.salario_base;
        }
      });
    }
  }

  toggle_cambiar_password() {
    this.empleado.cambiar_password = !this.empleado.cambiar_password;
    if (!this.empleado.cambiar_password) {
      this.empleado.password = '';
      this.empleado.confirm_password = '';
      delete this.errores.password;
      delete this.errores.confirm_password;
    }
  }

  // ======================== VALIDACIONES ========================

  validar_formulario(): boolean {
    this.errores = {};

    // Validaciones usuario
    if (!this.empleado.dni || this.empleado.dni.length < 10) {
      this.errores.dni = 'DNI debe tener al menos 10 caracteres';
    }

    if (!this.empleado.nombres.trim()) {
      this.errores.nombres = 'Nombres son requeridos';
    }

    if (!this.empleado.apellidos.trim()) {
      this.errores.apellidos = 'Apellidos son requeridos';
    }

    if (!this.empleado.email.trim()) {
      this.errores.email = 'Email es requerido';
    } else if (!this.validar_email(this.empleado.email)) {
      this.errores.email = 'Email no tiene un formato válido';
    }

    // Validaciones de contraseña solo si se va a cambiar
    if (this.empleado.cambiar_password) {
      if (!this.empleado.password.trim()) {
        this.errores.password = 'Contraseña es requerida';
      } else if (this.empleado.password.length < 6) {
        this.errores.password = 'Contraseña debe tener al menos 6 caracteres';
      }

      if (this.empleado.password !== this.empleado.confirm_password) {
        this.errores.confirm_password = 'Las contraseñas no coinciden';
      }
    }

    // Validaciones empleado
    if (!this.empleado.fecha_ingreso) {
      this.errores.fecha_ingreso = 'Fecha de ingreso es requerida';
    }

    if (!this.empleado.departamentoid) {
      this.errores.departamentoid = 'Departamento es requerido';
    }

    if (!this.empleado.cargoid) {
      this.errores.cargoid = 'Cargo es requerido';
    }

    if (!this.empleado.salario_actual || this.empleado.salario_actual <= 0) {
      this.errores.salario_actual = 'Salario debe ser mayor a 0';
    }

    if (this.empleado.roles.length === 0) {
      this.errores.roles = 'Debe asignar al menos un rol';
    }

    return Object.keys(this.errores).length === 0;
  }

  validar_email(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // ======================== DETECCIÓN DE CAMBIOS ========================

  hay_cambios(): boolean {
    const actual = JSON.stringify(this.empleado);
    const original = JSON.stringify(this.empleado_original);
    return actual !== original || this.empleado.cambiar_password;
  }

  obtener_resumen_cambios(): string[] {
    const cambios = [];
    
    if (this.empleado.nombres !== this.empleado_original.nombres) {
      cambios.push(`Nombres: "${this.empleado_original.nombres}" → "${this.empleado.nombres}"`);
    }
    
    if (this.empleado.apellidos !== this.empleado_original.apellidos) {
      cambios.push(`Apellidos: "${this.empleado_original.apellidos}" → "${this.empleado.apellidos}"`);
    }
    
    if (this.empleado.email !== this.empleado_original.email) {
      cambios.push(`Email: "${this.empleado_original.email}" → "${this.empleado.email}"`);
    }
    
    if (this.empleado.salario_actual !== this.empleado_original.salario_actual) {
      cambios.push(`Salario: $${this.empleado_original.salario_actual} → $${this.empleado.salario_actual}`);
    }
    
    if (this.empleado.estado_empleado !== this.empleado_original.estado_empleado) {
      cambios.push(`Estado: "${this.empleado_original.estado_empleado}" → "${this.empleado.estado_empleado}"`);
    }
    
    if (this.empleado.cambiar_password) {
      cambios.push('Contraseña será actualizada');
    }
    
    return cambios;
  }

  // ======================== ACCIONES ========================

  async actualizar_empleado() {
    if (!this.validar_formulario()) {
        Swal.fire({
            icon: 'warning',
            title: 'Formulario incompleto',
            text: 'Por favor, revisa los campos marcados en rojo',
            confirmButtonColor: '#ffc107'
        });
        return;
    }

    if (!this.hay_cambios()) {
        Swal.fire({
            icon: 'info',
            title: 'Sin cambios',
            text: 'No hay cambios para guardar',
            confirmButtonColor: '#17a2b8'
        });
        return;
    }

    // Mostrar resumen de cambios
    const cambios = this.obtener_resumen_cambios();
    const htmlCambios = cambios.map(cambio => `<li class="text-left">${cambio}</li>`).join('');

    const confirmacion = await Swal.fire({
        title: 'Confirmar actualización',
        html: `
            <div class="text-left">
                <p><strong>Se actualizarán los siguientes datos:</strong></p>
                <ul>${htmlCambios}</ul>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fa fa-save"></i> Guardar cambios',
        cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        width: '600px'
    });

    if (!confirmacion.isConfirmed) return;

    this.load_btn = true;

    // PREPARAR DATOS - CORREGIR VALORES VACÍOS
    const data = { ...this.empleado };
    delete data.confirm_password;
    delete data.cambiar_password;
    
    // Convertir campos vacíos a null para evitar errores de PostgreSQL
    if (!data.supervisor_id || data.supervisor_id === '') {
        data.supervisor_id = null;
    }
    
    if (!data.telefono || data.telefono === '') {
        data.telefono = null;
    }
    
    if (!data.fNacimiento || data.fNacimiento === '') {
        data.fNacimiento = null;
    }
    
    if (!data.direccion_trabajo || data.direccion_trabajo === '') {
        data.direccion_trabajo = null;
    }
    
    if (!data.observaciones || data.observaciones === '') {
        data.observaciones = null;
    }

    // Convertir IDs a números enteros
    if (data.cargoid) {
        data.cargoid = parseInt(data.cargoid);
    }
    
    if (data.departamentoid) {
        data.departamentoid = parseInt(data.departamentoid);
    }
    
    if (data.supervisor_id) {
        data.supervisor_id = parseInt(data.supervisor_id);
    }

    // Asegurar que los arrays existan
    if (!data.roles) {
        data.roles = [];
    }
    
    if (!data.permisos) {
        data.permisos = [];
    }

    // Solo incluir password si se va a cambiar
    if (!this.empleado.cambiar_password) {
        delete data.password;
    }

    console.log('Datos a enviar:', data); // Para debug

    this._empleadosService.actualizar_empleado(this.id, data, this.token).subscribe(
        response => {
            this.load_btn = false;
            
            Swal.fire({
                icon: 'success',
                title: '¡Empleado actualizado!',
                text: `Los datos de ${this.empleado.nombres} ${this.empleado.apellidos} han sido actualizados exitosamente`,
                confirmButtonColor: '#28a745',
                timer: 3000,
                timerProgressBar: true
            }).then(() => {
                this._router.navigate(['/panel/empleados']);
            });
        },
        error => {
            this.load_btn = false;
            console.error('Error al actualizar empleado:', error);
            
            let mensaje = 'Error al actualizar el empleado';
            if (error.error && error.error.error) {
                mensaje = error.error.error;
            }

            Swal.fire({
                icon: 'error',
                title: 'Error al actualizar',
                text: mensaje,
                confirmButtonColor: '#dc3545'
            });
        }
    );
  }

  async cancelar() {
    if (this.hay_cambios()) {
      const confirmacion = await Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes cambios sin guardar. ¿Estás seguro de salir?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="fa fa-check"></i> Sí, descartar',
        cancelButtonText: '<i class="fa fa-times"></i> Continuar editando',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
      });

      if (!confirmacion.isConfirmed) return;
    }

    this._router.navigate(['/panel/empleados']);
  }

  // ======================== UTILITIES ========================

  es_rol_seleccionado(rolid: any): boolean {
    return this.empleado.roles.includes(parseInt(rolid));
  }

  toggle_rol(rolid: any) {
    const id = parseInt(rolid);
    const index = this.empleado.roles.indexOf(id);
    
    if (index > -1) {
      this.empleado.roles.splice(index, 1);
    } else {
      this.empleado.roles.push(id);
    }
  }

  es_permiso_seleccionado(permisoid: any): boolean {
    return this.empleado.permisos.includes(parseInt(permisoid));
  }

  toggle_permiso(permisoid: any) {
    const id = parseInt(permisoid);
    const index = this.empleado.permisos.indexOf(id);
    
    if (index > -1) {
      this.empleado.permisos.splice(index, 1);
    } else {
      this.empleado.permisos.push(id);
    }
  }

  obtener_nombre_modulo(modulo: string): string {
    const nombres: any = {
      'usuarios': 'Usuarios',
      'empleados': 'Empleados', 
      'productos': 'Productos',
      'finanzas': 'Finanzas',
      'ventas': 'Ventas',
      'compras': 'Compras',
      'marketing': 'Marketing',
      'logistica': 'Logística',
      'atencion': 'Atención al Cliente',
      'reportes': 'Reportes'
    };
    return nombres[modulo] || modulo;
  }

  obtener_icono_modulo(modulo: string): string {
    const iconos: any = {
      'usuarios': 'fa-users',
      'empleados': 'fa-user-tie',
      'productos': 'fa-box',
      'finanzas': 'fa-calculator',
      'ventas': 'fa-shopping-cart',
      'compras': 'fa-shopping-basket',
      'marketing': 'fa-bullhorn',
      'logistica': 'fa-truck',
      'atencion': 'fa-headset',
      'reportes': 'fa-chart-bar'
    };
    return iconos[modulo] || 'fa-cog';
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
}