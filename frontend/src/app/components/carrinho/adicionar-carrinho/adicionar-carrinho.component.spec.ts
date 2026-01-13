import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarCarrinhoComponent } from './adicionar-carrinho.component';

describe('AdicionarCarrinhoComponent', () => {
  let component: AdicionarCarrinhoComponent;
  let fixture: ComponentFixture<AdicionarCarrinhoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdicionarCarrinhoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdicionarCarrinhoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
