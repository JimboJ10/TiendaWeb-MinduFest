import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProveedorService } from '../../../services/proveedor.service';

declare var iziToast: any;

@Component({
  selector: 'app-edit-proveedor',
  templateUrl: './edit-proveedor.component.html',
  styleUrls: ['./edit-proveedor.component.css']
})
export class EditProveedorComponent implements OnInit {

  public proveedor: any = {};
  public id: any;
  public token;
  public load_btn = false;
  public load_data = true;

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

  actualizar(actualizarForm: any) {
    if (actualizarForm.valid) {
      this.load_btn = true;
      
      this._proveedorService.actualizar_proveedor(this.id, this.proveedor, this.token).subscribe(
        response => {
          iziToast.success({
            title: 'Éxito',
            message: response.message,
            position: 'topRight'
          });
          this._router.navigate(['/panel/proveedores']);
          this.load_btn = false;
        },
        error => {
          console.log(error);
          let message = 'Error en el servidor';
          if (error.error && error.error.error) {
            message = error.error.error;
          }
          
          iziToast.error({
            title: 'Error',
            message: message,
            position: 'topRight'
          });
          this.load_btn = false;
        }
      );
    } else {
      iziToast.warning({
        title: 'Advertencia',
        message: 'Complete todos los campos requeridos',
        position: 'topRight'
      });
    }
  }
}