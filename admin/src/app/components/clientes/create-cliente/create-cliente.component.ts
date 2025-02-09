import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { Router } from '@angular/router';

declare var iziToast: any;

@Component({
  selector: 'app-create-cliente',
  templateUrl: './create-cliente.component.html',
  styleUrl: './create-cliente.component.css'
})
export class CreateClienteComponent implements OnInit{

  cliente: any = {
    genero: "",
  };

  constructor(private clienteService: ClienteService, private router: Router) { }

  ngOnInit(): void {
  }

  registro(registroForm: any) {
    if (registroForm.valid) {
      this.clienteService.registrar_cliente(this.cliente).subscribe(
        response => {
          iziToast.show({
            title: 'Success',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Cliente registrado con éxito',
          });

          this.cliente = {
            dni: '',
            nombres: '',
            apellidos: '',
            email: '',
            pais: '',
            telefono: '',
            fNacimiento: '',
            genero: ''
          };

          this.router.navigate(['/panel/clientes']);
        },
        error => {
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Error al registrar cliente',
          });
          console.log(error);
        }
      );
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Datos del formulario no completados',
      });
    }
  }

}
