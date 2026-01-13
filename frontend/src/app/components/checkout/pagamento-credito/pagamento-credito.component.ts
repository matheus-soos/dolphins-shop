import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CheckoutService } from '../../../services/checkout.service';

@Component({
  selector: 'app-pagamento-credito',
  templateUrl: './pagamento-credito.component.html',
  styleUrls: ['./pagamento-credito.component.scss']
})
export class PagamentoCreditoComponent implements OnInit {
  transacao: any;
  statusMsg = 'Processando pagamento...';

  constructor(
    private route: ActivatedRoute,
    private checkoutService: CheckoutService
  ) {}

  ngOnInit() {
    const chargeId = this.route.snapshot.paramMap.get('chargeId');

    this.checkoutService.getPagamento(chargeId!).subscribe((res: any) => {
      if (res.success) {
        this.transacao = res.charge;

        const status = res.charge.transactions[0].transactionStatus;

        if (status === 'Approved') {
          this.statusMsg = 'Pagamento aprovado!';
        } else if (status === 'Denied') {
          this.statusMsg = 'Pagamento negado!';
        } else {
          this.statusMsg = 'Pagamento pendente de confirmação da operadora.';
        }
      }
    });
  }
}
