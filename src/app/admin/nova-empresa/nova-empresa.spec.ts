import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaEmpresaComponent } from './nova-empresa';

describe('NovaEmpresaComponent', () => {
  let component: NovaEmpresaComponent;
  let fixture: ComponentFixture<NovaEmpresaComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovaEmpresaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NovaEmpresaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});