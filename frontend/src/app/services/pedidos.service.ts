import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {

  constructor(
    private http: HttpClient
  ) { }

  novoPedido(data: FormData): Observable<any> {
    return this.http.post(environment.API_URL + '/pedidos/novoPedido', data)
  }

  getPedidos(): Observable<any> {
    return this.http.get(environment.API_URL + "/pedidos/getPedidos")
  }

  getPedido(pedido_id: number): Observable<any> {
    return this.http.get(environment.API_URL + "/pedidos/getPedido/" + pedido_id)
  }
}
