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
        this.produto.img = this.produtosService.getImageURL(this.produto.imgPath)
      }
    })
  }

  getRelacionados(id: number) {
    this.produtosService.getRelacionados(id).subscribe({
      next: (response) => {
        this.relacionados = response.relacionados
        this.sugestoes = response.sugestoes

        this.relacionados.forEach((produto) => {
          produto.img = this.produtosService.getImageURL(produto.imgPath)
        })

        this.sugestoes.forEach((produto) => {
          produto.img = this.produtosService.getImageURL(produto.imgPath)
        })

        console.log(this.sugestoes, this.relacionados)
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
    this.quantidade += 1
  }

  adicionarCarrinho() {
    this.carrinhosService.adicionarItem(this.produto.id, this.quantidade)

    this.dialog.open(AdicionarCarrinhoComponent)
  }
}
