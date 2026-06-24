import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaEmpresa } from './nova-empresa';

describe('NovaEmpresa', () => {
  let component: NovaEmpresa;
  let fixture: ComponentFixture<NovaEmpresa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovaEmpresa],
    }).compileComponents();

    fixture = TestBed.createComponent(NovaEmpresa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
