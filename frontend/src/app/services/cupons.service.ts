import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CuponsService {

    constructor(
        private http: HttpClient
    ) { }

    create(reqObj: any) {
        return this.http.post(environment.API_URL + "/cupons/novoCupom", reqObj)
    }

    validarCupom(reqObj: any): Observable<any> {
        return this.http.post(environment.API_URL + "/cupons/validarCupom", reqObj)
    }

    getCupons(): Observable<any> {
        return this.http.get(environment.API_URL + "/cupons/getCupons")
    }
}
