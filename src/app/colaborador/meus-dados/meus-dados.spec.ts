import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeusDados } from './meus-dados';

describe('MeusDados', () => {
  let component: MeusDados;
  let fixture: ComponentFixture<MeusDados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeusDados],
    }).compileComponents();

    fixture = TestBed.createComponent(MeusDados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
