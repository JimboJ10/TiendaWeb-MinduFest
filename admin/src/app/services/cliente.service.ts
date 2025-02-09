import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
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

  listar_clientes(tipo: string | null, filtro: string | null): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/listar_clientes/${tipo}/${filtro}`, {headers});
  }

  registrar_cliente(cliente: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/registrar_cliente`, cliente, {headers});
  }

  obtener_cliente(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_cliente/${id}`, {headers});
  }

  actualizar_cliente(id: string, cliente: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/actualizar_cliente/${id}`, cliente, {headers});
  }

  eliminar_cliente(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/eliminar_cliente/${id}`, {headers});
  }

  listarDirecciones(filtro_apellidos: string): Observable<any[]> {
    let params = new HttpParams();
    const headers = this.getAuthHeaders();
    if (filtro_apellidos) {
      params = params.set('filtro_apellidos', filtro_apellidos);
    }
    return this.http.get<any[]>(`${this.apiUrl}/listar_direcciones`, { params, headers });
  }

}
