import { Component, Input } from '@angular/core';
import { CarrinhosService } from '../../services/carrinhos.service';
import { ProdutosService } from '../../services/produtos.service';
import { AdicionarCarrinhoComponent } from '../carrinho/adicionar-carrinho/adicionar-carrinho.component';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-produto-card',
  imports: [
    CurrencyPipe,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './produto-card.component.html',
  styleUrl: './produto-card.component.scss',
  standalone: true
})
export class ProdutoCardComponent {
  @Input() produto: any

  constructor(
    private produtosService: ProdutosService,
    private carrinhosService: CarrinhosService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  readonly semImagem = ProdutosService.SEM_IMAGEM

  /** saldo_disponivel vem do backend; se não vier, não bloqueia */
  get esgotado(): boolean {
    const saldo = this.produto?.saldo_disponivel ?? this.produto?.saldo
    return saldo !== undefined && saldo !== null && Number(saldo) <= 0
  }

  adicionarCarrinho(produto: any) {
    if (this.esgotado) return

    this.carrinhosService.adicionarItem(produto.id)
      .then(() => this.dialog.open(AdicionarCarrinhoComponent))
      .catch((err: any) => {
        console.error(err)
        alert(err?.error?.error || 'Não foi possível adicionar ao carrinho.')
      })
  }

  onImagemErro(event: Event) {
    const img = event.target as HTMLImageElement
    if (!img.src.endsWith(this.semImagem)) {
      img.src = this.semImagem
    }
  }

  visualizarProduto() {
    const path = 'buscar/produto/' + this.produto.id

    this.router.navigate([path])
  }
}
