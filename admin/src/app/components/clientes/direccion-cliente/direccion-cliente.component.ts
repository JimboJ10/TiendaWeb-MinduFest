import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { RespaldosService } from '../../../services/respaldos.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

declare var iziToast: any;

@Component({
  selector: 'app-direccion-cliente',
  templateUrl: './direccion-cliente.component.html',
  styleUrl: './direccion-cliente.component.css'
})
export class DireccionClienteComponent implements OnInit {

  constructor(private clienteService: ClienteService, private _respaldos:RespaldosService) {}

  direcciones: any[] = [];
  filtro_apellidos = "";
  page = 1;
  pageSize = 7;
  fileSelected: boolean = false;
  selectedFile: File | null = null; 

  ngOnInit(): void {
    this.listarDirecciones();
  }

  onFilterChange(): void {
    this.listarDirecciones();
  }

  listarDirecciones(): void {
    this.clienteService.listarDirecciones(this.filtro_apellidos).subscribe(
      data => {
        this.direcciones = data;
      },
      error => {
        console.error('Error al listar direcciones', error);
      }
    );
  }

  exportarDireccion() {
    this._respaldos.exportarCsvDireccion().subscribe(
      (response: any) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Exportación completada.',
          position: 'topRight'
        });
      },
      (error) => {
        console.error('Error al exportar direccion:', error);
        iziToast.error({
          title: 'Error',
          message: 'Error al exportar direccion.',
          position: 'topRight'
        });
      }
    );
  }

  seleccionarArchivo(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  importarDireccion(): void {
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
  
    this._respaldos.importarCsvDireccion(this.selectedFile).subscribe(
      (response) => {
        this.listarDirecciones();
      },
      (error) => {
        console.error('Error al importar direccion:', error);
        alert(error.error || 'Error al importar direccion.');
      }
    );
  }

  generarPDF(): void {
    const DATA = document.getElementById('tabla-direcciones');

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
          pdf.save('direcciones.pdf');
        });
      });
    }
  }
}
