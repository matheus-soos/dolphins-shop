import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CategoriasService } from '../../../services/categorias.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nova-categoria',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MatIconModule
  ],
  templateUrl: './nova-categoria.component.html',
  styleUrl: './nova-categoria.component.scss',
  standalone: true
})
export class NovaCategoriaComponent implements OnInit {
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<NovaCategoriaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean },
    private categoriasService: CategoriasService
  ) { }

  formCategoria!: FormGroup

  createForm() {
    this.formCategoria = this.formBuilder.group({
      nome: ['', Validators.required]
    })
  }

  ngOnInit(): void {
    this.createForm()
  }

  onSubmit() {
    if (this.formCategoria.invalid) {
      this.formCategoria.markAllAsTouched()
      alert("Preencha os campos obrigatórios")
      return
    }

    const nome = this.formCategoria.controls["nome"].value

    const reqObj = {
      nome: nome
    }

    this.categoriasService.create(reqObj).subscribe({
      next: (response: any) => {
        console.log(response)
        alert("Categoria Criada.")
        this.dialogRef.close(response.categoria)
      },
      error: (err) => {
        console.error(err)
        alert("Erro encontrado. Tente novamente.")
      }
    })
  }
}
