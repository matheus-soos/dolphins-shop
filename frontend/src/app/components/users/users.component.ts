import { CommonModule } from '@angular/common';
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
import { UsersService } from '../../services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { NovoUsuarioComponent } from './novo-usuario/novo-usuario.component';

@Component({
  selector: 'app-users',
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
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  standalone: true
})
export class UsersComponent implements OnInit {
  constructor(
    private usersService: UsersService,
    private dialog: MatDialog
  ) { }

  selection = new SelectionModel(false)
  searchText: string = ''
  dataSource = new MatTableDataSource(undefined)
  displayedColumns: string[] = ["select", "email", "status"]

  ngOnInit(): void {
    this.getUsers()
  }

  getUsers() {
    this.usersService.getUsers().subscribe({
      next: (response) => {
        const users = response.users

        this.dataSource = new MatTableDataSource(users)
      }
    })
  }

  applyFilter(event: Event) { }

  onCreate() {
    const dialogRef = this.dialog.open(NovoUsuarioComponent, {
      data: { edit: false },
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getUsers()
      }
    })
  }

  onEditar() {
    const dialogRef = this.dialog.open(NovoUsuarioComponent, {
      data: { edit: true },
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getUsers()
      }
    })
  }
}
