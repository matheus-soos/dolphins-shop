import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsersService } from '../../../services/users.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-novo-usuario',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MatIconModule
  ],
  templateUrl: './novo-usuario.component.html',
  styleUrl: './novo-usuario.component.scss',
  standalone: true
})
export class NovoUsuarioComponent {
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<NovoUsuarioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean },
    private usersService: UsersService
  ) { }

  formUser!: FormGroup
  showPass: boolean = false
  showConfirmPass: boolean = false

  createForm() {
    this.formUser = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    }, { validator: this.pwdConfirming('password', 'confirmPassword') })
  }

  ngOnInit(): void {
    this.createForm()
  }

  onSubmit() {
    if (this.formUser.invalid) {
      this.formUser.markAllAsTouched()
      alert("Preencha os campos obrigatórios")
      return
    }

    const email = this.formUser.controls["email"].value
    const password = this.formUser.controls["password"].value

    const reqObj = {
      email: email,
      password: password,
      isAdmin: true
    }

    this.usersService.register(reqObj).subscribe({
      next: (response) => {
        console.log(response)
        alert("Usuário Criado.")
        this.dialogRef.close()
      },
      error: (err) => {
        console.error(err)
        alert("Erro encontrado. Tente novamente.")
      }
    })
  }

  pwdConfirming(key: string, confirmationKey: string) {
    return (group: FormGroup) => {
      const input = group.controls[key];
      const confirmationInput = group.controls[confirmationKey];
      return confirmationInput.setErrors(
        input.value !== confirmationInput.value ? { notEquivalent: true } : null
      );
    };
  }
}
