import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Encomendas } from './encomendas';

describe('Encomendas', () => {
  let component: Encomendas;
  let fixture: ComponentFixture<Encomendas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Encomendas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Encomendas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
