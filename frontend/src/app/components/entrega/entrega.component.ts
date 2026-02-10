import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgxMaskDirective } from 'ngx-mask';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-entrega',
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
  templateUrl: './entrega.component.html',
  styleUrl: './entrega.component.scss',
  standalone: true
})
export class EntregaComponent {
  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private http: HttpClient,
    public location: Location,
    private authService: AuthService
  ) { }

  formEntrega!: FormGroup

  createForm() {
    this.formEntrega = this.formBuilder.group({
      cep: ['', Validators.required],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],
    })
  }

  ngOnInit(): void {
    this.createForm()
  }

  onCepChange() {
    const cep = this.formEntrega.get('cep')?.value?.replace(/\D/g, '');
    if (cep?.length === 8) {
      this.http.get(`https://viacep.com.br/ws/${cep}/json`).subscribe((res: any) => {
        this.formEntrega.patchValue({
          logradouro: res.logradouro,
          bairro: res.bairro,
          cidade: res.localidade,
          estado: res.uf
        });
      });
    }
  }
}
