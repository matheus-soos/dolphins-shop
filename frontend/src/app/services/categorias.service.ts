import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  constructor(
    private http: HttpClient
  ) { }

  create(reqObj: any) {
    return this.http.post(environment.API_URL + "/categorias/create", reqObj)
  }

  createSubcategoria(reqObj: any) {
    return this.http.post(environment.API_URL + "/categorias/createSubcategoria", reqObj)
  }


  getCategorias(): Observable<any> {
    return this.http.get(environment.API_URL + "/categorias/getCategorias")
  }

  getSubcategorias(): Observable<any> {
    return this.http.get(environment.API_URL + "/categorias/getSubcategorias")
  }

  getSubcategoriasFromCategoria(categoria_id: number): Observable<any> {
    return this.http.get(environment.API_URL + "/categorias/getSubcategorias/" + categoria_id)
  }

  getCategoriaBySlug(slug: string) {
    return this.http.get(environment.API_URL + "/categorias/getCategoriaBySlug/" + slug)
  }

  getSubcategoriaBySlug(slug: string) {
    return this.http.get(environment.API_URL + "/categorias/getSubcategoriaBySlug/" + slug)
  }
}
