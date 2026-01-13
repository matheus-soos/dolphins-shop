import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarProdutoComponent } from './buscar-produto.component';

describe('BuscarProdutoComponent', () => {
  let component: BuscarProdutoComponent;
  let fixture: ComponentFixture<BuscarProdutoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscarProdutoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuscarProdutoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
