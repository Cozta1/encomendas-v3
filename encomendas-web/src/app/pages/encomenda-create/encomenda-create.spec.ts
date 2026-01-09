import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncomendaCreate } from './encomenda-create';

describe('EncomendaCreate', () => {
  let component: EncomendaCreate;
  let fixture: ComponentFixture<EncomendaCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncomendaCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncomendaCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
