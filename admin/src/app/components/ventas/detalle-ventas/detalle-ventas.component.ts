import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '../../../services/GLOBAL';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { RespaldosService } from '../../../services/respaldos.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

declare var iziToast: any;

@Component({
  selector: 'app-detalle-ventas',
  templateUrl: './detalle-ventas.component.html',
  styleUrl: './detalle-ventas.component.css'
})
export class DetalleVentasComponent implements OnInit{
  
  ventaid: any;
  detalles: Array<any> = []; 
  url: string;
  load_data = true;
  orden: any = {};
  fileSelected: boolean = false;
  selectedFile: File | null = null; 

  constructor(
    private _adminService: AdminService, 
    private _route: ActivatedRoute,
    private _respaldos:RespaldosService
  ) {
    this.url = GLOBAL.url;
    this._route.params.subscribe(
      params => {
        this.ventaid = params['ventaid'];
      }
    );
  }

  ngOnInit(): void {
    this.obtenerDetallesOrden();
  }

  obtenerDetallesOrden(): void {
    this._adminService.obtenerDetallesVenta(this.ventaid).subscribe(
      response => {
        if (response) {
          this.orden = response[0];
          this.detalles = response;
          this.load_data = false;
        }
      },
      error => {
        console.error('Error al obtener los detalles de la venta', error);
        this.load_data = false;
      }
    );
  }

  exportarDetalleVenta() {
    this._respaldos.exportarCsvDetalleVenta().subscribe(
      (response: any) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Exportación completada.',
          position: 'topRight'
        });
      },
      (error) => {
        console.error('Error al exportar detalles de las ventas:', error);
        iziToast.error({
          title: 'Error',
          message: 'Error al exportar detalles de las ventas.',
          position: 'topRight'
        });
      }
    );
  }

  seleccionarArchivo(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  importarDetalleVenta(): void {
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
  
    this._respaldos.importarCsvDetalleVenta(this.selectedFile).subscribe(
      (response) => {
        this.obtenerDetallesOrden();
      },
      (error) => {
        console.error('Error al importar detalleventa:', error);
        alert(error.error || 'Error al importar detalleventa.');
      }
    );
  }

  generarPDF(): void {
    // Asegurarse de que this.orden.subtotal sea un número
    const subtotal = typeof this.orden.subtotal === 'number' ? this.orden.subtotal : parseFloat(this.orden.subtotal);

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
        .text-right {
          text-align: right;
        }
      </style>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Precio</th>
          <th>Cantidad</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${this.detalles.map(item => `
          <tr>
            <td>${item.titulo}</td>
            <td>${item.precio}</td>
            <td>${item.cantidad}</td>
            <td>${item.subtotal_detalle}</td>
          </tr>
        `).join('')}
        <tr>
          <td colspan="2">
            <div class="py-2">
              <span class="font-size-xs text-muted">Precio Envio: </span>
              <span class="font-size-sm text-dark">${this.orden.envioprecio}</span>
            </div>
          </td>
          <td colspan="2" class="text-right">
            <div class="py-2 pr-3">
              <span class="font-size-xs text-muted">Total: </span>
              <span class="font-size-sm font-weight-bold text-dark">${subtotal.toFixed(2)}</span>
            </div>
          </td>
        </tr>
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
      pdf.save('detalle-venta.pdf');

      // Eliminar la tabla temporal del documento
      document.body.removeChild(tempTable);
    });
  }

}
