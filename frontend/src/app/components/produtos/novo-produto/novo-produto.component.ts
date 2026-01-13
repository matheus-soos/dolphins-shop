import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SearchFilterPipe } from '../../../pipes/search-filter.pipe';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CategoriasService } from '../../../services/categorias.service';
import { ProdutosService } from '../../../services/produtos.service';
import { CommonModule, Location } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-novo-produto',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    SearchFilterPipe,
    ReactiveFormsModule,
    MatInputModule,
    CommonModule,
    NgxMaskDirective
  ],
  templateUrl: './novo-produto.component.html',
  styleUrl: './novo-produto.component.scss',
  standalone: true
})
export class NovoProdutoComponent implements OnInit {
  @ViewChild('search', { static: true }) search!: TemplateRef<any>;
  @ViewChild(MatPaginator) set paginator(value: MatPaginator) {
    this.dataSource.paginator = value;
  }

  constructor(
    private formBuilder: FormBuilder,
    private location: Location,
    private produtosService: ProdutosService,
    private dialog: MatDialog,
    private categoriasService: CategoriasService,
    private router: Router
  ) { }

  formProduto!: FormGroup
  categorias: Array<any> = []
  subcategorias: Array<any> = []

  cfopList: Array<any> = []
  ncmList: Array<any> = []

  dataSource = new MatTableDataSource<any>(undefined)
  selection = new SelectionModel()
  displayedColumns: string[] = []
  searchText!: string;
  imageFile: File | null = null
  imagePreview: any = 'https://placehold.co/245';

  cfopValue: any
  ncmValue: any

  createForm() {
    this.formProduto = this.formBuilder.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required],
      categoria: ['', Validators.required],
      subcategoria: [{ value: '', disabled: true }, Validators.required],
      valor_custo: [''],
      valor_venda: ['', Validators.required],
      ncm: ['', Validators.required],
      cest: [''],
      cfop: ['', Validators.required],
      peso: ['', Validators.required],
      altura: ['', Validators.required],
      largura: ['', Validators.required],
      comprimento: ['', Validators.required],
    })
  }

  ngOnInit(): void {
    this.createForm()

    this.categoriasService.getCategorias().subscribe({
      next: (response) => {
        this.categorias = response.categorias
      }
    })

    this.produtosService.getCFOP().subscribe({
      next: (response) => {
        this.cfopList = response.cfop
      }
    })

    this.produtosService.getNCM().subscribe({
      next: (response) => {
        const filtered = response.ncm?.filter((ncm: any) => ncm.NCM.replace(/\./g, '').trim().length == 8)
        this.ncmList = filtered
      }
    })
  }

  applyFilter(event: Event) { }

  onCadastrar() {
    if (this.formProduto.valid) {
      const formData = new FormData()

      formData.append('nome', this.formProduto.controls['nome'].value)
      formData.append('descricao', this.formProduto.controls['descricao'].value)
      formData.append('categoria_id', this.formProduto.controls['categoria'].value)
      formData.append('subcategoria_id', this.formProduto.controls['subcategoria'].value)
      formData.append('valor_custo', this.formProduto.controls['valor_custo'].value)
      formData.append('valor_venda', this.formProduto.controls['valor_venda'].value)
      formData.append('ncm', this.ncmValue)
      formData.append('cfop', this.cfopValue)
      formData.append('cest', this.formProduto.controls['cest'].value)
      formData.append('peso', this.formProduto.controls['peso'].value)
      formData.append('altura', this.formProduto.controls['altura'].value)
      formData.append('largura', this.formProduto.controls['largura'].value)
      formData.append('comprimento', this.formProduto.controls['comprimento'].value)

      if (this.imageFile) {
        formData.append('file', this.imageFile)
      }

      this.produtosService.novoProduto(formData).subscribe({
        next: (response) => {
          console.log(response);
          alert('Produto Criado.')
          this.router.navigate(['admin/produtos'])
        },
        error: (err) => {
          console.error(err);
          alert('Erro Encontrado. Tente Novamente.')
        }
      });

    } else {
      this.formProduto.markAllAsTouched()
      alert('Preencha os campos obrigatórios.')
    }
  }

  getSubcategorias() {
    const categoria_id = this.formProduto.controls["categoria"].value

    if (categoria_id) {
      this.categoriasService.getSubcategoriasFromCategoria(categoria_id).subscribe({
        next: (response) => {
          this.subcategorias = response.subcategorias
          this.formProduto.controls["subcategoria"].enable()
        }
      })
    }
  }

  onVoltar() {
    this.router.navigate(["admin/produtos"])
  }

  addCategorias() { }

  searchNCM() {
    this.dataSource = new MatTableDataSource(this.ncmList)
    this.displayedColumns = ["NCM", "DESCRICAO"]


    const dialogRef = this.dialog.open(this.search)

    dialogRef.afterClosed().subscribe(() => {
      const selected: any = this.selection.selected[0]

      if (selected) {
        const ncm = selected.NCM + " " + selected.DESCRICAO

        this.formProduto.patchValue({
          ncm: ncm
        })

        this.ncmValue = selected.NCM
      }
    })
  }

  searchCFOP() {
    this.dataSource = new MatTableDataSource(this.cfopList)
    this.displayedColumns = ["CFOP", "DESCRICAO"]

    const dialogRef = this.dialog.open(this.search)

    dialogRef.afterClosed().subscribe(() => {
      const selected: any = this.selection.selected[0]

      if (selected) {
        const cfop = selected.CFOP + " - " + selected.DESCRICAO

        this.formProduto.patchValue({
          cfop: cfop
        })

        this.cfopValue = selected.CFOP
      }
    })
  }

  onSelect() {
    this.dialog.closeAll()
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];

      const reader = new FileReader();
      reader.readAsDataURL(this.imageFile);
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
    }
  }
}
