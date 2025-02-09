import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';

declare var iziToast: any;

@Component({
  selector: 'app-restablecer-password',
  templateUrl: './restablecer-password.component.html',
  styleUrl: './restablecer-password.component.css'
})
export class RestablecerPasswordComponent implements OnInit{

  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService
  ) { }

  validarPassword(password: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/;
    return regex.test(password);
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    if (!this.validarPassword(this.newPassword)) {
      iziToast.error({
        title: 'ERROR',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'La contraseña debe tener una mayúscula, números y al menos un carácter especial (@$!%*?&)'
      });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      iziToast.error({
        title: 'ERROR',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Las contraseñas no coinciden'
      });
      return;
    }

    this.clienteService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        iziToast.success({
          title: 'Éxito',
          message: 'Contraseña actualizada correctamente',
          position: 'topRight'
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        iziToast.error({
          title: 'Error',
          message: error.error.message || 'Error al restablecer la contraseña',
          position: 'topRight'
        });
      }
    });
  }

  togglePasswordVisibility(field: string) {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
}
