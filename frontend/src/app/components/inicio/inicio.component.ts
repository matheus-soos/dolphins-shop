import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProdutosService } from '../../services/produtos.service';
import { CarrinhosService } from '../../services/carrinhos.service';
import { MatDialog } from '@angular/material/dialog';
import { AdicionarCarrinhoComponent } from '../carrinho/adicionar-carrinho/adicionar-carrinho.component';
import { ProdutoCardComponent } from '../produto-card/produto-card.component';

@Component({
  selector: 'app-inicio',
  imports: [MatIconModule, MatButtonModule, ProdutoCardComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
  standalone: true
})
export class InicioComponent implements OnInit {

  constructor(
    private produtosService: ProdutosService,
    private carrinhosService: CarrinhosService,
    private dialog: MatDialog
  ) { }

  produtos: any[] = []

  banners: Array<any> = [
    { img: "" }
  ]

  ngOnInit(): void {
    this.getProdutos().subscribe((response) => {
      const produtos = response.produtos
      produtos.forEach((produto: any) => {
        produto.img = this.produtosService.getImageURL(produto.imgPath)
      })

      this.produtos = produtos
    })

  }

  getProdutos() {
    return this.produtosService.getProdutos();
  }
}
