import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProdutosService } from '../../services/produtos.service';
import { CarrinhosService } from '../../services/carrinhos.service';
import { MatDialog } from '@angular/material/dialog';
import { AdicionarCarrinhoComponent } from '../carrinho/adicionar-carrinho/adicionar-carrinho.component';
import { ProdutoCardComponent } from '../produto-card/produto-card.component';
import { BannersService } from '../../services/banners.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-inicio',
  imports: [CommonModule, MatIconModule, MatButtonModule, ProdutoCardComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
  standalone: true,
})
export class InicioComponent implements OnInit {
  constructor(
    private produtosService: ProdutosService,
    private carrinhosService: CarrinhosService,
    private bannersService: BannersService,
    private dialog: MatDialog,
  ) {}

  produtos: any[] = [];

  heroBanners: string[] = [];
  secondaryBanners: string[] = [];

  // HERO
  currentIndexHero = 0;
  intervalHero: any;

  // SECONDARY
  currentIndexSecondary = 0;
  intervalSecondary: any;

  currentIndex = 0;
  interval: any;

  ngOnInit(): void {
    this.initTrustIndex();
    this.getProdutos();
    this.getBanners();
  }

  initTrustIndex() {
    const oldScript = document.querySelector('script[src*="trustindex.io"]');
    if (oldScript) {
      oldScript.remove();
    }

    const script = document.createElement('script');
    script.src =
      'https://cdn.trustindex.io/loader.js?8a5eb9867389034a5d36af8f711';
    script.async = true;
    script.defer = true;

    const container = document.getElementById('trustindex-container');
    if (container) {
      container.appendChild(script);
    }
  }

  getProdutos() {
    this.produtosService.getProdutos().subscribe((response) => {
      const produtos = response.produtos;
      produtos.forEach((produto: any) => {
        produto.img = this.produtosService.getImageURL(produto.imgPath);
      });

      this.produtos = produtos;
    });
  }

  getBanners() {
    this.bannersService.get().subscribe({
      next: (response: any) => {
        this.heroBanners = response.hero || [];
        this.secondaryBanners = response.secondary || [];

        if (this.heroBanners.length > 1) {
          this.startAutoSlideHero();
        }

        if (this.secondaryBanners.length > 1) {
          this.startAutoSlideSecondary();
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  getImageURL(bannerType: string, imagePath: string) {
    if (bannerType == 'hero') {
      return environment.URL + '/uploads/banners/hero/' + imagePath;
    }
    return environment.URL + '/uploads/banners/secondary/' + imagePath;
  }

  //////////////////////////////////////////////////////////
  // HERO
  //////////////////////////////////////////////////////////

  startAutoSlideHero() {
    this.intervalHero = setInterval(() => {
      this.nextHero(false);
    }, 4000);
  }

  resetAutoSlideHero() {
    clearInterval(this.intervalHero);
    this.startAutoSlideHero();
  }

  nextHero(resetTimer = true) {
    this.currentIndexHero =
      (this.currentIndexHero + 1) % this.heroBanners.length;

    if (resetTimer) this.resetAutoSlideHero();
  }

  prevHero() {
    this.currentIndexHero =
      (this.currentIndexHero - 1 + this.heroBanners.length) %
      this.heroBanners.length;

    this.resetAutoSlideHero();
  }

  goToHero(index: number) {
    this.currentIndexHero = index;
    this.resetAutoSlideHero();
  }

  //////////////////////////////////////////////////////////
  // SECONDARY
  //////////////////////////////////////////////////////////

  startAutoSlideSecondary() {
    this.intervalSecondary = setInterval(() => {
      this.nextSecondary(false);
    }, 4000);
  }

  resetAutoSlideSecondary() {
    clearInterval(this.intervalSecondary);
    this.startAutoSlideSecondary();
  }

  nextSecondary(resetTimer = true) {
    this.currentIndexSecondary =
      (this.currentIndexSecondary + 1) % this.secondaryBanners.length;

    if (resetTimer) this.resetAutoSlideSecondary();
  }

  prevSecondary() {
    this.currentIndexSecondary =
      (this.currentIndexSecondary - 1 + this.secondaryBanners.length) %
      this.secondaryBanners.length;

    this.resetAutoSlideSecondary();
  }

  goToSecondary(index: number) {
    this.currentIndexSecondary = index;
    this.resetAutoSlideSecondary();
  }

  scroll(el: HTMLElement, amount: number) {
    el.scrollBy({
      left: amount,
      behavior: 'smooth',
    });
  }

  //////////////////////////////////////////////////////////

  ngOnDestroy() {
    clearInterval(this.intervalHero);
    clearInterval(this.intervalSecondary);
  }
}
