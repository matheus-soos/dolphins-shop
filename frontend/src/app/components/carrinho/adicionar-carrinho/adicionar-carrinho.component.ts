import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-adicionar-carrinho',
  imports: [
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './adicionar-carrinho.component.html',
  styleUrl: './adicionar-carrinho.component.scss',
  standalone: true
})
export class AdicionarCarrinhoComponent {
  constructor(
    public dialogRef: MatDialogRef<AdicionarCarrinhoComponent>,
    private router: Router
  ) {}
}
