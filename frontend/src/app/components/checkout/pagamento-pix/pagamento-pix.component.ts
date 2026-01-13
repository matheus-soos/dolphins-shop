import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CheckoutService } from '../../../services/checkout.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagamento-pix',
  templateUrl: './pagamento-pix.component.html',
  styleUrls: ['./pagamento-pix.component.scss'],
  imports: [
    CommonModule
  ],
  standalone: true
})
export class PagamentoPixComponent implements OnInit, OnDestroy {

  pix: any;
  chargeId!: string;
  pollingSub!: Subscription;
  statusMsg = 'Aguardando pagamento...';

  constructor(
    private route: ActivatedRoute,
    private checkoutService: CheckoutService
  ) { }

  ngOnInit() {
    const chargePix = this.checkoutService.chargePix

    if (!chargePix) {
      this.chargeId = this.route.snapshot.paramMap.get('id')!;
      this.carregarPix();

      // faz polling a cada 10 segundos
      this.pollingSub = interval(10000)
        .pipe(switchMap(() => this.checkoutService.getPagamento(this.chargeId)))
        .subscribe(resp => {
          const tx = resp.charge.transactions[0];
          this.pix.transactionStatus = tx.transactionStatus;

          if (tx.transactionStatus === 'Paid') {
            this.statusMsg = '✅ Pagamento recebido com sucesso!';
            this.pararPolling();
          }
        });
    }

    else {
      const transaction = chargePix.transactions[0]
      this.pix = {
        valor: transaction.amount,
        status: transaction.transactionStatus,
        qrCodeBase64: transaction.qrCodeBase64,
        qrCode: transaction.qrCode
      }
    }
  }

  carregarPix() {
    this.checkoutService.getPagamento(this.chargeId).subscribe(resp => {
      const transaction = resp.charge.transactions[0];
      const pagamento = resp.pagamento
      this.pix = {
        valor: transaction.amount,
        status: transaction.transactionStatus,
        qrCodeBase64: pagamento.qr_code_base64,
        qrCode: pagamento.qr_code
      };
    });
  }

  pararPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.pararPolling();
  }

  copiarCodigo() {
    navigator.clipboard.writeText(this.pix.qrCode);
    alert('Código PIX copiado!');
  }
}
