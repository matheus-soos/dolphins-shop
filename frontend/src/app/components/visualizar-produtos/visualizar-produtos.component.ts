import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProdutosService } from '../../services/produtos.service';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';
import { CarrinhosService } from '../../services/carrinhos.service';
import { MatDialog } from '@angular/material/dialog';
import { AdicionarCarrinhoComponent } from '../carrinho/adicionar-carrinho/adicionar-carrinho.component';
import { MatButtonModule } from '@angular/material/button';
import { ProdutoCardComponent } from '../produto-card/produto-card.component';
import { CategoriasService } from '../../services/categorias.service';

@Component({
  selector: 'app-visualizar-produtos',
  imports: [
    MatIconModule,
    MatButtonModule,
    ProdutoCardComponent
  ],
  templateUrl: './visualizar-produtos.component.html',
  styleUrl: './visualizar-produtos.component.scss',
  standalone: true
})
export class VisualizarProdutosComponent {

  constructor(
    private route: ActivatedRoute,
    private produtosService: ProdutosService,
    private categoriasService: CategoriasService,
    private dialog: MatDialog
  ) { }

  produtos: any[] = []
  categoria: any
  subcategoria: any

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const categoriaSlug = params.get('categoria') || ''
      const subcategoriaSlug = params.get('subcategoria') || ''

      this.getCategoria(categoriaSlug)
      this.getSubcategoria(subcategoriaSlug)
    })
  }

  getCategoria(slug: string) {
    this.categoriasService.getCategoriaBySlug(slug).subscribe({
      next: (res: any) => {
        this.categoria = res.categoria
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  getSubcategoria(slug: string) {
    this.categoriasService.getSubcategoriaBySlug(slug).subscribe({
      next: (res: any) => {
        this.subcategoria = res.subcategoria
        this.getProdutosBySubcategoria(this.subcategoria.id)
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  getProdutosBySubcategoria(subcategoria_id: string) {
    this.produtosService.getProdutosBySubcategoria(subcategoria_id).subscribe({
      next: (res) => {
        const produtos: any[] = res.produtos

        produtos.forEach((produto) => {
          produto.img = this.produtosService.getImageURL(produto.imgPath)
        })

        this.produtos = produtos
      },
      error: (err) => {
        console.error(err)
        alert(err.error.message)
      }
    })
  }

}
