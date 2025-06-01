import { Component, OnInit, ElementRef } from '@angular/core';
import { ProveedorService } from '../../../services/proveedor.service';
declare var iziToast: any;

@Component({
  selector: 'app-index-proveedor',
  templateUrl: './index-proveedor.component.html',
  styleUrls: ['./index-proveedor.component.css']
})
export class IndexProveedorComponent implements OnInit {

  public token;
  public proveedores: Array<any> = [];
  public proveedoresFiltrados: Array<any> = [];
  public filtro = '';
  public estadoFiltro = '';
  public page = 1;
  public pageSize = 10;
  public load_data = true;

  constructor(
    private _proveedorService: ProveedorService,
    private elementRef: ElementRef
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this.init_Data();
  }

  init_Data() {
    this._proveedorService.listar_proveedores('', '', this.token).subscribe(
      response => {
        this.proveedores = response;
        this.proveedoresFiltrados = response;
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
      this.proveedoresFiltrados = this.proveedores.filter(proveedor => {
        return proveedor.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
               proveedor.email.toLowerCase().includes(this.filtro.toLowerCase()) ||
               proveedor.contacto.toLowerCase().includes(this.filtro.toLowerCase());
      });
    } else {
      this.proveedoresFiltrados = this.proveedores;
    }

    if (this.estadoFiltro) {
      this.proveedoresFiltrados = this.proveedoresFiltrados.filter(proveedor => {
        return proveedor.estado === this.estadoFiltro;
      });
    }
  }

  resetear() {
    this.filtro = '';
    this.estadoFiltro = '';
    this.proveedoresFiltrados = this.proveedores;
  }

  eliminar(id: any) {
    this.load_data = true;
    this._proveedorService.eliminar_proveedor(id, this.token).subscribe(
      response => {
        iziToast.success({
          title: 'Éxito',
          message: response.message,
          position: 'topRight'
        });
        
        const modal = this.elementRef.nativeElement.querySelector('#delete-' + id);
        if (modal) {
          modal.style.display = 'none';
          modal.classList.remove('show');
          
          // Remover backdrop
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) {
            backdrop.remove();
          }
          
          // Remover clase del body
          document.body.classList.remove('modal-open');
          document.body.style.paddingRight = '';
        }
        
        this.init_Data();
      },
      error => {
        console.log(error);
        this.load_data = false;
        iziToast.error({
          title: 'Error',
          message: 'Error al eliminar el proveedor',
          position: 'topRight'
        });
      }
    );
  }
}