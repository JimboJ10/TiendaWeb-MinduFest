import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './GLOBAL';

@Injectable({
  providedIn: 'root'
})
export class OrdenCompraService {
  public url;

  constructor(private _http: HttpClient) {
    this.url = GLOBAL.url;
  }

  listar_ordenes_compra(filtro: any, estado: any, proveedorid: any, desde: any, hasta: any, token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + `listar_ordenes_compra?filtro=${filtro}&estado=${estado}&proveedorid=${proveedorid}&desde=${desde}&hasta=${hasta}`, { headers: headers });
  }

  obtener_orden_compra(id: any, token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_orden_compra/' + id, { headers: headers });
  }

  crear_orden_compra(data: any, token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'crear_orden_compra', data, { headers: headers });
  }

  actualizar_orden_compra(id: any, data: any, token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.put(this.url + 'actualizar_orden_compra/' + id, data, { headers: headers });
  }

  cambiar_estado_orden(id: any, data: any, token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.put(this.url + 'cambiar_estado_orden/' + id, data, { headers: headers });
  }

  recibir_productos(id: any, data: any, token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'recibir_productos/' + id, data, { headers: headers });
  }

  cancelar_orden_compra(id: any, data: any, token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.put(this.url + 'cancelar_orden_compra/' + id, data, { headers: headers });
  }

  obtener_estadisticas_ordenes(desde: any, hasta: any, token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + `estadisticas_ordenes_compra?desde=${desde}&hasta=${hasta}`, { headers: headers });
  }

  obtener_estados_orden(token: any): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'estados_orden_compra', { headers: headers });
  }
}