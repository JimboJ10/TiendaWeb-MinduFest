import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './GLOBAL';

@Injectable({
  providedIn: 'root'
})
export class FinancieroService {
  public url;

  constructor(
    private _http: HttpClient
  ) {
    this.url = GLOBAL.url;
  }

  // ==================== PLAN DE CUENTAS ====================

  listar_plan_cuentas(filtro: string, tipo: string, estado: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'listar_plan_cuentas?filtro=' + filtro + '&tipo=' + tipo + '&estado=' + estado, { headers: headers });
  }

  obtener_cuenta_contable(id: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_cuenta_contable/' + id, { headers: headers });
  }

  crear_cuenta_contable(data: any, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'crear_cuenta_contable', data, { headers: headers });
  }

  actualizar_cuenta_contable(id: string, data: any, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.put(this.url + 'actualizar_cuenta_contable/' + id, data, { headers: headers });
  }

  // ==================== ASIENTOS CONTABLES ====================

  listar_asientos_contables(desde: string, hasta: string, tipo_documento: string, estado: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'listar_asientos_contables?desde=' + desde + '&hasta=' + hasta + '&tipo_documento=' + tipo_documento + '&estado=' + estado, { headers: headers });
  }

  obtener_asiento_contable(id: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_asiento_contable/' + id, { headers: headers });
  }

  crear_asiento_contable(data: any, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'crear_asiento_contable', data, { headers: headers });
  }

  aprobar_asiento_contable(id: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.put(this.url + 'aprobar_asiento_contable/' + id, {}, { headers: headers });
  }

  // ==================== FLUJO DE CAJA ====================

  listar_flujo_caja(desde: string, hasta: string, tipo: string, categoria: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'listar_flujo_caja?desde=' + desde + '&hasta=' + hasta + '&tipo=' + tipo + '&categoria=' + categoria, { headers: headers });
  }

  registrar_movimiento_caja(data: any, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'registrar_movimiento_caja', data, { headers: headers });
  }

  obtener_resumen_flujo_caja(desde: string, hasta: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_resumen_flujo_caja?desde=' + desde + '&hasta=' + hasta, { headers: headers });
  }

  // ==================== ÓRDENES DE COMPRA ====================

  listar_ordenes_pendientes_pago(proveedorid: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    let params = proveedorid ? `proveedorid=${proveedorid}` : '';
    return this._http.get(this.url + 'listar_ordenes_pendientes_pago?' + params, { headers: headers });
  }

  // ==================== REPORTES FINANCIEROS ====================

  obtener_balance_general(fecha_corte: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_balance_general?fecha_corte=' + fecha_corte, { headers: headers });
  }

  obtener_estado_resultados(fecha_inicio: string, fecha_fin: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_estado_resultados?fecha_inicio=' + fecha_inicio + '&fecha_fin=' + fecha_fin, { headers: headers });
  }
}