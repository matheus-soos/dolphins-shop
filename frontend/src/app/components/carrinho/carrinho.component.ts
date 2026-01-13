import { Component, OnInit } from '@angular/core';
import { CarrinhosService } from '../../services/carrinhos.service';
import { ProdutosService } from '../../services/produtos.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CheckoutService } from '../../services/checkout.service';
import { CuponsService } from '../../services/cupons.service';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-carrinho',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    NgxMaskDirective,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatRadioModule,
    MatCardModule
  ],
  templateUrl: './carrinho.component.html',
  styleUrl: './carrinho.component.scss',
  standalone: true
})
export class CarrinhoComponent implements OnInit {
  constructor(
    private carrinhosService: CarrinhosService,
    private produtosService: ProdutosService,
    private checkoutService: CheckoutService,
    private cuponsService: CuponsService,
    private router: Router
  ) { }

  carrinho: any
  cep_destino = new FormControl('', Validators.required)
  fretes: any[] = []
  freteSelecionado = new FormControl<any>(null, Validators.required)
  cupom = new FormControl('')
  mensagemErroCupom: string | null = null;
  mensagemSucessoCupom: string | null = null;
  valor_desconto: number = 0
  valor_frete: number = 0
  cupons_aplicados: any[] = []

  ngOnInit(): void {
    this.getCarrinho()
  }

  getCarrinho() {
    const carrinho = this.carrinhosService.getCarrinho()

    carrinho?.Itens_Carrinho.forEach((item: any) => {
      item.Produto.img = this.produtosService.getImageURL(item.Produto.imgPath)
    })

    this.carrinho = carrinho
  }

  adicionarItem(produto_id: number) {
    this.carrinhosService.adicionarItem(produto_id).catch((error) => {
      console.error(error)
      alert("Erro Encontrado. Tente novamente.")
      throw error
    }).then(() => {
      this.getCarrinho()
    })
  }

  removerItem(produto_id: number) {
    this.carrinhosService.removerItem(produto_id, false).catch((error) => {
      console.error(error)
      alert("Erro Encontrado. Tente novamente.")
      throw error
    }).then(() => {
      this.getCarrinho()
    })
  }

  excluirItem(produto_id: number) {
    this.carrinhosService.removerItem(produto_id, true).catch((error) => {
      console.error(error)
      alert("Erro Encontrado. Tente novamente.")
      throw error
    }).then(() => {
      this.getCarrinho()
    })
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

  onCalcularFrete() {
    const itens = this.carrinho?.Itens_Carrinho
    const cep_destino = this.cep_destino.value

    const reqObj = {
      itens,
      cep_destino,

    }

    this.checkoutService.calcularFrete(reqObj).subscribe({
      next: (response: Array<any>) => {
        console.log(response)
        const fretesValidos = response.filter(f => !f.error)

        // Correios (company.id === 1)
        const correios = fretesValidos.filter(f => f.company?.id === 1)

        // Outras transportadoras
        const outras = fretesValidos
          .filter(f => f.company?.id !== 1)
          .sort((a, b) => a.price - b.price)

        const outrosSelecionados = outras.slice(0, 4 - correios.length)

        this.fretes = [...correios, ...outrosSelecionados].slice(0, 4)
      }
    })
  }

  selectFrete() {
    const freteSelecionado = this.freteSelecionado.value

    if (!freteSelecionado) return

    const valor = freteSelecionado.price
    this.valor_frete = parseFloat(valor)
  }

  onAplicarCupom() {
    const codigo = this.cupom.value
    const reqObj = {
      codigo
    }

    this.cuponsService.validarCupom(reqObj).subscribe({
      next: (response) => {
        const cupom = response.cupom
        const valor_itens = this.getSubtotal()
        let valorDesconto = 0

        if (cupom.tipo === "percentual") {
          valorDesconto = (valor_itens * cupom.valor) / 100
        } else if (cupom.tipo === "valor") {
          valorDesconto = cupom.valor
        }

        valorDesconto = Math.min(valorDesconto, valor_itens)
        this.valor_desconto += valorDesconto
        this.cupons_aplicados.push(cupom.id)

        this.mensagemErroCupom = null
        this.mensagemSucessoCupom = 'Cupom aplicado com sucesso!'
      },
      error: (err) => {
        if (err.status == 500) {
          console.error(err)
          this.mensagemSucessoCupom = null;
          const msg = 'Erro ao validar cupom';
          this.cupom.setErrors({ apiError: msg });
          this.cupom.markAsTouched();
        }
        else if (err.status = 400) {
          this.mensagemSucessoCupom = null;
          const msg = err?.error?.message;
          this.cupom.setErrors({ apiError: msg });
          this.cupom.markAsTouched();
        }
      }
    })
  }

  onFinalizar() {
    const cupons_aplicados = this.cupons_aplicados
    const frete_selecionado = this.freteSelecionado.value
    const cep = this.cep_destino.value || ''
  
    localStorage.setItem("cep", cep)
    localStorage.setItem("frete_opt", frete_selecionado.id)
    localStorage.setItem("cupons", cupons_aplicados.toString())

    this.router.navigate(["/checkout"])
  }
}
