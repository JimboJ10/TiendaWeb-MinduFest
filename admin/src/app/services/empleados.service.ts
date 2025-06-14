import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { GLOBAL } from './GLOBAL';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  public url;

  constructor(
    private _http: HttpClient,
    private _router: Router
  ) { 
    this.url = GLOBAL.url;
  }

  // ======================== GESTIÓN DE EMPLEADOS ========================

  listar_empleados(filtros: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    
    const params = new URLSearchParams();
    if (filtros.departamento && filtros.departamento !== 'todos') params.append('departamento', filtros.departamento);
    if (filtros.cargo && filtros.cargo !== 'todos') params.append('cargo', filtros.cargo);
    if (filtros.estado && filtros.estado !== 'todos') params.append('estado', filtros.estado);
    if (filtros.filtro) params.append('filtro', filtros.filtro);
    if (filtros.limite) params.append('limite', filtros.limite.toString());
    if (filtros.pagina) params.append('pagina', filtros.pagina.toString());

    return this._http.get(this.url + 'listar_empleados?' + params.toString(), { headers: headers });
  }

  obtener_empleado(id: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'obtener_empleado/' + id, { headers: headers });
  }

  crear_empleado(data: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.post(this.url + 'crear_empleado', data, { headers: headers });
  }

  actualizar_empleado(id: any, data: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.put(this.url + 'actualizar_empleado/' + id, data, { headers: headers });
  }

  dar_baja_empleado(id: any, data: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.put(this.url + 'dar_baja_empleado/' + id, data, { headers: headers });
  }

  // ======================== DATOS AUXILIARES ========================

  listar_departamentos(token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'listar_departamentos', { headers: headers });
  }

  listar_cargos(departamentoid?: any, token?: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    
    let url = this.url + 'listar_cargos';
    if (departamentoid) {
      url += '?departamentoid=' + departamentoid;
    }
    
    return this._http.get(url, { headers: headers });
  }

  listar_roles(token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'listar_roles', { headers: headers });
  }

  listar_permisos(modulo?: any, token?: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    
    let url = this.url + 'listar_permisos';
    if (modulo) {
      url += '?modulo=' + modulo;
    }
    
    return this._http.get(url, { headers: headers });
  }

  // ======================== ESTADÍSTICAS ========================

  obtener_estadisticas_empleados(token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'estadisticas_empleados', { headers: headers });
  }

  obtener_historial_salarios(id: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'obtener_historial_salarios/' + id, { headers: headers });
  }

  obtener_historial_cargos(id: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'obtener_historial_cargos/' + id, { headers: headers });
  }

  // ======================== GESTIÓN DE ROLES ========================

  crear_rol(data: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.post(this.url + 'crear_rol', data, { headers: headers });
  }

  actualizar_rol(id: any, data: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.put(this.url + 'actualizar_rol/' + id, data, { headers: headers });
  }

  eliminar_rol(id: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.delete(this.url + 'eliminar_rol/' + id, { headers: headers });
  }

  obtener_rol(id: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'obtener_rol/' + id, { headers: headers });
  }

  obtener_empleados_por_rol(rolid: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'obtener_empleados_por_rol/' + rolid, { headers: headers });
  }

  // ======================== GESTIÓN DE PERMISOS ========================

  crear_permiso(data: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.post(this.url + 'crear_permiso', data, { headers: headers });
  }

  actualizar_permiso(id: any, data: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.put(this.url + 'actualizar_permiso/' + id, data, { headers: headers });
  }

  eliminar_permiso(id: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.delete(this.url + 'eliminar_permiso/' + id, { headers: headers });
  }

  obtener_permiso(id: any, token: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                   .set('Authorization', token);
    return this._http.get(this.url + 'obtener_permiso/' + id, { headers: headers });
  }
}