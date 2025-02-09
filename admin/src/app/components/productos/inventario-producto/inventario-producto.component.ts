import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from '../../../services/producto.service';
import { RespaldosService } from '../../../services/respaldos.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

declare var iziToast: any;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-inventario-producto',
  templateUrl: './inventario-producto.component.html',
  styleUrl: './inventario-producto.component.css'
})
export class InventarioProductoComponent implements OnInit{

  productoid: any;
  producto: any = { };
  inventarios : Array<any> = [];
  inventario : any = {}
  fileSelected: boolean = false;
  selectedFile: File | null = null; 

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService,
    private _router: Router, 
    private _respaldos:RespaldosService
  ){

  }

  ngOnInit(): void {
    this._route.params.subscribe(
      params => {
        this.productoid = params['id'];
        this.obtenerProducto(this.productoid);
        console.log(this.productoid)
        this.listarInventarioProducto(this.productoid);
        this.mostrarMensaje();
      }
    );
  }

  obtenerProducto(id: string): void {
    this._productoService.obtenerProducto(id).subscribe(
      response => {
        if (response) {
          this.producto = response;
          console.log(this.producto);
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

  listarInventarioProducto(id: string): void {
    this._productoService.listarInventarioProducto(id).subscribe(
      response => {
        this.inventarios = response;
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

  eliminar(id: any) {
    this._productoService.eliminarInventarioProducto(id).subscribe(
      response => {
        localStorage.setItem('mensaje', 'Inventario del producto eliminado correctamente.');
        localStorage.setItem('mensajeTipo', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      },
      error => {
        iziToast.error({
          title: 'Error',
          titleColor: '#FF0000',
          class: 'text-danger',
          message: 'Error al eliminar inventario del producto',
          position: 'topRight'
        });
      }
    );
  }

  mostrarMensaje(): void {
    const mensaje = localStorage.getItem('mensaje');
    const mensajeTipo = localStorage.getItem('mensajeTipo');
    if (mensaje && mensajeTipo) {
      iziToast.show({
        title: mensajeTipo === 'success' ? 'SUCCESS' : 'ERROR',
        titleColor: mensajeTipo === 'success' ? '#1DC74C' : '#FF0000',
        class: mensajeTipo === 'success' ? 'text-success' : 'text-danger',
        position: 'topRight',
        message: mensaje
      });
      localStorage.removeItem('mensaje');
      localStorage.removeItem('mensajeTipo');
    }
  }

  registro_inventario(inventarioForm: any) {
    if (inventarioForm.valid) {
        this.inventario.productoid = this.productoid;
        this._productoService.registrarInventarioProducto(this.inventario).subscribe(
            response => {
                iziToast.show({
                    title: 'SUCCESS',
                    titleColor: '#1DC74C',
                    class: 'text-success',
                    position: 'topRight',
                    message: 'Inventario registrado correctamente'
                });
                this.listarInventarioProducto(this.productoid);
                inventarioForm.resetForm();
            },
            error => {
                console.error(error);
                iziToast.show({
                    title: 'ERROR',
                    titleColor: '#FF0000',
                    class: 'text-danger',
                    position: 'topRight',
                    message: 'Error en el servidor'
                });
            }
        );
    } else {
        iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            class: 'text-danger',
            position: 'topRight',
            message: 'Datos del formulario no completados'
        });
    }
  }

  exportarInventario() {
    this._respaldos.exportarCsvInventario().subscribe(
      (response: any) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Exportación completada.',
          position: 'topRight'
        });
      },
      (error) => {
        console.error('Error al exportar inventario:', error);
        iziToast.error({
          title: 'Error',
          message: 'Error al exportar inventario.',
          position: 'topRight'
        });
      }
    );
  }

  seleccionarArchivo(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  importarInventario(): void {
    if (!this.selectedFile) {
      iziToast.show({
        title: 'ALERT',
        titleColor: '#FFFF00',
        class: 'text-danger',
        position: 'topRight',
        message: 'Por favor, selecciona un archivo csv antes de importar'
      });
      return;
    }
  
    this._respaldos.importarCsvProducto(this.selectedFile).subscribe(
      (response) => {
        this.listarInventarioProducto(this.productoid);
      },
      (error) => {
        console.error('Error al importar inventario:', error);
        alert(error.error || 'Error al importar inventario.');
      }
    );
  }

  generarPDF(): void {
    const DATA = document.getElementById('tabla-inventario');
    const opcionesColumn = document.querySelectorAll('.opcion-column');
    
    // Ocultar las columnas de opciones y portada
    opcionesColumn.forEach(col => col.classList.add('d-none'));

    if (DATA) {
      // Esperar a que todas las imágenes se carguen
      const images = DATA.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve, reject) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          }
        });
      });

      Promise.all(imagePromises).then(() => {
        html2canvas(DATA).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('inventario.pdf');

          // Mostrar las columnas de opciones y portada nuevamente
          opcionesColumn.forEach(col => col.classList.remove('d-none'));
        });
      });
    }
  }

}
