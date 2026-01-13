import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {

  produtos: Array<any> = []

  constructor(
    private http: HttpClient
  ) { }

  novoProduto(data: FormData): Observable<any> {
    return this.http.post(environment.API_URL + '/produtos/novoProduto', data)
  }

  getProdutos(): Observable<any> {
    return this.http.get(environment.API_URL + "/produtos/getProdutos")
  }

  getProdutosBySubcategoria(subcategoria: string): Observable<any> {
    return this.http.get(environment.API_URL + "/produtos/getProdutosBySubcategoria/" + subcategoria)
  }

  buscaProdutos(text: string) {
    return this.http.get(environment.API_URL + "/produtos/buscaProdutos?t=" + text)
  }

  getImageURL(imagePath: string) {
    return environment.URL + "/" + imagePath
  }

  getProduto(produto_id: number): Observable<any> {
    return this.http.get(environment.API_URL + "/produtos/getProduto/" + produto_id)
  }

  getCFOP(): Observable<any> {
    return this.http.get<any>(environment.API_URL + "/produtos/getCFOP")
  }

  getNCM(): Observable<any> {
    return this.http.get<any>(environment.API_URL + "/produtos/getNCM")
  }
}
