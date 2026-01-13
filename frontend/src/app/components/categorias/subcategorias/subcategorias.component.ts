import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { SearchFilterPipe } from '../../../pipes/search-filter.pipe';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CategoriasService } from '../../../services/categorias.service';
import { NovaCategoriaComponent } from '../nova-categoria/nova-categoria.component';

@Component({
  selector: 'app-subcategorias',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    CommonModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './subcategorias.component.html',
  styleUrl: './subcategorias.component.scss',
  standalone: true
})
export class SubcategoriasComponent implements OnInit {
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<SubcategoriasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria_id: any },
    private categoriasService: CategoriasService
  ) { }

  selection = new SelectionModel(true)
  dataSource = new MatTableDataSource(undefined)
  formSubcategoria!: FormGroup
  displayedColumns: string[] = ["select", "nome", "status"]

  createForm() {
    this.formSubcategoria = this.formBuilder.group({
      nome: ['', Validators.required]
    })
  }

  ngOnInit(): void {
    this.createForm()

    this.getSubcategorias()
  }

  getSubcategorias() {
    this.categoriasService.getSubcategoriasFromCategoria(this.data.categoria_id).subscribe({
      next: (response) => {
        const subcategorias = response.subcategorias
        this.dataSource = new MatTableDataSource(subcategorias)
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  onCadastrar() {
    if (this.formSubcategoria.invalid) {
      this.formSubcategoria.markAllAsTouched()
      alert("Preencha os campos obrigatórios")
      return
    }

    const nome = this.formSubcategoria.controls["nome"].value

    const reqObj = {
      nome: nome,
      categoria_id: this.data.categoria_id
    }

    this.categoriasService.createSubcategoria(reqObj).subscribe({
      next: (response) => {
        console.log(response)
        alert("SubCategoria Criada.")
        this.getSubcategorias()
        this.formSubcategoria.reset()
      },
      error: (err) => {
        console.error(err)
        alert("Erro encontrado. Tente novamente.")
      }
    })
  }
}
