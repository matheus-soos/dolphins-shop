import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { SearchFilterPipe } from '../../pipes/search-filter.pipe';
import { RouterModule } from '@angular/router';
import { ProdutosService } from '../../services/produtos.service';
import { ProtheusService } from '../../services/protheus.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProdutoImagensComponent } from './produto-imagens/produto-imagens.component';

@Component({
  selector: 'app-produtos',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    CurrencyPipe,
    SearchFilterPipe,
    CommonModule,
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss',
  standalone: true
})
export class ProdutosComponent implements OnInit {

  constructor(
    private produtosService: ProdutosService,
    private protheusService: ProtheusService,
    private dialog: MatDialog
  ) { }

  selection = new SelectionModel(true)
  displayedColumns: string[] = ["select", "nome", "categoria", "subcategoria", "valor_custo", "valor_venda", "saldo", "status"]
  dataSource = new MatTableDataSource(undefined)
  searchText: string = ''
  produtos: any[] = []

  ngOnInit(): void {
    this.getProdutos()
  }

  getProdutos() {
    this.produtosService.getProdutos().subscribe({
      next: (response) => {
        const produtos = response.produtos
        this.produtos = produtos
        this.dataSource = new MatTableDataSource(produtos)
      }
    })
  }

  onEditarProduto() {

  }

  onSincronizar() {
    this.protheusService.sincronizarProdutos().subscribe({
      next: (response: any) => {
        console.log(response)
        alert(response.message)
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  onSincronizarImagens() {
    const produtos = this.selection.selected
    const ids = produtos.map((p: any) => p.id)

    this.protheusService.sincronizarImagens(ids).subscribe({
      next: (response: any) => {
        console.log(response)
        alert(response.message)
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  onGerenciarImagens() {
    const produto: any = this.selection.selected[0]
    if (!produto) return

    const dialogRef = this.dialog.open(ProdutoImagensComponent, {
      data: { produto },
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((alterou) => {
      if (alterou) this.getProdutos()
    })
  }

  applyFilter(event: Event) { }
}
