// En admin/src/app/services/reportes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './GLOBAL';
import { ReporteVentasPeriodo, ReporteStock, DashboardMetricas, ReporteVentasProducto } from '../models/reportes.model';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  public url;

  constructor(private _http: HttpClient) {
    this.url = GLOBAL.url;
  }

  // ======================== REPORTES DE VENTAS ========================

  reporte_ventas_periodo(fecha_inicio: string, fecha_fin: string, tipo_reporte: string, token: string): Observable<ReporteVentasPeriodo> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get<ReporteVentasPeriodo>(this.url + 'reporte_ventas_periodo?fecha_inicio=' + fecha_inicio + '&fecha_fin=' + fecha_fin + '&tipo_reporte=' + tipo_reporte, { headers: headers });
  }

  reporte_ventas_producto(fecha_inicio: string, fecha_fin: string, productoid: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    let params = '';
    
    if (fecha_inicio) params += 'fecha_inicio=' + fecha_inicio;
    if (fecha_fin) params += (params ? '&' : '') + 'fecha_fin=' + fecha_fin;
    if (productoid) params += (params ? '&' : '') + 'productoid=' + productoid;
    
    const url = this.url + 'reporte_ventas_producto' + (params ? '?' + params : '');
    console.log('URL del reporte:', url);
    
    return this._http.get(url, { headers: headers });
  }

  reporte_ventas_cliente(fecha_inicio: string, fecha_fin: string, limite: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'reporte_ventas_cliente?fecha_inicio=' + fecha_inicio + '&fecha_fin=' + fecha_fin + '&limite=' + limite, { headers: headers });
  }

  // ======================== REPORTES DE INVENTARIO ========================

  reporte_stock_actual(categoria: string, estado_stock: string, limite: string, token: string): Observable<ReporteStock> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    let params = 'limite=' + limite;
    if (categoria) params += '&categoria=' + categoria;
    if (estado_stock) params += '&estado_stock=' + estado_stock;
    return this._http.get<ReporteStock>(this.url + 'reporte_stock_actual?' + params, { headers: headers });
  }

  reporte_movimientos_inventario(fecha_inicio: string, fecha_fin: string, tipo_movimiento: string, productoid: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    let params = 'fecha_inicio=' + fecha_inicio + '&fecha_fin=' + fecha_fin;
    if (tipo_movimiento) params += '&tipo_movimiento=' + tipo_movimiento;
    if (productoid) params += '&productoid=' + productoid;
    return this._http.get(this.url + 'reporte_movimientos_inventario?' + params, { headers: headers });
  }

  // ======================== REPORTES FINANCIEROS ========================

  reporte_cuentas_por_cobrar(fecha_corte: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'reporte_cuentas_por_cobrar?fecha_corte=' + fecha_corte, { headers: headers });
  }

  reporte_cuentas_por_pagar(fecha_corte: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'reporte_cuentas_por_pagar?fecha_corte=' + fecha_corte, { headers: headers });
  }

  // ======================== REPORTES ADMINISTRATIVOS ========================

  reporte_actividad_usuarios(fecha_inicio: string, fecha_fin: string, token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'reporte_actividad_usuarios?fecha_inicio=' + fecha_inicio + '&fecha_fin=' + fecha_fin, { headers: headers });
  }

  // ======================== DASHBOARD ========================

  dashboard_reportes(periodo: string, token: string): Observable<DashboardMetricas> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get<DashboardMetricas>(this.url + 'dashboard_reportes?periodo=' + periodo, { headers: headers });
  }

  // ======================== UTILITARIOS ========================

  obtener_categorias(token: string): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_categorias', { headers: headers });
  }
}