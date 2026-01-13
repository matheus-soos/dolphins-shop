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

  adicionarCarrinho(produto: any) {
    this.carrinhosService.adicionarItem(produto.id)

    this.dialog.open(AdicionarCarrinhoComponent)
  }

  visualizarProduto() {
    const path = 'buscar/produto/' + this.produto.id

    this.router.navigate([path])
  }
}
