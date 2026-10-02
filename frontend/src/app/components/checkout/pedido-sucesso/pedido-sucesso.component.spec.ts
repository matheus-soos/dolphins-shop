import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoSucessoComponent } from './pedido-sucesso.component';

describe('PedidoSucessoComponent', () => {
  let component: PedidoSucessoComponent;
  let fixture: ComponentFixture<PedidoSucessoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidoSucessoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidoSucessoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
