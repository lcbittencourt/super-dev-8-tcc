import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

export type Tema = 'claro' | 'escuro';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly chave = 'temaPulso';
  atual: Tema = 'claro';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (!this.estaNoNavegador()) {
      return;
    }

    const salvo = localStorage.getItem(this.chave);
    this.definir(salvo === 'escuro' ? 'escuro' : 'claro');
  }

  get ehEscuro(): boolean {
    return this.atual === 'escuro';
  }

  alternar() {
    this.definir(this.atual === 'escuro' ? 'claro' : 'escuro');
  }

  definir(tema: Tema) {
    this.atual = tema;

    if (!this.estaNoNavegador()) {
      return;
    }

    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem(this.chave, tema);
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
