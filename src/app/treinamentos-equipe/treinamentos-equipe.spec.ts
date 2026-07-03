import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinamentosEquipeComponent } from './treinamentos-equipe';

describe('TreinamentosEquipeComponent', () => {
  let component: TreinamentosEquipeComponent;
  let fixture: ComponentFixture<TreinamentosEquipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinamentosEquipeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TreinamentosEquipeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
