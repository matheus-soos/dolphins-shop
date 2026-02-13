import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule, Location } from '@angular/common';
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
import { CheckoutStepsComponent } from '../checkout-steps/checkout-steps.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';

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
    MatNativeDateModule,
    CheckoutStepsComponent,
    MatCheckboxModule
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
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  formEntrega!: FormGroup
  cliente: any

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

    this.getCliente()
  }

  getCliente() {
    const user_id = localStorage.getItem("user_id")

    if (!user_id) {
      const dialogRef = this.dialog.open(LoginComponent, {
        height: '500px',
        width: '800px',
        maxWidth: '800px',
        autoFocus: false
      })

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.router.navigate(['/checkout']);
        }
      })

      return
    }

    this.usersService.getCliente(user_id).subscribe({
      next: (response: any) => {
        console.log(response)
        if (response.user) {
          this.cliente = response.user.Cliente
        }
      },
      error: (err) => {
        console.error(err)
      }
    })
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

  async onEnderecoChange(event: any) {
    const checked = event.checked;
    if (checked) {
      const cliente = this.cliente

      this.formEntrega.patchValue({
        logradouro: cliente.logradouro || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || '',
      });
    } else {
      this.formEntrega.reset();
    }
  }
}
