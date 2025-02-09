import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

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

  registrarProducto(producto: any, file: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('titulo', producto.titulo);
    formData.append('precio', producto.precio);
    formData.append('stock', producto.stock);
    formData.append('categoria', producto.categoria);
    formData.append('descripcion', producto.descripcion);
    formData.append('contenido', producto.contenido);
    formData.append('portada', file);

    return this._http.post(`${this.apiUrl}/registrar_producto`, formData, { headers });
  }

  listarProductos(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.get(`${this.apiUrl}/listar_productos`, { headers });
  }

  obtenerCategorias(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.get(`${this.apiUrl}/categorias`, { headers });
  }

  obtenerProducto(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.get(`${this.apiUrl}/obtener_producto/${id}`, { headers });
  }

  actualizarProducto(id: string, producto: any, file: File | undefined): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('titulo', producto.titulo);
    formData.append('precio', producto.precio);
    formData.append('stock', producto.stock);
    formData.append('categoria', producto.categoria);
    formData.append('descripcion', producto.descripcion);
    formData.append('contenido', producto.contenido);
    if (file) {
      formData.append('portada', file);
    }

    return this._http.put(`${this.apiUrl}/actuaizar_producto/${id}`, formData, { headers });
  }

  eliminarProducto(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.delete(`${this.apiUrl}/eliminar_producto/${id}`, { headers });
  }

  listarInventarioProducto(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.get(`${this.apiUrl}/listar_inventario_producto/${id}`, { headers });
  }

  eliminarInventarioProducto(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.delete(`${this.apiUrl}/eliminar_inventario_producto/${id}`, { headers });
  }

  registrarInventarioProducto(inventario: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.post(`${this.apiUrl}/registrar_inventario_producto`, inventario, { headers });
  }

  ObtenerReviewProductoPublico(productoid:any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this._http.get(`${this.apiUrl}/obtener_review_producto_publico/${productoid}`, {headers});
  }
}
