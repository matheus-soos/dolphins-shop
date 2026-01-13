import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubcategoriasComponent } from './subcategorias.component';

describe('SubcategoriasComponent', () => {
  let component: SubcategoriasComponent;
  let fixture: ComponentFixture<SubcategoriasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubcategoriasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubcategoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
