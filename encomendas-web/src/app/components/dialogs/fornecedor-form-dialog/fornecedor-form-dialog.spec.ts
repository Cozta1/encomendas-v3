import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FornecedorFormDialog } from './fornecedor-form-dialog';

describe('FornecedorFormDialog', () => {
  let component: FornecedorFormDialog;
  let fixture: ComponentFixture<FornecedorFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FornecedorFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FornecedorFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
