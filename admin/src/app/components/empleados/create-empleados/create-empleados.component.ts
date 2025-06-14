import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmpleadosService } from '../../../services/empleados.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-empleados',
  templateUrl: './create-empleados.component.html',
  styleUrls: ['./create-empleados.component.css']
})
export class CreateEmpleadosComponent implements OnInit {

  public token = localStorage.getItem('token');
  
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
    
    // Roles y permisos
    roles: [],
    permisos: []
  };

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

  public modulos_disponibles = [
    'usuarios', 'empleados', 'productos', 'finanzas', 'ventas',
    'compras', 'marketing', 'logistica', 'atencion', 'reportes'
  ];

  // Validaciones
  public errores: any = {};

  constructor(
    private _empleadosService: EmpleadosService,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.empleado.fecha_ingreso = new Date().toISOString().split('T')[0];
    this.cargar_datos_iniciales();
  }

  // ======================== CARGA DE DATOS ========================

  cargar_datos_iniciales() {
    this.load_data = true;
    
    Promise.all([
      this.cargar_departamentos(),
      this.cargar_cargos(),
      this.cargar_roles(),
      this.cargar_permisos(),
      this.cargar_empleados_supervisores()
    ]).then(() => {
      this.load_data = false;
    }).catch(error => {
      console.error('Error al cargar datos iniciales:', error);
      this.load_data = false;
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
      // Llamar a listar empleados para obtener posibles supervisores
      const filtros = { estado: 'Activo', limite: 100, pagina: 1 };
      this._empleadosService.listar_empleados(filtros, this.token).subscribe(
        response => {
          this.empleados_supervisores = response.empleados || [];
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
    // Auto-llenar salario base del cargo seleccionado
    if (this.empleado.cargoid) {
      const cargo_seleccionado = this.cargos.find(cargo => 
        cargo.cargoid == this.empleado.cargoid
      );
      if (cargo_seleccionado && cargo_seleccionado.salario_base) {
        this.empleado.salario_actual = cargo_seleccionado.salario_base;
      }
    }
  }

  generar_email_automatico() {
    if (this.empleado.nombres && this.empleado.apellidos) {
      const nombres = this.empleado.nombres.toLowerCase().replace(/\s+/g, '');
      const apellidos = this.empleado.apellidos.toLowerCase().replace(/\s+/g, '');
      this.empleado.email = `${nombres}.${apellidos}@empresa.com`;
    }
  }

  generar_password_temporal() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.empleado.password = password;
    this.empleado.confirm_password = password;
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

    if (!this.empleado.password.trim()) {
      this.errores.password = 'Contraseña es requerida';
    } else if (this.empleado.password.length < 6) {
      this.errores.password = 'Contraseña debe tener al menos 6 caracteres';
    }

    if (this.empleado.password !== this.empleado.confirm_password) {
      this.errores.confirm_password = 'Las contraseñas no coinciden';
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

  // ======================== ACCIONES ========================

  async crear_empleado() {
    if (!this.validar_formulario()) {
        Swal.fire({
            icon: 'warning',
            title: 'Formulario incompleto',
            text: 'Por favor, revisa los campos marcados en rojo',
            confirmButtonColor: '#ffc107'
        });
        return;
    }

    // Confirmación antes de crear
    const confirmacion = await Swal.fire({
        title: 'Crear empleado',
        text: `¿Confirmas la creación del empleado ${this.empleado.nombres} ${this.empleado.apellidos}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fa fa-check"></i> Sí, crear',
        cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d'
    });

    if (!confirmacion.isConfirmed) return;

    this.load_btn = true;

    // PREPARAR DATOS - CORREGIR VALORES VACÍOS
    const data = { ...this.empleado };
    delete data.confirm_password;

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

    // Asegurar que los arrays existan
    if (!data.roles) {
        data.roles = [];
    }
    
    if (!data.permisos) {
        data.permisos = [];
    }

    this._empleadosService.crear_empleado(data, this.token).subscribe(
        response => {
            this.load_btn = false;
            
            Swal.fire({
                icon: 'success',
                title: '¡Empleado creado!',
                html: `
                    <div class="text-left">
                        <p><strong>Empleado:</strong> ${this.empleado.nombres} ${this.empleado.apellidos}</p>
                        <p><strong>Código:</strong> ${response.codigo_empleado}</p>
                        <p><strong>Email:</strong> ${this.empleado.email}</p>
                        <p class="text-info"><small><i class="fa fa-info-circle"></i> El empleado recibirá sus credenciales por email</small></p>
                    </div>
                `,
                confirmButtonColor: '#28a745',
                timer: 5000,
                timerProgressBar: true
            }).then(() => {
                this._router.navigate(['/panel/empleados']);
            });
        },
        error => {
            this.load_btn = false;
            console.error('Error al crear empleado:', error);
            
            let mensaje = 'Error al crear el empleado';
            if (error.error && error.error.error) {
                mensaje = error.error.error;
            }

            Swal.fire({
                icon: 'error',
                title: 'Error al crear empleado',
                text: mensaje,
                confirmButtonColor: '#dc3545'
            });
        }
    );
  }

  cancelar() {
    Swal.fire({
      title: '¿Cancelar creación?',
      text: 'Se perderán todos los datos ingresados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-check"></i> Sí, cancelar',
      cancelButtonText: '<i class="fa fa-times"></i> Continuar editando',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this._router.navigate(['/panel/empleados']);
      }
    });
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
}