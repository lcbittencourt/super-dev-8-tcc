import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinamentosColaborador } from './treinamentos-colaborador';

describe('TreinamentosColaborador', () => {
  let component: TreinamentosColaborador;
  let fixture: ComponentFixture<TreinamentosColaborador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinamentosColaborador],
    }).compileComponents();

    fixture = TestBed.createComponent(TreinamentosColaborador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
