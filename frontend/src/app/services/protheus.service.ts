import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProtheusService {

    constructor(
        private http: HttpClient
    ) { }

    sincronizarProdutos() {
        return this.http.post(environment.API_URL + "/protheus/importarProdutos", {})
    }

    sincronizarCategorias() {
        return this.http.post(environment.API_URL + "/protheus/importarCategorias", {})
    }
}
