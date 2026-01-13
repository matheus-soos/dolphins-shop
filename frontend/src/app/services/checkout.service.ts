import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CheckoutService {
    chargePix: any

    constructor(
        private http: HttpClient
    ) { }

    calcularFrete(reqObj: any): Observable<any> {
        return this.http.post(environment.API_URL + "/checkout/calcularFrete", reqObj)
    }

    pagamentoCartao(temporaryToken: string, amount: number) {
        const req = {
            temporaryToken,
            amount
        }

        return this.http.post(environment.API_URL + "/safrapay/pagamentoCartao", req)
    }

    pagamentoPix(amount: number) {
        const req = {
            amount
        }

        return this.http.post(environment.API_URL + "/safrapay/pagamentoPix", req)
    }

    getPagamento(chargeId: string) {
        return this.http.get<any>(environment.API_URL + "/safrapay/consultaPix/" + chargeId);
    }
}
