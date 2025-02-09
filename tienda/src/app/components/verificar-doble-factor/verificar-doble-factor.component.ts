import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';

declare var iziToast: any;

@Component({
  selector: 'app-verificar-doble-factor',
  templateUrl: './verificar-doble-factor.component.html',
  styleUrls: ['./verificar-doble-factor.component.css']
})
export class VerificarDobleFactorComponent implements OnInit {
  twoFactorCode: string = '';
  email: string = '';
  password: string = '';

  constructor(
    private clienteService: ClienteService,
    private router: Router
  ) {}

  ngOnInit() {
    this.email = sessionStorage.getItem('temp_email') || '';
    this.password = sessionStorage.getItem('temp_password') || '';
    
    if (!this.email || !this.password) {
      this.router.navigate(['/login']);
    } else {
      console.log('Credenciales temporales encontradas');
    }
  }

  verifyCode() {
    if (this.twoFactorCode.length === 6) {
      const loginData = {
        email: this.email,
        password: this.password,
        twoFactorCode: this.twoFactorCode
      };

      this.clienteService.login(loginData).subscribe({
        next: (response) => {
          console.log('Verificación exitosa:', response);
          sessionStorage.removeItem('temp_email');
          sessionStorage.removeItem('temp_password');
          
          localStorage.setItem('token', response.token);
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('usuarioid', response.usuarioid);
          localStorage.setItem('rol', response.rol);
          localStorage.setItem('nombres', response.nombres);
          localStorage.setItem('email', response.email);
          
          this.router.navigate(['/inicio']);
        },
        error: (error) => {
          console.error('Error en verificación:', error);
          iziToast.error({
            title: 'Error',
            message: 'Código incorrecto',
            position: 'topRight'
          });
          this.twoFactorCode = '';
        }
      });
    }
  }
}