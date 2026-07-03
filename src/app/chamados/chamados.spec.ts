import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChamadosComponent } from './chamados';

describe('ChamadosComponent', () => {
  let component: ChamadosComponent;
  let fixture: ComponentFixture<ChamadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChamadosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChamadosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
