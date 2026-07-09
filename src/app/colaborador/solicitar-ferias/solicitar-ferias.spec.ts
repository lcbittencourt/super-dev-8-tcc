import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarFerias } from './solicitar-ferias';

describe('SolicitarFerias', () => {
  let component: SolicitarFerias;
  let fixture: ComponentFixture<SolicitarFerias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarFerias],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitarFerias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
