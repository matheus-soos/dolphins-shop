import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CarrinhosService {

  private qtdCarrinhoSubject = new BehaviorSubject<number>(0);
  qtdCarrinho$ = this.qtdCarrinhoSubject.asObservable();

  constructor(private http: HttpClient) {
    this.atualizarQuantidadeCarrinho();
  }

  criarCarrinho(user_id?: number) {
    return this.http.post(environment.API_URL + "/carrinhos/criarCarrinho", { user_id });
  }

  getCarrinhoId(): number | null {
    const cartRaw = localStorage.getItem("cart");
    if (!cartRaw) return null;

    return JSON.parse(cartRaw).id;
  }

  setCarrinhoId(id: number) {
    localStorage.setItem("cart", JSON.stringify({ id }));
  }

  getCarrinho(): Observable<any> {
    const carrinhoId = this.getCarrinhoId();

    if (!carrinhoId) {
      return new Observable((observer) => {
        this.criarCarrinho().subscribe({
          next: (res: any) => {
            this.setCarrinhoId(res.carrinho.id);
            observer.next(res);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      });
    }

    return this.http.get(environment.API_URL + "/carrinhos/getCarrinho/" + carrinhoId);
  }

  limparCarrinhoLocal(): void {
    localStorage.removeItem("cart");
    this.qtdCarrinhoSubject.next(0);
  }

  atualizarQuantidadeCarrinho() {
    const carrinhoId = this.getCarrinhoId();

    if (!carrinhoId) {
      this.qtdCarrinhoSubject.next(0);
      return;
    }

    this.http.get<any>(environment.API_URL + "/carrinhos/getCarrinho/" + carrinhoId)
      .subscribe({
        next: (res) => {
          const carrinho = res.carrinho || res;
          const itens = carrinho?.Itens_Carrinho || [];

          let soma = 0;
          itens.forEach((item: any) => soma += item.quantidade);

          this.qtdCarrinhoSubject.next(soma);
        },
        error: () => {
          this.qtdCarrinhoSubject.next(0);
        }
      });
  }

  adicionarItem(produto_id: number, quantidade: number = 1) {
    return new Promise((resolve, reject) => {
      const carrinhoId = this.getCarrinhoId();

      if (!carrinhoId) {
        this.criarCarrinho().subscribe({
          next: (response: any) => {
            const novoId = response.carrinho.id;
            this.setCarrinhoId(novoId);

            const reqObj = {
              produto_id,
              carrinho_id: novoId,
              quantidade
            };

            this.http.post(environment.API_URL + "/carrinhos/adicionarItem", reqObj).subscribe({
              next: (res: any) => {
                this.atualizarQuantidadeCarrinho();
                resolve(res);
              },
              error: (err) => reject(err)
            });
          },
          error: (err) => reject(err)
        });

        return;
      }

      const reqObj = {
        produto_id,
        carrinho_id: carrinhoId,
        quantidade
      };

      this.http.post(environment.API_URL + "/carrinhos/adicionarItem", reqObj).subscribe({
        next: (res: any) => {
          this.atualizarQuantidadeCarrinho();
          resolve(res);
        },
        error: (err) => reject(err)
      });
    });
  }

  removerItem(produto_id: number, destroy: boolean) {
    return new Promise((resolve, reject) => {
      const carrinhoId = this.getCarrinhoId();
      if (!carrinhoId) return reject("Carrinho não encontrado");

      const reqObj = {
        produto_id,
        carrinho_id: carrinhoId,
        destroy
      };

      this.http.post(environment.API_URL + "/carrinhos/removerItem", reqObj).subscribe({
        next: (res: any) => {
          this.atualizarQuantidadeCarrinho();
          resolve(res);
        },
        error: (err) => reject(err)
      });
    });
  }
}
