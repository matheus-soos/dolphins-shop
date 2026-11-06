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

    /**
     * Mesma regra do backend (services/cupomService.js):
     * desconto só sobre o subtotal dos produtos, nunca maior que ele.
     * O "valor" vem como texto do banco, por isso o Number().
     */
    calcularDesconto(cupom: any, subtotal: number): number {
        if (!cupom) return 0

        const valor = Number(String(cupom.valor ?? '0').replace(',', '.'))
        const base = Number(subtotal) || 0

        if (!valor || valor < 0 || base <= 0) return 0

        let desconto = 0

        if (cupom.tipo === 'percentual') {
            desconto = (base * Math.min(valor, 100)) / 100
        } else if (cupom.tipo === 'valor') {
            desconto = valor
        }

        return Math.round(Math.min(desconto, base) * 100) / 100
    }

    getCupons(): Observable<any> {
        return this.http.get(environment.API_URL + "/cupons/getCupons")
    }
}
