import { SelectionModel } from '@angular/cdk/collections';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { SearchFilterPipe } from '../../pipes/search-filter.pipe';
import { ProdutosService } from '../../services/produtos.service';
import { PedidosService } from '../../services/pedidos.service';

@Component({
  selector: 'app-pedidos',
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
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
  standalone: true
})
export class PedidosComponent {
  constructor(
    private pedidosService: PedidosService
  ) { }

  selection = new SelectionModel(true)
  displayedColumns: string[] = ["select", "data_hora", "cliente", "status", "forma_pagamento", "valor_total", "desconto_total", "frete"]
  dataSource = new MatTableDataSource(undefined)
  searchText: string = ''
  pedidos: any[] = []

  ngOnInit(): void {
    this.getPedidos()
  }

  getPedidos() {
    this.pedidosService.getPedidos().subscribe({
      next: (response) => {
        const pedidos = response.pedidos
        this.pedidos = pedidos
        this.dataSource = new MatTableDataSource(pedidos)
      }
    })
  }

  onEditarPedido() {

  }

  applyFilter(event: Event) { }
}
