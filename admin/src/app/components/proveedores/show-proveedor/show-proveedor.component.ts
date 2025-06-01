import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProveedorService } from '../../../services/proveedor.service';

declare var iziToast: any;

@Component({
  selector: 'app-show-proveedor',
  templateUrl: './show-proveedor.component.html',
  styleUrls: ['./show-proveedor.component.css']
})
export class ShowProveedorComponent implements OnInit {

  public proveedor: any = {};
  public productos: Array<any> = [];
  public estadisticas: any = {};
  public id: any;
  public token;
  public load_data = true;
  public load_productos = true;
  public load_estadisticas = true;

  constructor(
    private _proveedorService: ProveedorService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.obtenerProveedor();
      this.obtenerProductos();
      this.obtenerEstadisticas();
    });
  }

  obtenerProveedor() {
    this._proveedorService.obtener_proveedor(this.id, this.token).subscribe(
      response => {
        if (response) {
          this.proveedor = response;
          this.load_data = false;
        } else {
          this._router.navigate(['/panel/proveedores']);
        }
      },
      error => {
        console.log(error);
        iziToast.error({
          title: 'Error',
          message: 'No se pudo obtener la información del proveedor',
          position: 'topRight'
        });
        this._router.navigate(['/panel/proveedores']);
      }
    );
  }

  obtenerProductos() {
    this._proveedorService.obtener_productos_proveedor(this.id, this.token).subscribe(
      response => {
        this.productos = response;
        this.load_productos = false;
      },
      error => {
        console.log(error);
        this.load_productos = false;
      }
    );
  }

  obtenerEstadisticas() {
    this._proveedorService.obtener_estadisticas_proveedor(this.id, this.token).subscribe(
      response => {
        this.estadisticas = response;
        this.load_estadisticas = false;
      },
      error => {
        console.log(error);
        this.load_estadisticas = false;
      }
    );
  }

  eliminar() {
    this._proveedorService.eliminar_proveedor(this.id, this.token).subscribe(
      response => {
        iziToast.success({
          title: 'Éxito',
          message: response.message,
          position: 'topRight'
        });
        this._router.navigate(['/panel/proveedores']);
      },
      error => {
        console.log(error);
        iziToast.error({
          title: 'Error',
          message: 'Error al eliminar el proveedor',
          position: 'topRight'
        });
      }
    );
  }
}