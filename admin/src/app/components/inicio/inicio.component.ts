import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  private chart: Chart | undefined;
  total_ganancia = 0;
  total_mes = 0;
  total_mes_anterior = 0;
  count_ventas = 0;
  monthlyData: any[] = [];
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  constructor(private adminService: AdminService) {
    const currentYear = new Date().getFullYear();
    for (let year = 2024; year <= currentYear; year++) {
      this.availableYears.push(year);
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.adminService.getKpiGananciasMensuales(this.selectedYear).subscribe((data: any) => {
      this.total_ganancia = data.total_ganancia;
      this.total_mes = data.total_mes;
      this.total_mes_anterior = data.total_mes_anterior;
      this.count_ventas = data.count_ventas;
      this.monthlyData = data.monthlyData;
      this.renderChart();
    });
  }

  onYearChange(year: number) {
    this.selectedYear = year;
    this.loadData();
  }

  renderChart() {
    const labels = this.monthlyData.map(item => {
      const date = new Date(item.mes);
      return date.toLocaleString('default', { month: 'long' });
    });

    const data = this.monthlyData.map(item => item.total_mes);

    var canvas = <HTMLCanvasElement> document.getElementById('myChart');
    var ctx: any = canvas.getContext('2d');

    // Destruir el gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `Ventas Mensuales ${this.selectedYear}`,
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
