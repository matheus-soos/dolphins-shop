import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CheckoutService {
    chargePix: any;

    constructor(private http: HttpClient) { }

    calcularFrete(reqObj: any): Observable<any> {
        return this.http.post(environment.API_URL + "/frete/calcularFrete", reqObj);
    }

    finalizarCartao(reqObj: {
        itens: any[],
        frete?: number,
        temporaryToken: string
    }) {
        return this.http.post(environment.API_URL + "/checkout/finalizar/cartao", reqObj);
    }

    finalizarPix(reqObj: {
        itens: any[],
        frete?: number,
    }) {
        return this.http.post(environment.API_URL + "/checkout/finalizar/pix", reqObj);
    }

    getPagamento(chargeId: string) {
        return this.http.get<any>(environment.API_URL + "/pagamentos/getPagamento/" + chargeId);
    }

    private key = 'checkout_state';

    set(data: any) {
        sessionStorage.setItem(this.key, JSON.stringify(data));
    }

    get() {
        const raw = sessionStorage.getItem(this.key);
        return raw ? JSON.parse(raw) : null;
    }

    clear() {
        sessionStorage.removeItem(this.key);
    }
}
