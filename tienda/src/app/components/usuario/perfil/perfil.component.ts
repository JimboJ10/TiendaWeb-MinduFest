import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { Router } from '@angular/router';

declare var iziToast :any;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit{

  cliente: any = {};
  clienteInicial: any = {};
  usuarioid: any;
  paises: any[] = [];

  constructor(private clienteService: ClienteService, private router: Router) { }

  ngOnInit(): void {
    this.usuarioid = localStorage.getItem('usuarioid');
    this.obtenerCliente(this.usuarioid);
    this.cargarPaises();
  }

  cargarPaises() {
    this.clienteService.obtenerPaises().subscribe(
      (data: any[]) => {
        this.paises = data.map(pais => pais.translations.spa.common).sort();
      },
      error => {
        console.error('Error al cargar países:', error);
      }
    );
  }

  obtenerCliente(id: string) {
    this.clienteService.obtenerClienteConRol(id).subscribe(
      (data: any) => {
        this.cliente = data;
        this.clienteInicial = { ...data };
      },
      (error: any) => {
        console.log(error);
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'Error al obtener los datos del cliente',
        });
      }
    );
  }

  hayCambios(): boolean {
    return JSON.stringify(this.cliente) !== JSON.stringify(this.clienteInicial);
  }

  actualizar(actualizarForm: any) {
    if (actualizarForm.valid) {
      if (!this.hayCambios()) {
        iziToast.show({
          title: 'Advertencia',
          titleColor: '#FF8C00',
          color: '#FFF',
          class: 'text-warning',
          position: 'topRight',
          message: 'No has realizado ningún cambio en tu perfil',
        });
        return;
      }

      this.clienteService.actualizarCliente(this.usuarioid, this.cliente).subscribe(
        (data: any) => {
          iziToast.show({
            title: 'Éxito',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Perfil actualizado correctamente',
          });
          this.router.navigate(['/inicio']);
        },
        (error: any) => {
          console.log(error);
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Error al actualizar el perfil',
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
