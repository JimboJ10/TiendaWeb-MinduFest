import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';

declare var iziToast: any;

@Component({
  selector: 'app-doble-factor',
  templateUrl: './doble-factor.component.html',
  styleUrls: ['./doble-factor.component.css']
})
export class DobleFactorComponent implements OnInit{
  qrCode: string = '';
  secret: string = '';
  twoFactorEnabled: boolean = false;
  verificationCode: string = '';
  showQR: boolean = false;
  
  constructor(private clienteService: ClienteService) {}
  
  ngOnInit() {
    this.verificarEstado2FA();
  }
  
  verificarEstado2FA() {
    const email = localStorage.getItem('email');
    if (email) {
      this.clienteService.obtenerEstado2FA(email).subscribe(
        response => {
          this.twoFactorEnabled = response.enabled;
        }
      );
    }
  }

  configurar2FA() {
    const email = localStorage.getItem('email');
    if (email) {
      this.clienteService.configurar2FA(email).subscribe(
        response => {
          this.qrCode = response.qrCode;
          this.secret = response.secret;
          this.showQR = true;
        },
        error => {
          iziToast.error({
            title: 'Error',
            message: 'Error al configurar 2FA'
          });
        }
      );
    }
  }

  verificarYActivar2FA() {
    if (this.verificationCode && this.verificationCode.length === 6) {
      // Verifica el código con el backend
      this.clienteService.verificar2FA(this.verificationCode, this.secret).subscribe(
        response => {
          if (response.success) {
            const email = localStorage.getItem('email');
            if (email) {
              // Activa 2FA en la cuenta del usuario
              this.clienteService.cambiarEstado2FA(email, true).subscribe(
                () => {
                  this.twoFactorEnabled = true;
                  this.showQR = false;
                  this.verificationCode = ''; // Limpia el código después de verificar
                  iziToast.success({
                    title: 'Éxito',
                    message: '2FA activado correctamente',
                    position: 'topRight'
                  });
                }
              );
            }
          }
        },
        error => {
          iziToast.error({
            title: 'Error',
            message: 'Código de verificación incorrecto'
          });
          this.verificationCode = ''; // Limpia el código en caso de error
        }
      );
    }
  }

  desactivar2FA() {
    const email = localStorage.getItem('email');
    if (email) {
      this.clienteService.cambiarEstado2FA(email, false).subscribe(
        () => {
          this.twoFactorEnabled = false;
          iziToast.success({
            title: 'Éxito',
            message: '2FA desactivado correctamente'
          });
        }
      );
    }
  }

}
