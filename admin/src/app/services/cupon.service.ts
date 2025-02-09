import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CuponService {

  private apiUrl = 'http://localhost:3000';
  private token: string | null = null;

  constructor(private _http: HttpClient) { }

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

  listarCupones(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.get(`${this.apiUrl}/listar_cupones`, { headers });
  }

  buscarCuponPorCodigo(codigo: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.get(`${this.apiUrl}/cupones/buscar`, { params: { codigo }, headers });
  }

  registrarCupon(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.post(`${this.apiUrl}/registrar_cupones`, data, { headers });
  }

  obtenerCupon(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.get(`${this.apiUrl}/obtener_cupones/${id}`, { headers });
  }

  actualizarCupon(id: string, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.put(`${this.apiUrl}/actualizar_cupones/${id}`, data, { headers });
  }

  eliminarCupon(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.delete(`${this.apiUrl}/eliminar_cupones/${id}`, { headers });
  }
}
