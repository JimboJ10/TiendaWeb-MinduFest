import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { RespaldosService } from '../../../services/respaldos.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

declare var iziToast: any;
declare var $: any;

@Component({
  selector: 'app-index-ventas',
  templateUrl: './index-ventas.component.html',
  styleUrls: ['./index-ventas.component.css'] // Corrige el nombre de la propiedad
})
export class IndexVentasComponent implements OnInit {

  desde: any | null = null;
  hasta: any | null = null;
  ventas: Array<any> = [];
  page = 1;
  pageSize = 5;
  fileSelected: boolean = false;
  selectedFile: File | null = null; 
  estados: any[] = [];
  nota_estado: string = '';
  ventaSeleccionada: any = null;
  estadoSeleccionado: any = null;
  mostrarModal: boolean = false;

  constructor(private _adminService: AdminService, private _respaldos:RespaldosService) { }

  ngOnInit(): void {
    this.obtenerEstados();
  }

  abrirModalNota(venta: any, estado: any) {
    console.log('Abriendo modal'); // Debug
    this.ventaSeleccionada = venta;
    this.estadoSeleccionado = estado;
    this.nota_estado = '';
    this.mostrarModal = true;
}

cerrarModal() {
  console.log('Cerrando modal'); // Debug
  this.mostrarModal = false;
  this.nota_estado = '';
  this.ventaSeleccionada = null;
  this.estadoSeleccionado = null;
}

  confirmarCambioEstado() {
    if (this.ventaSeleccionada && this.estadoSeleccionado) {
        this.actualizarEstado(
            this.ventaSeleccionada,
            this.estadoSeleccionado.estadoid,
            this.nota_estado
        );
        this.cerrarModal();
    }
  }

  obtenerEstados() {
    this._adminService.obtenerEstadosVenta().subscribe(
      response => {
        this.estados = response;
      },
      error => {
        console.error('Error al obtener estados:', error);
      }
    );
  }

  actualizarEstado(venta: any, estadoid: number, nota: string) {
    this._adminService.actualizarEstadoVenta(venta.ventaid, { estadoid, nota_estado: nota }).subscribe(
        response => {
            iziToast.success({
                title: 'OK',
                message: 'Estado actualizado correctamente',
                position: 'topRight'
            });
            this.filtrar();
        },
        error => {
            console.error('Error al actualizar estado:', error);
            iziToast.error({
                title: 'ERROR',
                message: 'Error al actualizar el estado',
                position: 'topRight'
            });
        }
    );
  }  

  filtrar() {
    this._adminService.obtenerVentas(this.desde, this.hasta).subscribe(
      (response: any) => {
        this.ventas = response;
        console.log(this.ventas)
      },
      (error: any) => {
        console.error('Error al obtener ventas:', error);
      }
    );
  }

  exportarVenta() {
    this._respaldos.exportarCsvVenta().subscribe(
      (response: any) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Exportación completada.',
          position: 'topRight'
        });
      },
      (error) => {
        console.error('Error al exportar ventas:', error);
        iziToast.error({
          title: 'Error',
          message: 'Error al exportar ventas.',
          position: 'topRight'
        });
      }
    );
  }

  seleccionarArchivo(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  importarVenta(): void {
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
  
    this._respaldos.importarCsvVenta(this.selectedFile).subscribe(
      (response) => {
        this.filtrar();
      },
      (error) => {
        console.error('Error al importar venta:', error);
        alert(error.error || 'Error al importar venta.');
      }
    );
  }
  
  generarPDF(): void {
    // Crear una tabla HTML temporal
    const tempTable = document.createElement('table');
    tempTable.innerHTML = `
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
      <thead>
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Envío</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${this.ventas.map((venta, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${venta.nombres} ${venta.apellidos}</td>
            <td>${new Date(venta.fecha).toLocaleDateString()}</td>
            <td>${venta.estado}</td>
            <td>${venta.enviotitulo}</td>
            <td>$${venta.subtotal}</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    // Añadir la tabla temporal al documento
    document.body.appendChild(tempTable);

    // Generar el PDF a partir de la tabla temporal
    html2canvas(tempTable).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('ventas.pdf');

      // Eliminar la tabla temporal del documento
      document.body.removeChild(tempTable);
    });
  }

}
