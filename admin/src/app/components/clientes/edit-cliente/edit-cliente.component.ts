import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';
import { AdminService } from '../../../services/admin.service';

declare var iziToast: any;

@Component({
  selector: 'app-edit-cliente',
  templateUrl: './edit-cliente.component.html',
  styleUrl: './edit-cliente.component.css'
})
export class EditClienteComponent implements OnInit{

  cliente: any = {  };
  usuarioid: any;

  constructor(private _route:ActivatedRoute, private _clienteService:ClienteService, private _adminService:AdminService, private _router: Router){}

  ngOnInit(): void {
    this._route.params.subscribe(
      params => {
        this.usuarioid = params['id'];
        this.obtenerCliente(this.usuarioid);
      }
    )
  }

  obtenerCliente(id: string): void {
    this._clienteService.obtener_cliente(id).subscribe(
      response => {
        if (response) {
          this.cliente = response;
          if (this.cliente.fNacimiento) {
            this.cliente.fNacimiento = new Date(this.cliente.fNacimiento).toISOString().substring(0, 10);
          }
        } else {
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            class: 'text-danger',
            position: 'topRight',
            message: 'Cliente no encontrado'
          });
          this._router.navigate(['/panel/clientes']);
        }
      },
      error => {
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          class: 'text-danger',
          position: 'topRight',
          message: 'No se encontro el registro'
        });
        this._router.navigate(['/panel/clientes']);
      }
    );
  }

  actualizar(updateForm: any): void {
    if (updateForm.valid) {
      if (this.cliente.fNacimiento) {
        this.cliente.fNacimiento = new Date(this.cliente.fNacimiento).toISOString().substring(0, 10);
      }
  
      this._clienteService.actualizar_cliente(this.usuarioid, this.cliente).subscribe(
        response => {
          iziToast.show({
            title: 'Success',
            titleColor: '#1DC74C',
            class: 'text-success',
            position: 'topRight',
            message: 'Cliente actualizado con éxito'
          });
          this._router.navigate(['/panel/clientes']);
        },
        error => {
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            class: 'text-danger',
            position: 'topRight',
            message: 'Error al actualizar el cliente'
          });
        }
      );
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        class: 'text-danger',
        position: 'topRight',
        message: 'Datos del formulario no válidos'
      });
    }
  }

}
