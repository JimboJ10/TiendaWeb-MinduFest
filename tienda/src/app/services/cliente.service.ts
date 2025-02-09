import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apiUrl = 'http://localhost:3000';
  private token: string | null = null;

  constructor(private http: HttpClient, private router:Router) {}

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

  login(data: { email: string, password: string, twoFactorCode?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  register(data: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(`${this.apiUrl}/register`, data, { headers });
  }

  obtenerClienteConRol(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_cliente_con_rol/${id}`, { headers });
  }

  actualizarCliente(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar_cliente/${id}`, data);
  }

  cambiarPassword(id: string, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/cambiar_password/${id}`, data, { headers });
  }

  obtenerCategorias(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categorias`);
  }

  buscarCategorias(filtro: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/buscar_categorias?filter=${filtro}`);
  }

  listarProductos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/listar_productos_clientes`);
  }

  obtenerProductoPorTitulo(titulo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/obtener_producto_por_titulo/${titulo}`);
  }

  agregarProductoAlCarrito(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/agregarCarrito`, data, { headers });
  }
  
  obtenerCarritoCliente(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtenerCarrito/${id}`, { headers });
  }

  eliminarCarritoCliente(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/eliminarCarrito/${id}`, { headers });
  }

  registroDireccionCliente(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/registrar_direccion_cliente`, data, { headers });
  }

  obtenerDireccionesCliente(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_direcciones_cliente/${id}`, { headers });
  }
  
  cambiarDireccionPrincipalCliente(usuarioid: string, direccionid: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(
      `${this.apiUrl}/cambiarDireccionPrincipal`,
      { usuarioid, direccionid },
      { headers }
    );
  }

  obtenerDireccionPrincipalCliente(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_direccion_principal_cliente/${id}`, { headers });
  }
  
  registrarVenta(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/registrar_venta`, data, { headers });
  }

  obtenerOrdenesCliente(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_ordenes_cliente/${id}`, { headers });
  }

  obtenerDetallesVenta(ventaid: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_detalles_cliente/${ventaid}`, { headers });
  }

  actualizarCantidadCarrito(carritoid: number, cantidad: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/carrito/actualizarCantidadCarrito`, { carritoid, cantidad });
  }

  // Función para incrementar la cantidad de un producto en el carrito
  incrementarCantidadCarrito(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/carrito/incrementar/${id}`, {});
  }
  
  // Función para decrementar la cantidad de un producto en el carrito
  decrementarCantidadCarrito(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/carrito/decrementar/${id}`, {});
  }

  enviarCorreoCompra(ventaid: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/enviar_correo_compra/${ventaid}`, {}, { headers });
  }

  
  emitirReviewProductoCliente(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/emitir_review_producto_cliente`, data, { headers });
  }

  obtenerReviewProductoCliente(productoid: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_review_producto_cliente/${productoid}`, { headers });
  }

  obtenerReviewCliente(usuarioid: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/obtener_review_cliente/${usuarioid}`, { headers });
  }

  // Funciones para el manejo de la autenticación de dos factores

  configurar2FA(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/configurar`, { email }, {
      headers: this.getAuthHeaders()
    });
  }
  
  verificar2FA(token: string, secret: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/verificar`, { token, secret },);
  }
  
  cambiarEstado2FA(email: string, enabled: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/cambiar-estado`, { email, enabled }, {
      headers: this.getAuthHeaders()
    });
  }
  
  obtenerEstado2FA(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/2fa/estado/${email}`, {
      headers: this.getAuthHeaders()
    });
  }

  // funciones para restablecimiento de password

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { 
      token, 
      newPassword 
    });
  }

  // Funciones para la busqueda de productos
  buscarProductos(termino: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/buscar_productos?termino=${termino}`);
  }

  // funcion para obtener paises con API externa
  obtenerPaises(): Observable<any> {
    return this.http.get('https://restcountries.com/v3.1/all');
  }

}
