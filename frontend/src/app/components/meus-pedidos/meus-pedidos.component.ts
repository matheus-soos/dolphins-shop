import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PedidosService } from '../../services/pedidos.service';
import { ProdutosService } from '../../services/produtos.service';
import { LoginComponent } from '../login/login.component';

interface StatusInfo {
  label: string;
  icon: string;
  classe: string;
  descricao: string;
}

/**
 * Área do cliente: lista os pedidos do usuário logado.
 * O backend (/pedidos/meusPedidos) já filtra pelo cliente do token.
 */
@Component({
  selector: 'app-meus-pedidos',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './meus-pedidos.component.html',
  styleUrl: './meus-pedidos.component.scss',
  standalone: true
})
export class MeusPedidosComponent implements OnInit {
  constructor(
    private pedidosService: PedidosService,
    private produtosService: ProdutosService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  pedidos: any[] = [];
  carregando = true;
  erro = false;
  expandido: number | null = null;
  detalhes: Record<number, any> = {};

  readonly semImagem = ProdutosService.SEM_IMAGEM;

  private readonly statusMap: Record<string, StatusInfo> = {
    Pendente: {
      label: 'Aguardando pagamento',
      icon: 'schedule',
      classe: 'pendente',
      descricao: 'Assim que o pagamento for confirmado, seu pedido seguirá para separação.'
    },
    Pago: {
      label: 'Pagamento aprovado',
      icon: 'check_circle',
      classe: 'pago',
      descricao: 'Pagamento confirmado! Seu pedido está sendo preparado.'
    },
    Integrado: {
      label: 'Em separação',
      icon: 'inventory_2',
      classe: 'integrado',
      descricao: 'Seu pedido está sendo separado para envio.'
    },
    Cancelado: {
      label: 'Cancelado',
      icon: 'cancel',
      classe: 'cancelado',
      descricao: 'Este pedido foi cancelado. Se o pagamento foi efetuado, o valor será estornado.'
    }
  };

  ngOnInit(): void {
    if (this.authService.isLoggedOut()) {
      this.solicitarLogin();
      return;
    }

    this.getPedidos();
  }

  solicitarLogin() {
    this.carregando = false;

    const dialogRef = this.dialog.open(LoginComponent, {
      height: '500px',
      width: '800px',
      maxWidth: '800px',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((logado) => {
      if (logado) {
        this.getPedidos();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  getPedidos() {
    this.carregando = true;
    this.erro = false;

    this.pedidosService.getMeusPedidos().subscribe({
      next: (res) => {
        this.pedidos = (res.pedidos || []).map((pedido: any) => this.prepararPedido(pedido));
        this.carregando = false;
      },
      error: (err) => {
        console.error(err);
        this.carregando = false;

        // Token expirado/inválido
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.solicitarLogin();
          return;
        }

        this.erro = true;
      }
    });
  }

  private prepararPedido(pedido: any) {
    const itens = (pedido.Pedido_Venda_Items || []).map((item: any) => ({
      ...item,
      img: this.produtosService.getImagemPrincipalURL(item.Produto)
    }));

    const subtotal = itens.reduce((acc: number, item: any) => acc + Number(item.valor_total || 0), 0);
    const quantidade = itens.reduce((acc: number, item: any) => acc + Number(item.quantidade || 0), 0);

    return {
      ...pedido,
      itens,
      subtotal,
      quantidade,
      pagamento: (pedido.Pagamentos || [])[0] || null
    };
  }

  getStatus(status: string): StatusInfo {
    return this.statusMap[status] || {
      label: status,
      icon: 'info',
      classe: 'outro',
      descricao: ''
    };
  }

  formaPagamentoLabel(forma: string): string {
    const formas: Record<string, string> = {
      Pix: 'PIX',
      Credito: 'Cartão de crédito',
      Dinheiro: 'Dinheiro'
    };
    return formas[forma] || forma || '-';
  }

  /** PIX pendente: permite voltar para a tela do QR Code */
  podePagar(pedido: any): boolean {
    return pedido.status === 'Pendente' && pedido.forma_pagamento === 'Pix';
  }

  toggle(pedido: any) {
    if (this.expandido === pedido.id) {
      this.expandido = null;
      return;
    }

    this.expandido = pedido.id;

    // Endereço / cupom só são buscados quando o cliente abre o pedido
    if (!this.detalhes[pedido.id]) {
      this.pedidosService.getMeuPedido(pedido.id).subscribe({
        next: (res) => this.detalhes[pedido.id] = res.pedido,
        error: (err) => console.error(err)
      });
    }
  }

  verProduto(produto_id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['buscar/produto/' + produto_id]);
  }

  pagar(pedido: any, event: Event) {
    event.stopPropagation();
    this.router.navigate(['checkout/success/' + pedido.id]);
  }

  onImagemErro(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(this.semImagem)) {
      img.src = this.semImagem;
    }
  }
}
