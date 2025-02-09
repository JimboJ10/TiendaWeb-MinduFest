import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GuestService {

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  get_envios(): Observable<any> {
    return this.http.get(`./assets/envios.json`);
  }

  ObtenerReviewProductoPublico(productoid:any): Observable<any> {
    return this.http.get(`${this.apiUrl}/obtener_review_producto_publico/${productoid}`);
  }
}
