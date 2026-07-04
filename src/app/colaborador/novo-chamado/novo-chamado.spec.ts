import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovoChamado } from './novo-chamado';

describe('NovoChamado', () => {
  let component: NovoChamado;
  let fixture: ComponentFixture<NovoChamado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoChamado],
    }).compileComponents();

    fixture = TestBed.createComponent(NovoChamado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
