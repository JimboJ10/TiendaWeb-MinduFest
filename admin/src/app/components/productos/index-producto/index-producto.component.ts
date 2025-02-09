import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../../services/producto.service';
import { GLOBAL } from '../../../services/GLOBAL';
import { RespaldosService } from '../../../services/respaldos.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

declare var iziToast: any;

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css']
})
export class IndexProductoComponent implements OnInit {

  filtro = '';
  page = 1;
  pageSize = 5;
  productos: Array<any> = [];
  productosFiltrados: Array<any> = [];
  url: string;
  fileSelected: boolean = false;
  selectedFile: File | null = null; 


  constructor(private _productoService: ProductoService, private _respaldos:RespaldosService) {
    this.url = GLOBAL.url;
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.mostrarMensaje();
  }

  cargarProductos(): void {
    this._productoService.listarProductos().subscribe(
      response => {
        this.productos = response;
        this.productosFiltrados = this.productos;
      },
      error => {
        console.error(error);
        iziToast.show({
          title: 'ERROR',
          titleColor: '#FF0000',
          class: 'text-danger',
          position: 'topRight',
          message: 'Error al cargar los productos.'
        });
      }
    );
  }

  filtrar() {
    if (this.filtro) {
      this.productosFiltrados = this.productos.filter(item => item.titulo.toLowerCase().includes(this.filtro.toLowerCase()));
    } else {
      this.productosFiltrados = this.productos;
    }
  }

  resetear() {
    this.filtro = '';
    this.productosFiltrados = this.productos;
  }

  onImageError(event: any) {
    console.error('Image not found:', event.target.src);
  }

  eliminar(id: any) {
    this._productoService.eliminarProducto(id).subscribe(
      response => {
        localStorage.setItem('mensaje', 'Producto eliminado correctamente.');
        localStorage.setItem('mensajeTipo', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      },
      error => {
        console.error(error);
        iziToast.show({
          title: 'ERROR',
          titleColor: '#FF0000',
          class: 'text-danger',
          position: 'topRight',
          message: 'Error al eliminar el producto.'
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

  exportarProducto() {
    this._respaldos.exportarCsvProducto().subscribe(
      (response: any) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Exportación completada.',
          position: 'topRight'
        });
      },
      (error) => {
        console.error('Error al exportar productos:', error);
        iziToast.error({
          title: 'Error',
          message: 'Error al exportar productos.',
          position: 'topRight'
        });
      }
    );
  }

  seleccionarArchivo(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  importarProducto(): void {
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
        this.cargarProductos();
      },
      (error) => {
        console.error('Error al importar producto:', error);
        alert(error.error || 'Error al importar producto.');
      }
    );
  }

  generarPDF(): void {
    const DATA = document.getElementById('tabla-productos');
    const opcionesColumn = document.querySelectorAll('.opciones-column');
    const portadaColumn = document.querySelectorAll('.portada-column');
    
    // Ocultar las columnas de opciones y portada
    opcionesColumn.forEach(col => col.classList.add('d-none'));
    portadaColumn.forEach(col => col.classList.add('d-none'));

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
          pdf.save('productos.pdf');

          // Mostrar las columnas de opciones y portada nuevamente
          opcionesColumn.forEach(col => col.classList.remove('d-none'));
          portadaColumn.forEach(col => col.classList.remove('d-none'));
        });
      });
    }
  }
}
