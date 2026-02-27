import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { CarrinhoComponent } from './components/carrinho/carrinho.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ProdutosComponent } from './components/produtos/produtos.component';
import { CategoriasComponent } from './components/categorias/categorias.component';
import { UsersComponent } from './components/users/users.component';
import { NovoProdutoComponent } from './components/produtos/novo-produto/novo-produto.component';
import { CuponsComponent } from './components/cupons/cupons.component';
import { VisualizarProdutosComponent } from './components/visualizar-produtos/visualizar-produtos.component';
import { BuscarProdutoComponent } from './components/visualizar-produtos/buscar-produto/buscar-produto.component';
import { ProdutoViewComponent } from './components/visualizar-produtos/produto-view/produto-view.component';
import { CadastroComponent } from './components/login/cadastro/cadastro.component';
import { PedidosComponent } from './components/pedidos/pedidos.component';
import { PagamentoPixComponent } from './components/checkout/pagamento-pix/pagamento-pix.component';
import { EntregaComponent } from './components/entrega/entrega.component';
import { BannersComponent } from './components/banners/banners.component';

export const routes: Routes = [
    { path: "", pathMatch: "full", component: InicioComponent },
    { path: "buscar", component: BuscarProdutoComponent },
    { path: "buscar/categoria/:categoria/:subcategoria", component: VisualizarProdutosComponent },
    { path: "buscar/produto/:id", component: ProdutoViewComponent },
    { path: "carrinho", component: CarrinhoComponent },
    { path: "entrega", component: EntregaComponent },
    { path: "checkout", component: CheckoutComponent },
    { path: "checkout/pagamento/pix/:id", component: PagamentoPixComponent },
    { path: "cadastro", component: CadastroComponent },
    { path: "admin/produtos", component: ProdutosComponent },
    { path: "admin/produtos/novo-produto", component: NovoProdutoComponent },
    { path: "admin/categorias", component: CategoriasComponent },
    { path: "admin/users", component: UsersComponent },
    { path: "admin/cupons", component: CuponsComponent },
    { path: "admin/pedidos", component: PedidosComponent },
    { path: "admin/banners", component: BannersComponent },
];
