import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000';
  private token: string | null = null;

  constructor(private http: HttpClient) {}

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Obtener token almacenado
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }
  
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  getKpiGananciasMensuales(year?: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('year', year || new Date().getFullYear());
    return this.http.get(`${this.apiUrl}/kpi-ganancias-mensuales`, { headers, params });
  }

  obtenerVentas(desde: any | null, hasta: any | null): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
        .set('desde', desde || '')
        .set('hasta', hasta || '');
    return this.http.get(`${this.apiUrl}/obtener_ventas/${desde}/${hasta}`, { headers });
  }

  obtenerDetallesVenta(ventaid: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_detalles_cliente/${ventaid}`, { headers });
  }

  obtenerEstadosVenta(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/estados-venta`, { headers });
  }

  actualizarEstadoVenta(ventaid: string, datos: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/venta-estado/${ventaid}`, datos, { headers });
  }

}

