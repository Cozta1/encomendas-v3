import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteFormDialog } from './cliente-form-dialog';

describe('ClienteFormDialog', () => {
  let component: ClienteFormDialog;
  let fixture: ComponentFixture<ClienteFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
