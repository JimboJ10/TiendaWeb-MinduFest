import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RespaldosService {

  private apiUrl = 'http://localhost:3000';
  private token: string | null = null;

  constructor(private http: HttpClient) {}

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

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
  
  exportarCsvProducto(): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/exportarCSV?tableName=producto`, {
     headers,
      responseType: 'blob',
    });
  }

  exportarCsvInventario(): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/exportarCSV?tableName=inventario`, {
      headers,
      responseType: 'blob',
    });
  }

  exportarCsvVenta(): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/exportarCSV?tableName=venta`, {
      headers,
      responseType: 'blob',
    });
  }

  exportarCsvDetalleVenta(): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/exportarCSV?tableName=detalleventa`, {
      headers,
      responseType: 'blob',
    });
  }

  exportarCsvDireccion(): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/exportarCSV?tableName=direccion`, {
      headers,
      responseType: 'blob',
    });
  }

  importarCsvProducto(file: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file); 
    return this.http.post(`${this.apiUrl}/importarCSV?tableName=producto`, formData, {
      headers,
      responseType: 'text',});
  }

  importarCsvDireccion(file: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file); 
    return this.http.post(`${this.apiUrl}/importarCSV?tableName=direccion`, formData, {
      headers,
      responseType: 'text',});
  }

  importarCsvInventario(file: File): Observable<any> {
    const formData = new FormData();
    const headers = this.getAuthHeaders();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/importarCSV?tableName=inventario`, formData, {
      headers,
      responseType: 'text',});
  }

  importarCsvVenta(file: File): Observable<any> {
    const formData = new FormData();
    const headers = this.getAuthHeaders();
    formData.append('file', file); 
    return this.http.post(`${this.apiUrl}/importarCSV?tableName=venta`, formData, {
      headers,
      responseType: 'text',});
  }

  importarCsvDetalleVenta(file: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file); 
    return this.http.post(`${this.apiUrl}/importarCSV?tableName=detalleventa`, formData, 
    {
      headers,
      responseType: 'text',
    });
  }

  exportarCsvClientes(): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/exportarClientes`, {
      headers,
      responseType: 'blob',
    });
  }
  
  importarCsvClientes(file: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/importarClientes`, formData, {
      headers,
      responseType: 'text',
    });
  }
  
}
