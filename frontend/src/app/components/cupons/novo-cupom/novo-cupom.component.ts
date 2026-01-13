import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CuponsService } from '../../../services/cupons.service';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-novo-cupom',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MatIconModule,
    MatDatepickerModule,
    MatSelectModule
  ],
  templateUrl: './novo-cupom.component.html',
  styleUrl: './novo-cupom.component.scss',
  standalone: true
})
export class NovoCupomComponent {
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<NovoCupomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean },
    private cuponsService: CuponsService
  ) { }

  formCupom!: FormGroup

  createForm() {
    this.formCupom = this.formBuilder.group({
      codigo: ['', Validators.required],
      tipo: ['percentual', Validators.required],
      valor: [0, [Validators.required, Validators.min(0)]],
      quantidade_uso: [1, [Validators.required, Validators.min(1)]],
      data_inicio: [null, Validators.required],
      data_fim: [null, Validators.required]
    })
  }

  ngOnInit(): void {
    this.createForm()
  }

  onSubmit() {
    if (this.formCupom.invalid) {
      this.formCupom.markAllAsTouched()
      alert("Preencha os campos obrigatórios")
      return
    }

    const codigo = this.formCupom.controls["codigo"].value
    const tipo = this.formCupom.controls["tipo"].value
    const valor = this.formCupom.controls["valor"].value
    const quantidade_uso = this.formCupom.controls["quantidade_uso"].value
    const data_inicio = this.formCupom.controls["data_inicio"].value
    const data_fim = this.formCupom.controls["data_fim"].value

    const reqObj = {
      codigo,
      tipo,
      valor,
      quantidade_uso,
      data_inicio,
      data_fim
    }

    this.cuponsService.create(reqObj).subscribe({
      next: (response: any) => {
        console.log(response)
        alert("Cupom Criado.")
        this.dialogRef.close(response.cupom)
      },
      error: (err) => {
        console.error(err)
        alert("Erro encontrado. Tente novamente.")
      }
    })
  }
}
