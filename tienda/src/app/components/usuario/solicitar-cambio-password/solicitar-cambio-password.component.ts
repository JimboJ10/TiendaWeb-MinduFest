import { Component } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { Router } from '@angular/router';

declare var iziToast: any;

@Component({
  selector: 'app-solicitar-cambio-password',
  templateUrl: './solicitar-cambio-password.component.html',
  styleUrls: ['./solicitar-cambio-password.component.css']
})
export class SolicitarCambioPasswordComponent {
  email: string = '';

  constructor(private clienteService: ClienteService, private router:Router) {}

  onSubmit() {
    if (this.email) {
      this.clienteService.forgotPassword(this.email).subscribe({
        next: (response) => {
          iziToast.success({
            title: 'Éxito',
            message: 'Se ha enviado un correo con las instrucciones para restablecer tu contraseña',
            position: 'topRight'
          });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          iziToast.error({
            title: 'Error',
            message: error.error.message || 'Ocurrió un error al procesar la solicitud',
            position: 'topRight'
          });
        }
      });
    }
  }
}
