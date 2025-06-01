import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProveedorService } from '../../../services/proveedor.service';

@Component({
  selector: 'app-productos-proveedor',
  templateUrl: './productos-proveedor.component.html',
  styleUrls: ['./productos-proveedor.component.css']
})
export class ProductosProveedorComponent implements OnInit {

  public proveedor: any = {};
  public productos: Array<any> = [];
  public productosFiltrados: Array<any> = [];
  public id: any;
  public token;
  public load_data = true;
  public filtro = '';
  public page = 1;
  public pageSize = 10;

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
    });
  }

  obtenerProveedor() {
    this._proveedorService.obtener_proveedor(this.id, this.token).subscribe(
      response => {
        this.proveedor = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  obtenerProductos() {
    this._proveedorService.obtener_productos_proveedor(this.id, this.token).subscribe(
      response => {
        this.productos = response;
        this.productosFiltrados = response;
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
      }
    );
  }

  filtrar() {
    if (this.filtro) {
      this.productosFiltrados = this.productos.filter(producto => {
        return producto.titulo.toLowerCase().includes(this.filtro.toLowerCase());
      });
    } else {
      this.productosFiltrados = this.productos;
    }
  }

  resetear() {
    this.filtro = '';
    this.productosFiltrados = this.productos;
  }
}