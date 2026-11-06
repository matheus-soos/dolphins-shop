import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CarrinhosService } from '../../services/carrinhos.service';
import { ProdutosService } from '../../services/produtos.service';
import { MatRadioModule } from '@angular/material/radio';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { CheckoutService } from '../../services/checkout.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CheckoutStepsComponent } from '../checkout-steps/checkout-steps.component';
import { CuponsService } from '../../services/cupons.service';

declare var SafraPayTransparent: any;

@Component({
  selector: 'app-checkout',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CommonModule,
    NgxMaskDirective,
    RouterModule,
    CheckoutStepsComponent
  ],
  providers: [
    provideNgxMask()
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  standalone: true
})
export class CheckoutComponent implements OnInit {

  constructor(
    private carrinhosService: CarrinhosService,
    private produtosService: ProdutosService,
    private checkoutService: CheckoutService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private cuponsService: CuponsService
  ) {
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual; i <= anoAtual + 10; i++) {
      this.anos.push(i);
    }
  }

  carrinho: any
  freteSelecionado: any
  cep_destino: string = ''
  valor_frete: number = 0
  cupom: any = null
  cupons_aplicados: any[] = []
  enviando: boolean = false

  /** Recalcula o desconto sobre o subtotal atual (mesma regra do backend) */
  get valor_desconto(): number {
    return this.cuponsService.calcularDesconto(this.cupom, this.getSubtotal())
  }
  forma_pagamento = new FormControl("")
  anos: number[] = []
  dadosCartao!: FormGroup
  cardBrand: string = ""

  meses = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString().padStart(2, '0')
  }));

  ngOnInit(): void {
    this.createForm()

    this.getCarrinho()

    const data = this.checkoutService.get();

    if (!data) {
      this.router.navigate(['/carrinho']);
      return;
    }

    this.freteSelecionado = data.frete;
    this.valor_frete = data.valor_frete;
    this.cupom = data.cupom || null;
    this.cupons_aplicados = this.cupom ? [this.cupom.id] : [];
    this.cep_destino = data.cep_destino

    SafraPayTransparent.setCredentials({
      merchantCredential: '55124545000100',
      merchantId: 'b44d3550-aa24-4ade-bcb2-c59d9f6cda33'
    });
  }

  createForm() {
    this.dadosCartao = this.formBuilder.group({
      numero_cartao: ["", Validators.required],
      nome_titular: ["", Validators.required],
      documento_titular: ["", Validators.required],
      mes_validade: ["", Validators.required],
      ano_validade: ["", Validators.required],
      cvv: ["", Validators.required],
    })
  }

  getCarrinho() {
    this.carrinhosService.getCarrinho().subscribe({
      next: (response: any) => {
        const carrinho = response.carrinho || response;

        this.carrinho = carrinho;
      },
      error: (err) => {
        console.error(err);
        alert("Erro ao carregar carrinho.");
      }
    });
  }

  getTotal() {
    const valor_itens = this.getSubtotal()
    const valor_frete = this.valor_frete
    const valor_desconto = this.valor_desconto

    return valor_itens + valor_frete - valor_desconto
  }

  getSubtotal() {
    let soma = 0

    this.carrinho?.Itens_Carrinho.forEach((item: any) => {
      soma += (item.Produto.valor_venda * item.quantidade)
    })

    return soma
  }

  onContinuar() {
    if (this.forma_pagamento.invalid || !this.forma_pagamento.value) {
      alert('Selecione a forma de pagamento.');
      return;
    }

    if (this.enviando) return; // evita pedido duplicado com duplo clique
    this.enviando = true;

    const handleSuccess = (response: any) => {
      this.enviando = false;
      this.carrinhosService.limparCarrinhoLocal();
      this.checkoutService.clear();

      this.router.navigate([`checkout/success/${response.pedido_id}`]);
    };

    // Mostra a mensagem do backend (estoque insuficiente, cupom inválido, cartão negado...)
    const handleError = (err: any) => {
      this.enviando = false;
      console.error(err);
      alert(err?.error?.message || 'Não foi possível finalizar o pedido. Tente novamente.');

      // Sem estoque: volta para o carrinho para o cliente ajustar
      if (err?.status === 409) {
        this.router.navigate(['/carrinho']);
      }
    };
    
    const reqBase = {
      itens: this.carrinho?.Itens_Carrinho?.map((item: any) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade
      })),
      cep_destino: this.cep_destino,
      freteSelecionado: this.freteSelecionado,
      cupons_aplicados: this.cupons_aplicados
    };

    if (this.forma_pagamento.value == "credito") {
      const numero_cartao = this.dadosCartao.controls["numero_cartao"].value;
      const nome_titular = this.dadosCartao.controls["nome_titular"].value;
      const documento_titular = this.dadosCartao.controls["documento_titular"].value;
      const mes_validade = this.dadosCartao.controls["mes_validade"].value;
      const ano_validade = this.dadosCartao.controls["ano_validade"].value;
      const cvv = this.dadosCartao.controls["cvv"].value;

      SafraPayTransparent.createTemporaryCard({
        card: {
          brand: this.cardBrand,
          number: numero_cartao,
          holderName: nome_titular,
          holderDocument: documento_titular,
          expirationMonth: mes_validade.toString().padStart(2, '0'),
          expirationYear: ano_validade,
          cvv: cvv
        },
        success: (res: any) => {
          const temporaryToken = res.temporaryToken;

          const reqObj = {
            ...reqBase,
            temporaryToken
          };

          this.checkoutService.finalizarCartao(reqObj).subscribe({
            next: handleSuccess,
            error: handleError
          });
        },
        error: (err: Error) => {
          this.enviando = false;
          console.error("Erro ao tokenizar cartão", err);
          alert('Não foi possível validar os dados do cartão. Confira e tente novamente.');
        }
      });
    }

    else if (this.forma_pagamento.value == "pix") {
      this.checkoutService.finalizarPix(reqBase).subscribe({
        next: handleSuccess,
        error: handleError
      });
    }

    else if (this.forma_pagamento.value == "dinheiro") {
      this.checkoutService.finalizarDinheiro(reqBase).subscribe({
        next: handleSuccess,
        error: handleError
      });
    }
  }

  getCardBrand() {
    const numeroCartao = this.dadosCartao.controls["numero_cartao"].value
    if (numeroCartao && numeroCartao?.length >= 6) {
      SafraPayTransparent.getCardBrand({
        bin: numeroCartao.substring(0, 6),
        success: (res: any) => {
          console.log(res)
          this.cardBrand = res.brand;
        },
        error: (err: Error) => {
          console.error('Erro ao identificar a bandeira', err);
        }
      });
    }
  }
}
