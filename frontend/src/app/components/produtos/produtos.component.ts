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
    RouterModule
  ],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss',
  standalone: true
})
export class ProdutosComponent implements OnInit {

  constructor(
    private produtosService: ProdutosService,
    private protheusService: ProtheusService
  ) { }

  selection = new SelectionModel(true)
  displayedColumns: string[] = ["select", "nome", "categoria", "subcategoria", "valor_custo", "valor_venda", "status"]
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
      next: (response) => {
        console.log(response)
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  applyFilter(event: Event) { }
}
