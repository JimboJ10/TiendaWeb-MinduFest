import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';

declare var iziToast: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public user: any = {};

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {}

  login(loginForm: { valid: any; }) {
    if (loginForm.valid) {
      this.adminService.login(this.user).subscribe(
        response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('usuarioid', response.usuarioid);
          localStorage.setItem('rol', response.rol);
          this.router.navigate(['/admin']);
        },
        error => {
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Credenciales incorrectas',
          });
        }
      );
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Los datos del formulario no son válidos',
      });
    }
  }
}
