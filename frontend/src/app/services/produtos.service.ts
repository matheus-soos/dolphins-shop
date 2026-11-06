import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {

  produtos: Array<any> = []

  constructor(
    private http: HttpClient
  ) { }

  novoProduto(data: FormData): Observable<any> {
    return this.http.post(environment.API_URL + '/produtos/novoProduto', data)
  }

  getProdutos(): Observable<any> {
    return this.http.get(environment.API_URL + "/produtos/getProdutos")
  }

  getProdutosBySubcategoria(subcategoria: string): Observable<any> {
    return this.http.get(environment.API_URL + "/produtos/getProdutosBySubcategoria/" + subcategoria)
  }

  buscaProdutos(text: string) {
    return this.http.get(environment.API_URL + "/produtos/buscaProdutos?t=" + text)
  }

  /** Imagem padrão para produto sem foto (arquivo em /public) */
  static readonly SEM_IMAGEM = 'sem-imagem.svg'

  getImageURL(imagePath: string | null | undefined) {
    if (!imagePath) return ProdutosService.SEM_IMAGEM

    // Corrige caminhos antigos salvos com "\" (upload feito no Windows)
    return environment.URL + "/" + imagePath.replace(/\\/g, "/")
  }

  /**
   * URL da imagem principal do produto.
   * As imagens ficam só em Produto_Imagens: nas listagens o backend manda
   * "ImagemPrincipal"; na tela do produto manda a galeria completa em "Imagens".
   */
  getImagemPrincipalURL(produto: any): string {
    const principal = produto?.ImagemPrincipal
      || (produto?.Imagens || []).find((img: any) => img.principal)
      || (produto?.Imagens || [])[0]

    return this.getImageURL(principal?.path)
  }

  /** Lista de URLs da galeria: principal primeiro (o backend já ordena) */
  getGaleriaURLs(produto: any): string[] {
    const imagens: any[] = [...(produto?.Imagens || [])]
      .sort((a, b) => Number(b.principal) - Number(a.principal))

    const urls = imagens.map((img) => this.getImageURL(img.path))

    return urls.length ? urls : [ProdutosService.SEM_IMAGEM]
  }

  getImagens(produto_id: number): Observable<any> {
    return this.http.get(environment.API_URL + "/produtos/" + produto_id + "/imagens")
  }

  uploadImagens(produto_id: number, files: File[]): Observable<any> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return this.http.post(environment.API_URL + "/produtos/" + produto_id + "/imagens", formData)
  }

  definirImagemPrincipal(imagem_id: number): Observable<any> {
    return this.http.put(environment.API_URL + "/produtos/imagens/" + imagem_id + "/principal", {})
  }

  removerImagem(imagem_id: number): Observable<any> {
    return this.http.delete(environment.API_URL + "/produtos/imagens/" + imagem_id)
  }

  getProduto(produto_id: number): Observable<any> {
    return this.http.get(environment.API_URL + "/produtos/getProduto/" + produto_id)
  }

  getCFOP(): Observable<any> {
    return this.http.get<any>(environment.API_URL + "/produtos/getCFOP")
  }

  getNCM(): Observable<any> {
    return this.http.get<any>(environment.API_URL + "/produtos/getNCM")
  }

  getRelacionados(produto_id: number): Observable<any> {
    return this.http.get(environment.API_URL + "/produtos/" + produto_id + "/relacionados")
  }

  getSugestoesCarrinho(produtos: Array<any>) {
    return this.http.post<any>(environment.API_URL + '/produtos/sugestoes-carrinho', { produtos })
  }
}
