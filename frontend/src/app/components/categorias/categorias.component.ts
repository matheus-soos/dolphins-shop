import { CurrencyPipe, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { SearchFilterPipe } from '../../pipes/search-filter.pipe';
import { SelectionModel } from '@angular/cdk/collections';
import { CategoriasService } from '../../services/categorias.service';
import { MatDialog } from '@angular/material/dialog';
import { NovaCategoriaComponent } from './nova-categoria/nova-categoria.component';
import { SubcategoriasComponent } from './subcategorias/subcategorias.component';

@Component({
  selector: 'app-categorias',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    SearchFilterPipe,
    CommonModule,
    RouterModule
  ],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss',
  standalone: true
})
export class CategoriasComponent implements OnInit {
  constructor(
    private categoriasService: CategoriasService,
    private dialog: MatDialog
  ) { }

  selection = new SelectionModel<any>(false)
  searchText: string = ''
  dataSource = new MatTableDataSource(undefined)
  displayedColumns: string[] = ["select", "nome", "status"]

  ngOnInit(): void {
    this.getCategorias()
  }

  getCategorias() {
    this.categoriasService.getCategorias().subscribe({
      next: (response) => {
        const categorias = response.categorias
        this.dataSource = new MatTableDataSource(categorias)
      }
    })
  }

  onCreate() {
    const dialogRef = this.dialog.open(NovaCategoriaComponent, {
      data: { edit: false },
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getCategorias()
      }
    })
  }

  onEditar() {
    const dialogRef = this.dialog.open(NovaCategoriaComponent, {
      data: { edit: true },
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getCategorias()
      }
    })
  }

  subcategorias() {
    const categoria = this.selection.selected[0]

    if (categoria) {
      this.dialog.open(SubcategoriasComponent, {
        data: { categoria_id: categoria.id }
      })
    }
  }

  applyFilter(event: Event) { }
}
