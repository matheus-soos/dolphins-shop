import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from './components/login/login.component';
import { CarrinhosService } from './services/carrinhos.service';
import { MatBadgeModule } from '@angular/material/badge';
import { CategoriasService } from './services/categorias.service';
import slugify from 'slugify';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from './services/users.service';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatMenuModule,
    MatIconModule,
    RouterModule,
    MatBadgeModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent implements OnInit {
  @ViewChild('categoriasScroll') categoriasScroll!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private carrinhosService: CarrinhosService,
    private categoriasService: CategoriasService,
    private router: Router,
    public usersService: UsersService,
    public authService: AuthService,
  ) {}

  get user(): string {
    const nomeCompleto = localStorage.getItem('nome');

    if (nomeCompleto && nomeCompleto !== 'undefined') {
      return nomeCompleto.split(' ')[0];
    }

    const email = localStorage.getItem('email');
    if (email) {
      return email.split('@')[0];
    }
    return '';
  }

  categorias: any[] = [];
  categoriaSelecionada: any;
  textoBusca = new FormControl('');
  qtdCarrinho: number = 0;

  ngOnInit(): void {
    this.getCategorias().subscribe((response) => {
      this.categorias = response.categorias;
    });

    this.carrinhosService.qtdCarrinho$.subscribe((qtd) => {
      this.qtdCarrinho = qtd;
    });
  }

  openLogin() {
    this.dialog.open(LoginComponent, {
      height: '500px',
      width: '800px',
      maxWidth: '800px',
      autoFocus: false,
    });
  }

  scrollCategorias(valor: number) {
    this.categoriasScroll.nativeElement.scrollBy({
      left: valor,
      behavior: 'smooth',
    });
  }

  mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  menuToggle(open: boolean) {
    const menu = document.getElementById('menu-container');
    if (menu) {
      menu.style.display = open ? 'block' : 'none';
    }
  }

  get subCategoria(): Array<any> {
    if (!this.categoriaSelecionada) return [];
    const categoria = this.categorias.find(
      (c) => c.id === this.categoriaSelecionada?.id,
    );
    return categoria ? categoria.Subcategorias : [];
  }

  getCategorias() {
    return this.categoriasService.getCategorias();
  }

  visualizarProdutos(categoria: any, subcategoria: any) {
    const categoriaSlug = slugify(categoria.nome, {
      lower: true,
      strict: true,
    });
    const subcategoriaSlug = slugify(subcategoria.nome, {
      lower: true,
      strict: true,
    });
    const path = `buscar/categoria/${categoriaSlug}/${subcategoriaSlug}`;

    this.router.navigate([path]);
  }

  buscaProdutos() {
    const text = this.textoBusca.value;

    this.router.navigate(['buscar'], {
      queryParams: { t: text },
    });
  }
}
