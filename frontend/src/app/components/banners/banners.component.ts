import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BannersService } from '../../services/banners.service';
import { environment } from '../../../environments/environment';

interface Banner {
  file: File;
  preview: string | ArrayBuffer | null;
  existing?: boolean;
}

@Component({
  selector: 'app-banners',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './banners.component.html',
  styleUrl: './banners.component.scss',
  standalone: true
})
export class BannersComponent implements OnInit {
  constructor(
    private bannersService: BannersService
  ) { }

  maxMaior = 3;
  maxMenor = 6;

  bannersMaior: Banner[] = [];
  bannersMenor: Banner[] = [];

  ngOnInit(): void {
    this.getBanners()
  }

  onFileSelected(event: Event, tipo: 'maior' | 'menor') {
    const input = event.target as HTMLInputElement;

    if (!input.files) return;

    Array.from(input.files).forEach(file => {

      const reader = new FileReader();

      reader.onload = () => {

        const banner: Banner = {
          file,
          preview: reader.result
        };

        if (tipo === 'maior' && this.bannersMaior.length < this.maxMaior) {
          this.bannersMaior = [...this.bannersMaior, banner];
        }

        if (tipo === 'menor' && this.bannersMenor.length < this.maxMenor) {
          this.bannersMenor = [...this.bannersMenor, banner];
        }

      };

      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removerBanner(index: number, tipo: 'maior' | 'menor') {
    if (tipo === 'maior') {
      this.bannersMaior.splice(index, 1);
      this.bannersMaior = [...this.bannersMaior];
    } else {
      this.bannersMenor.splice(index, 1);
      this.bannersMenor = [...this.bannersMenor];
    }
  }

  salvar() {
    const formData = new FormData();

    this.bannersMaior
      .filter(b => b.file)
      .forEach(b => {
        formData.append('heroBanners', b.file as File);
      });

    this.bannersMenor
      .filter(b => b.file)
      .forEach(b => {
        formData.append('secondaryBanners', b.file as File);
      });

    this.bannersService.post(formData).subscribe({
      next: (res) => {
        console.log('Upload feito com sucesso', res);
        this.getBanners();
      },
      error: (err) => {
        console.error('Erro no upload', err);
      }
    });
  }

  getBanners() {
    this.bannersService.get().subscribe({
      next: (response: any) => {

        // HERO / MAIOR
        this.bannersMaior = (response.hero || []).map((img: string) => ({
          preview: this.getImageURL('hero', img),
          existing: true
        }));

        // SECONDARY / MENOR
        this.bannersMenor = (response.secondary || []).map((img: string) => ({
          preview: this.getImageURL('secondary', img),
          existing: true
        }));

      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  getImageURL(bannerType: string, imagePath: string) {
    if (bannerType == "hero") {
      return environment.URL + "/uploads/banners/hero/" + imagePath;
    }
    return environment.URL + "/uploads/banners/secondary/" + imagePath;
  }
}
