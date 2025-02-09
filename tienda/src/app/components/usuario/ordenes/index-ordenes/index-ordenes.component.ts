import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../../services/cliente.service';
import { GLOBAL } from '../../../../services/GLOBAL';

declare var iziToast :any;

@Component({
  selector: 'app-index-ordenes',
  templateUrl: './index-ordenes.component.html',
  styleUrls: ['./index-ordenes.component.css']
})
export class IndexOrdenesComponent implements OnInit {
  usuarioid: any;
  ordenes: Array<any> = []; 
  url: string;
  load_data = true;
  noOrdenes = false;
  orden: any = {
    usuarioid: '',
  };
  page = 1;
  pageSize = 4;

  constructor(private _clienteService: ClienteService) {
    this.url = GLOBAL.url;
  }

  ngOnInit(): void {
    const usuarioid = localStorage.getItem('usuarioid');
    if (usuarioid) {
      this.orden.usuarioid = usuarioid; 
      this.init_data(usuarioid);
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'No se ha podido identificar al usuario.',
      });
    }
  }

  init_data(usuarioid: string) {
    this._clienteService.obtenerOrdenesCliente(usuarioid).subscribe(
      response => {
        this.ordenes = response;
        this.load_data = false;
        this.noOrdenes = this.ordenes.length === 0;
      },
      error => {
        console.log(error);
        this.load_data = false;
        this.noOrdenes = true;
      }
    );
  }
}
