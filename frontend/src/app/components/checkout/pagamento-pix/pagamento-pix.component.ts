import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CheckoutService } from '../../../services/checkout.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CheckoutStepsComponent } from '../../checkout-steps/checkout-steps.component';

@Component({
  selector: 'app-pagamento-pix',
  templateUrl: './pagamento-pix.component.html',
  styleUrls: ['./pagamento-pix.component.scss'],
  imports: [
    CommonModule,
    CheckoutStepsComponent
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
    this.chargeId = this.route.snapshot.paramMap.get('id')!;

    this.carregarPix();

    this.pollingSub = interval(10000)
      .pipe(switchMap(() => this.checkoutService.getPagamento(this.chargeId)))
      .subscribe(resp => {
        const tx = resp.charge.transactions[0];

        this.pix.status = tx.transactionStatus;

        console.log("Polling...", tx.transactionStatus);

        if (tx.transactionStatus === 'Paid') {
          this.statusMsg = '✅ Pagamento recebido com sucesso!';
          this.pararPolling();
        }
      });
  }

  carregarPix() {
    this.checkoutService.getPagamento(this.chargeId).subscribe(resp => {
      const transaction = resp.charge.transactions[0];
      const pagamento = resp.pagamento;

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
