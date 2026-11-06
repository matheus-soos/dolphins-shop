import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProdutosService } from '../../../services/produtos.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarrinhosService } from '../../../services/carrinhos.service';
import { AdicionarCarrinhoComponent } from '../../carrinho/adicionar-carrinho/adicionar-carrinho.component';
import { ProdutoCardComponent } from '../../produto-card/produto-card.component';

@Component({
  selector: 'app-produto-view',
  imports: [
    CommonModule,
    RouterModule,
    CurrencyPipe,
    MatIconModule,
    MatButtonModule,
    ProdutoCardComponent
  ],
  templateUrl: './produto-view.component.html',
  styleUrl: './produto-view.component.scss',
  standalone: true
})
export class ProdutoViewComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private produtosService: ProdutosService,
    private carrinhosService: CarrinhosService,
    private dialog: MatDialog
  ) { }

  produto: any
  quantidade: number = 1
  imagens: string[] = []
  imagemAtual: number = 0
  readonly semImagem = ProdutosService.SEM_IMAGEM

  /** Saldo disponível para venda (vem do backend: saldo - pedidos em aberto) */
  get estoqueDisponivel(): number {
    return Number(this.produto?.saldo_disponivel ?? this.produto?.saldo ?? 0)
  }

  get semEstoque(): boolean {
    return !!this.produto && this.estoqueDisponivel <= 0
  }

  /** Mostra a descrição só quando ela agrega algo além do título */
  get descricao(): string {
    const descricao = (this.produto?.descricao || '').trim()
    const nome = (this.produto?.nome || '').trim()
    return descricao && descricao.toLowerCase() !== nome.toLowerCase() ? descricao : ''
  }
  relacionados: Array<any> = []
  sugestoes: Array<any> = []

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const produto_id = params['id']

      this.getProduto(produto_id)
      this.getRelacionados(produto_id)
    })
  }

  getProduto(id: number) {
    this.produtosService.getProduto(id).subscribe({
      next: (res) => {
        this.produto = res.produto
        this.produto.img = this.produtosService.getImagemPrincipalURL(this.produto)

        this.imagens = this.produtosService.getGaleriaURLs(this.produto)
        this.imagemAtual = 0
        this.quantidade = 1
      }
    })
  }

  getRelacionados(id: number) {
    this.produtosService.getRelacionados(id).subscribe({
      next: (response) => {
        this.relacionados = response.relacionados
        this.sugestoes = response.sugestoes

        this.relacionados.forEach((produto) => {
          produto.img = this.produtosService.getImagemPrincipalURL(produto)
        })

        this.sugestoes.forEach((produto) => {
          produto.img = this.produtosService.getImagemPrincipalURL(produto)
        })

      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  removerQuantidade() {
    if (this.quantidade == 1) return

    this.quantidade -= 1
  }

  adicionarQuantidade() {
    if (this.quantidade >= this.estoqueDisponivel) return

    this.quantidade += 1
  }

  adicionarCarrinho() {
    if (this.semEstoque) return

    this.carrinhosService.adicionarItem(this.produto.id, this.quantidade)
      .then(() => this.dialog.open(AdicionarCarrinhoComponent))
      .catch((err: any) => {
        console.error(err)
        // 409 = estoque insuficiente (considera o que já está no carrinho)
        alert(err?.error?.error || 'Não foi possível adicionar ao carrinho.')
      })
  }

  // ----- Galeria -----
  selecionarImagem(index: number) {
    this.imagemAtual = index
  }

  imagemAnterior() {
    if (!this.imagens.length) return
    this.imagemAtual = (this.imagemAtual - 1 + this.imagens.length) % this.imagens.length
  }

  proximaImagem() {
    if (!this.imagens.length) return
    this.imagemAtual = (this.imagemAtual + 1) % this.imagens.length
  }

  onImagemErro(event: Event) {
    const img = event.target as HTMLImageElement
    if (!img.src.endsWith(this.semImagem)) {
      img.src = this.semImagem
    }
  }
}
