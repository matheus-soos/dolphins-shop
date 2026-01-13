import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizarProdutosComponent } from './visualizar-produtos.component';

describe('VisualizarProdutosComponent', () => {
  let component: VisualizarProdutosComponent;
  let fixture: ComponentFixture<VisualizarProdutosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizarProdutosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisualizarProdutosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
