import { Component } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { Router } from '@angular/router';

declare var iziToast: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  user: any = {};
  showPassword = false; 

  constructor(private clienteService: ClienteService, private router: Router) {}

  login(loginForm: { valid: any; }) {
    // Validar campos vacíos
    if (!this.user.email || !this.user.password) {
      iziToast.error({
        title: 'Error',
        message: 'Por favor complete todos los campos',
        position: 'topRight'
      });
      return;
    }

    if (loginForm.valid) {
      this.clienteService.login({ 
        email: this.user.email, 
        password: this.user.password 
      }).subscribe({
        next: (response) => {
          if (response.requiresTwoFactor) {
            sessionStorage.setItem('temp_email', this.user.email);
            sessionStorage.setItem('temp_password', this.user.password);
            this.router.navigate(['/verify-2fa']);
            return;
          }
          
          localStorage.setItem('token', response.token);
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('usuarioid', response.usuarioid);
          localStorage.setItem('rol', response.rol);
          localStorage.setItem('nombres', response.nombres);
          localStorage.setItem('email', response.email);
          this.router.navigate(['/inicio']);
        },
        error: (error) => {
          console.error('Error en login:', error);
          
          // Mensajes específicos según el error
          if (error.error.error === 'Usuario no encontrado') {
            iziToast.error({
              title: 'Error',
              message: 'El correo electrónico ingresado no está registrado',
              position: 'topRight'
            });
          } else if (error.error.error === 'Credenciales incorrectas') {
            iziToast.error({
              title: 'Error', 
              message: 'La contraseña ingresada es incorrecta',
              position: 'topRight'
            });
          } else {
            iziToast.error({
              title: 'Error',
              message: 'Ocurrió un error al iniciar sesión',
              position: 'topRight'
            });
          }
        }
      });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Alterna entre mostrar y ocultar la contraseña
  }
}