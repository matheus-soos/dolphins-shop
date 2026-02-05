import { MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UsersService } from '../../../services/users.service';
import { HttpClient } from '@angular/common/http';
import { NgxMaskDirective } from 'ngx-mask';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { AuthService } from '../../../services/auth.service';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-cadastro',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MatIconModule,
    NgxMaskDirective,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss',
  standalone: true
})
export class CadastroComponent {
  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private http: HttpClient,
    public location: Location,
    private authService: AuthService
  ) { }

  formUser!: FormGroup
  showPass: boolean = false
  showConfirmPass: boolean = false

  createForm() {
    this.formUser = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
      nome: ['', Validators.required],
      cpf: ['', Validators.required],
      telefone: ['', Validators.required],
      dataNascimento: [''],
      cep: ['', Validators.required],
      rua: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],
    }, { validator: this.pwdConfirming('password', 'confirmPassword') })
  }

  ngOnInit(): void {
    this.createForm()
  }

  onSubmit() {
    if (this.formUser.invalid) {
      this.formUser.markAllAsTouched();
      alert("Preencha os campos obrigatórios.");
      return;
    }

    const formData = this.formUser.value;

    const reqObj = {
      email: formData.email,
      password: formData.password,
      nome: formData.nome,
      cpf: formData.cpf,
      telefone: formData.telefone,
      dataNascimento: formData.dataNascimento,
      cep: formData.cep,
      rua: formData.rua,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado
    };

    this.usersService.cadastroCliente(reqObj).subscribe({
      next: (response) => {
        console.log(response);
        this.authService.setLocalStorage(response)
        this.location.back()
      },
      error: (err) => {
        console.error(err);
        alert("Erro ao criar usuário. Tente novamente.");
      }
    });
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

  onCepChange() {
    const cep = this.formUser.get('cep')?.value?.replace(/\D/g, '');
    if (cep?.length === 8) {
      this.http.get(`https://viacep.com.br/ws/${cep}/json`).subscribe((res: any) => {
        this.formUser.patchValue({
          rua: res.logradouro,
          bairro: res.bairro,
          cidade: res.localidade,
          estado: res.uf
        });
      });
    }
  }

}
