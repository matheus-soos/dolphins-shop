import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProdutoCardComponent } from '../../produto-card/produto-card.component';
import { ProdutosService } from '../../../services/produtos.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-buscar-produto',
  imports: [
    MatIconModule,
    MatButtonModule,
    ProdutoCardComponent
  ],
  templateUrl: './buscar-produto.component.html',
  styleUrl: './buscar-produto.component.scss',
  standalone: true
})
export class BuscarProdutoComponent implements OnInit {
  constructor(
    private produtosService: ProdutosService,
    private route: ActivatedRoute
  ) { }

  text: string = ''
  produtos: Array<any> = []

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const texto = params.get('t');
      if (texto) {
        this.text = texto;
        this.buscaProdutos(texto);
      }
    });
  }

  buscaProdutos(text: string) {
    this.produtosService.buscaProdutos(text).subscribe({
      next: (res: any) => {
        const produtos: any[] = res.produtos

        produtos.forEach((produto) => {
          produto.img = this.produtosService.getImageURL(produto.imgPath)
        })

        this.produtos = produtos
      },
      error: (err) => {
        console.error(err)
        alert("Erro encontrado. Tente novamente")
      }
    })
  }
}
