import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestorComponent } from './gestor';

describe('GestorComponent', () => {
  let component: GestorComponent;
  let fixture: ComponentFixture<GestorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GestorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
