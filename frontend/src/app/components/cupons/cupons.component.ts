import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { SearchFilterPipe } from '../../pipes/search-filter.pipe';
import { SelectionModel } from '@angular/cdk/collections';
import { CuponsService } from '../../services/cupons.service';
import { MatDialog } from '@angular/material/dialog';
import { NovoCupomComponent } from './novo-cupom/novo-cupom.component';

@Component({
  selector: 'app-cupons',
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
  templateUrl: './cupons.component.html',
  styleUrl: './cupons.component.scss',
  standalone: true
})
export class CuponsComponent implements OnInit {
  constructor(
    private cuponsService: CuponsService,
    private dialog: MatDialog
  ) { }

  selection = new SelectionModel<any>(false)
  searchText: string = ''
  dataSource = new MatTableDataSource(undefined)
  displayedColumns: string[] = ["select", "codigo", "tipo", "valor", "quantidade_uso", "data_inicio", "data_fim", "status"]

  ngOnInit(): void {
    this.getCupons()
  }

  getCupons() {
    this.cuponsService.getCupons().subscribe({
      next: (response) => {
        const cupons = response.cupons
        this.dataSource = new MatTableDataSource(cupons)
      },
      error: (err) => {
        console.error(err)
        alert("Erro ao carregar cupons")
      }
    })
  }

  applyFilter(event: Event) {

  }

  onCreate() {
    const dialogRef = this.dialog.open(NovoCupomComponent, {
      autoFocus: false,
      data: { edit: false }
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getCupons()
      }
    })
  }

  onEditar() {
    const dialogRef = this.dialog.open(NovoCupomComponent, {
      autoFocus: false,
      data: { edit: true }
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getCupons()
      }
    })
  }
}
