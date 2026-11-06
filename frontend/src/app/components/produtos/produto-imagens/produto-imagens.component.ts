import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProdutosService } from '../../../services/produtos.service';

interface NovaImagem {
  file: File;
  preview: string | ArrayBuffer | null;
}

/**
 * Dialog para gerenciar a galeria de imagens de um produto
 * (mesmo padrão da tela de Banners: escolher, pré-visualizar e salvar).
 */
@Component({
  selector: 'app-produto-imagens',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './produto-imagens.component.html',
  styleUrl: './produto-imagens.component.scss',
  standalone: true
})
export class ProdutoImagensComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { produto: any },
    private dialogRef: MatDialogRef<ProdutoImagensComponent>,
    private produtosService: ProdutosService
  ) { }

  readonly maxImagens = 10;

  imagens: any[] = [];
  novas: NovaImagem[] = [];
  carregando = false;
  alterou = false;

  get produto() {
    return this.data.produto;
  }

  get totalImagens(): number {
    return this.imagens.length + this.novas.length;
  }

  ngOnInit(): void {
    this.getImagens();
  }

  getImagens() {
    this.produtosService.getImagens(this.produto.id).subscribe({
      next: (res) => this.setImagens(res.imagens),
      error: (err) => console.error(err)
    });
  }

  setImagens(imagens: any[]) {
    this.imagens = (imagens || []).map((img) => ({
      ...img,
      url: this.produtosService.getImageURL(img.path)
    }));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      if (file.size > 5 * 1024 * 1024) {
        alert(`A imagem "${file.name}" passa de 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (this.totalImagens < this.maxImagens) {
          this.novas = [...this.novas, { file, preview: reader.result }];
        }
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removerNova(index: number) {
    this.novas.splice(index, 1);
    this.novas = [...this.novas];
  }

  salvar() {
    if (!this.novas.length) return;

    this.carregando = true;

    this.produtosService.uploadImagens(this.produto.id, this.novas.map((n) => n.file)).subscribe({
      next: (res) => {
        this.novas = [];
        this.alterou = true;
        this.carregando = false;
        this.setImagens(res.imagens);
      },
      error: (err) => {
        console.error(err);
        this.carregando = false;
        alert(err?.error?.message || 'Erro ao enviar imagens.');
      }
    });
  }

  definirPrincipal(imagem: any) {
    if (!imagem.id || imagem.principal) return;

    this.produtosService.definirImagemPrincipal(imagem.id).subscribe({
      next: (res) => {
        this.alterou = true;
        this.setImagens(res.imagens);
      },
      error: (err) => console.error(err)
    });
  }

  remover(imagem: any) {
    if (!imagem.id) return;
    if (!confirm('Remover esta imagem do produto?')) return;

    this.produtosService.removerImagem(imagem.id).subscribe({
      next: (res) => {
        this.alterou = true;
        this.setImagens(res.imagens);
      },
      error: (err) => console.error(err)
    });
  }

  fechar() {
    this.dialogRef.close(this.alterou);
  }
}
