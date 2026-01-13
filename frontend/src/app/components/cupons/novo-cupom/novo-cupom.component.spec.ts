import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovoCupomComponent } from './novo-cupom.component';

describe('NovoCupomComponent', () => {
  let component: NovoCupomComponent;
  let fixture: ComponentFixture<NovoCupomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoCupomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovoCupomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
