import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GLOBAL } from '../../../services/GLOBAL';
import { ProductoService } from '../../../services/producto.service';

declare var iziToast: any;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-update-producto',
  templateUrl: './update-producto.component.html',
  styleUrl: './update-producto.component.css'
})
export class UpdateProductoComponent implements OnInit{

  producto: any = {
    categoria: ""
  };
  config: any = {};
  categorias: any[] = [];
  imgSelect: any | ArrayBuffer;
  productoid: any;
  url: string;
  file: File | undefined;

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService,
    private _router: Router
  ) {
    this.config = {
      height: 500
    };
    this.url = GLOBAL.url;
  }

  ngOnInit(): void {
    this._route.params.subscribe(
      params => {
        this.productoid = params['id'];
        this.obtenerProducto(this.productoid);
      }
    );
    this.obtenerCategorias();
  }

  obtenerProducto(id: string): void {
    this._productoService.obtenerProducto(id).subscribe(
      response => {
        if (response) {
          this.producto = response;
          this.producto.categoria = response.categoriaid
          this.imgSelect = `${this.url}${this.producto.portada}`;
        } else {
          this._router.navigate(['/panel/productos']);
        }
      },
      error => {
        console.error(error);
        iziToast.show({
          title: 'ERROR',
          titleColor: '#FF0000',
          message: 'Error en el servidor',
          messageColor: '#FFF',
          position: 'topRight'
        });
      }
    );
  }

  actualizar(actualizarForm: any): void {
    if (actualizarForm.valid) {
      this._productoService.actualizarProducto(this.productoid, this.producto, this.file).subscribe(
        response => {
          iziToast.show({
            title: 'SUCCESS',
            titleColor: '#1DC74C',
            message: 'Producto actualizado correctamente',
            position: 'topRight'
          });
          this._router.navigate(['/panel/productos']);
        },
        error => {
          console.error(error);
          iziToast.show({
            title: 'ERROR',
            titleColor: '#FF0000',
            message: 'Error en el servidor',
            messageColor: '#FFF',
            position: 'topRight'
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
        message: 'Datos del formulario no completados',
      });
    }
  }

  obtenerCategorias(): void {
    this._productoService.obtenerCategorias().subscribe(
      response => {
        this.categorias = response;
      },
      error => {
        console.error(error);
      }
    );
  }

  fileChangeEvent(event: any): void {
    var file;
    if (event.target.files && event.target.files[0]) {
      file = <File>event.target.files[0];
      console.log(file)
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'No hay imagen de envio',
      });
    }

    if (file!.size <= 4000000) {
      if (file?.type == 'image/png' || file?.type == 'image/webp' || file?.type == 'image/jpg' || file?.type == 'image/gif' || file?.type == 'image/jpeg') {
        const reader = new FileReader();
        reader.onload = e => this.imgSelect = reader.result;
        reader.readAsDataURL(file!);
        $('#input-portada').text(file!.name);
        this.file = file!;
      } else {
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'El archivo debe ser una imagen',
        });
        $('#input-portada').text('Seleccionar imagen');
        this.imgSelect = 'assets/img/01.jpg';
        this.file = undefined;
      }
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'La imagen no puede superar los 4MB',
      });
      $('#input-portada').text('Seleccionar imagen');
      this.imgSelect = 'assets/img/01.jpg';
      this.file = undefined;
    }
  }

}
