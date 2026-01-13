import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../services/users.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [MatDialogModule, MatFormField, MatLabel, MatInput, MatButtonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true
})
export class LoginComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {},
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService
  ) { }

  loginForm!: FormGroup

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ["", Validators.required],
      password: ["", Validators.required]
    })
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched()
      return
    }

    const email = this.loginForm.controls["email"].value
    const password = this.loginForm.controls["password"].value

    const reqObj = {
      email, password
    }

    this.usersService.login(reqObj).subscribe({
      next: (response) => {
        console.log(response);
        this.authService.setLocalStorage(response)
        this.dialogRef.close()
      },
      error: (err) => {
        console.error(err);
        alert("Erro ao realizar login. Tente novamente.");
      }
    })
  }
}
