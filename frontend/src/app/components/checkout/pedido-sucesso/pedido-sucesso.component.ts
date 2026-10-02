import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CheckoutService } from '../../../services/checkout.service';
import { CheckoutStepsComponent } from '../../checkout-steps/checkout-steps.component';

@Component({
  selector: 'app-pedido-sucesso',
  templateUrl: './pedido-sucesso.component.html',
  styleUrls: ['./pedido-sucesso.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CheckoutStepsComponent
  ]
})
export class PedidoSucessoComponent implements OnInit, OnDestroy {

  pedidoId!: string;
  dadosCobranca: any;
  formaPagamento: string = '';
  statusMsg: string = '';
  pollingSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private checkoutService: CheckoutService
  ) { }

  ngOnInit(): void {
    this.pedidoId = this.route.snapshot.paramMap.get('id')!;
    this.carregarDados();
  }

  carregarDados(): void {
    this.checkoutService.getPagamento(this.pedidoId).subscribe({
      next: (resp) => {
        const tx = resp.charge?.transactions?.[0] || {};
        const pagamento = resp.pagamento || {};

        // Identifica o método de pagamento a partir do retorno da API
        // Ajuste os nomes das propriedades conforme a estrutura real do seu backend
        this.formaPagamento = pagamento.metodo || tx.paymentMethod || 'pix';

        this.dadosCobranca = {
          valor: tx.amount || resp.charge?.amount,
          status: tx.transactionStatus || resp.charge?.status,
          qrCodeBase64: pagamento.qr_code_base64,
          qrCode: pagamento.qr_code,
          cartaoFinal: pagamento.cartao_final
        };

        this.definirMensagemStatus();

        // Só ativa o Polling se for PIX e não estiver aprovado ainda
        if (this.formaPagamento === 'pix' && this.dadosCobranca.status !== 'Paid') {
          this.iniciarPollingPix();
        }
      },
      error: (err) => console.error('Erro ao carregar dados do pagamento:', err)
    });
  }

  iniciarPollingPix(): void {
    this.statusMsg = 'Aguardando pagamento via PIX...';

    this.pollingSub = interval(10000)
      .pipe(switchMap(() => this.checkoutService.getPagamento(this.pedidoId)))
      .subscribe(resp => {
        const tx = resp.charge?.transactions?.[0];
        if (!tx) return;

        this.dadosCobranca.status = tx.transactionStatus;

        if (tx.transactionStatus === 'Paid') {
          this.statusMsg = '✅ Pagamento PIX recebido com sucesso!';
          this.pararPolling();
        }
      });
  }

  definirMensagemStatus(): void {
    if (this.formaPagamento === 'dinheiro') {
      this.statusMsg = '✅ Pedido confirmado! Aguardando entrega/retirada.';
    } else if (this.formaPagamento === 'cartao' || this.dadosCobranca.status === 'Paid') {
      this.statusMsg = '✅ Pagamento aprovado com sucesso!';
    } else if (this.formaPagamento === 'pix') {
      this.statusMsg = 'Aguardando confirmação do PIX...';
    }
  }

  copiarCodigoPix(): void {
    if (this.dadosCobranca?.qrCode) {
      navigator.clipboard.writeText(this.dadosCobranca.qrCode);
      alert('Código PIX copiado!');
    }
  }

  pararPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }
}