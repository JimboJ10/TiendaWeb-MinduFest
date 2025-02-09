import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ClienteService } from '../services/cliente.service';

@Injectable({
  providedIn: 'root'
})

export class LoginGuard implements CanActivate {

  constructor(private clienteService: ClienteService, private router: Router) { }

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.rol === 'Cliente') {
        this.router.navigate(['/inicio']);
        return false;
      }
    }
    return true;
  }
}
