import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CarrinhosService {

  constructor(
    private http: HttpClient
  ) { }

  async adicionarItem(produto_id: number, quantidade?: number) {
    return new Promise((resolve, reject) => {
      const cart = localStorage.getItem("cart");

      if (!cart) {
        this.criarCarrinho().subscribe({
          next: (response: any) => {
            const novoCarrinho = response.carrinho;
            localStorage.setItem("cart", JSON.stringify(novoCarrinho));

            const reqObj = {
              produto_id,
              carrinho_id: novoCarrinho.id,
              quantidade
            }

            this.http.post(environment.API_URL + "/carrinhos/adicionarItem", reqObj).subscribe({
              next: (res: any) => {
                localStorage.setItem("cart", JSON.stringify(res.carrinho));
                resolve(res.carrinho)
              },
              error: (err) => {
                console.error("Erro ao adicionar item:", err);
                reject()
              }
            });
          },
          error: (err) => {
            console.error("Erro ao criar carrinho:", err);
            reject()
          }
        });
      } else {
        const carrinho = JSON.parse(cart)
        const reqObj = {
          produto_id,
          carrinho_id: carrinho.id,
          quantidade
        }

        this.http.post(environment.API_URL + "/carrinhos/adicionarItem", reqObj).subscribe({
          next: (res: any) => {
            localStorage.setItem("cart", JSON.stringify(res.carrinho));
            resolve(res.carrinho)
          },
          error: (err) => {
            console.error("Erro ao adicionar item:", err);
            reject()
          }
        });
      }
    })
  }

  removerItem(produto_id: number, destroy: boolean) {
    return new Promise((resolve, reject) => {
      const cart = localStorage.getItem("cart");

      if (!cart) {
        return reject()
      }

      const carrinho = JSON.parse(cart)
      const reqObj = {
        produto_id,
        carrinho_id: carrinho.id,
        destroy
      }

      this.http.post(environment.API_URL + "/carrinhos/removerItem", reqObj).subscribe({
        next: (res: any) => {
          localStorage.setItem("cart", JSON.stringify(res.carrinho));
          resolve(res.carrinho)
        },
        error: (err) => {
          console.error("Erro ao adicionar item:", err);
          reject()
        }
      });
    })
  }

  criarCarrinho(user_id?: number) {
    return this.http.post(environment.API_URL + "/carrinhos/criarCarrinho", { user_id })
  }

  getCarrinho() {
    const cart = localStorage.getItem("cart")

    if (cart) {
      return JSON.parse(cart)
    }

    this.criarCarrinho().subscribe({
      next: (response: any) => {
        const novoCarrinho = response.carrinho;
        localStorage.setItem("cart", JSON.stringify(novoCarrinho));
        return novoCarrinho
      },
      error: (err) => {
        console.error("Erro ao criar carrinho:", err);
      }
    });
  }

  getQuantidadeCarrinho() {
    const cart = localStorage.getItem("cart")

    if (cart) {
      const carrinho = JSON.parse(cart)

      const itens = carrinho.Itens_Carrinho

      if (itens.length > 0) {
        let soma = 0

        itens.forEach((item: any) => {
          soma += item.quantidade
        })

        return soma
      }
    }

    return 0
  }
}
