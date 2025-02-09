import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { RespaldosService } from '../../../services/respaldos.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

declare var iziToast: any;

@Component({
  selector: 'app-index-cliente',
  templateUrl: './index-cliente.component.html',
  styleUrls: ['./index-cliente.component.css']
})
export class IndexClienteComponent implements OnInit {
  clientes: any[] = [];
  filtro_apellidos = "";
  filtro_correo = "";
  page = 1;
  pageSize = 7;
  fileSelected: boolean = false;
  selectedFile: File | null = null; 

  constructor(private _clienteService: ClienteService, private _respaldos:RespaldosService) {}

  ngOnInit(): void {
    this.listarClientes(null, null);
  }

  listarClientes(tipo: string | null, filtro: string | null) {
    this._clienteService.listar_clientes(tipo, filtro).subscribe(
      (data: any) => {
        this.clientes = data;
      },
      (error) => {
        console.error('Error al listar clientes', error);
      }
    );
  }

  filtro(tipo: string) {
    if (tipo === 'apellidos') {
      this.listarClientes('apellidos', this.filtro_apellidos);
    } else if (tipo === 'correo') {
      this.listarClientes('correo', this.filtro_correo);
    }
  }

  eliminar(usuarioid: any) {
    this._clienteService.eliminar_cliente(usuarioid).subscribe(
      response => {
        iziToast.success({
          title: 'Success',
          message: 'Cliente eliminado correctamente',
          position: 'topRight'
        });
        this.listarClientes(null, null);
      },
      error => {
        iziToast.error({
          title: 'Error',
          message: 'Error al eliminar cliente',
          position: 'topRight'
        });
      }
    );
  }

  exportarCliente() {
    this._respaldos.exportarCsvClientes().subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Exportación completada.',
          position: 'topRight'
        });
      },
      (error) => {
        console.error('Error al exportar clientes:', error);
        iziToast.error({
          title: 'Error',
          message: 'Error al exportar clientes.',
          position: 'topRight'
        });
      }
    );
  }

  seleccionarArchivo(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  importarCliente(): void {
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

    this._respaldos.importarCsvClientes(this.selectedFile).subscribe(
      (response) => {
        this.listarClientes(null, null);
      },
      (error) => {
        console.error('Error al importar clientes:', error);
        alert(error.error || 'Error al importar clientes.');
      }
    );
  }

  generarPDF(): void {
    const DATA = document.getElementById('tabla-clientes');
    const opcionesColumn = document.querySelectorAll('.opciones-column');
    
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
          pdf.save('clientes.pdf');

          // Mostrar las columnas de opciones y portada nuevamente
          opcionesColumn.forEach(col => col.classList.remove('d-none'));
        });
      });
    }
  }
}
