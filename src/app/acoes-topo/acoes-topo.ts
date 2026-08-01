import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificacoesComponent } from '../notificacoes/notificacoes';
import { TemaService } from '../tema.service';

type PerfilSessao = 'Admin' | 'Gestor' | 'Colaborador';

interface AcessoSessao {
  perfil?: string;
  destino?: string;
}

@Component({
  selector: 'app-acoes-topo',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificacoesComponent],
  templateUrl: './acoes-topo.html',
  styleUrl: './acoes-topo.css',
})
export class AcoesTopoComponent implements OnInit {
  @Input() iniciais = 'AD';

  perfilSessao: PerfilSessao = 'Admin';
  destinoSessao = '/admin';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
    public tema: TemaService,
  ) {}

  ngOnInit() {
    this.atualizarSessao();
  }

  sair() {
    if (this.estaNoNavegador()) {
      localStorage.removeItem('acessoInicialPulso');
      localStorage.removeItem('acessoGestorPulso');
    }

    this.router.navigate(['/']);
  }

  private atualizarSessao() {
    const acesso = this.lerAcessoSalvo();

    if (acesso?.perfil) {
      this.definirPerfil(acesso.perfil, acesso.destino);
      return;
    }

    this.definirPerfilPelaRota();
  }

  private definirPerfil(perfil: string, destino?: string) {
    const perfilNormalizado = perfil.trim().toLowerCase();

    if (perfilNormalizado === 'administrador' || perfilNormalizado === 'admin') {
      this.perfilSessao = 'Admin';
      this.destinoSessao = destino || '/admin';
      return;
    }

    if (perfilNormalizado === 'colaborador') {
      this.perfilSessao = 'Colaborador';
      this.destinoSessao = destino || '/colaborador';
      return;
    }

    this.perfilSessao = 'Gestor';
    this.destinoSessao = destino || '/gestor';
  }

  private definirPerfilPelaRota() {
    const rotaAtual = this.router.url.split('?')[0];

    if (rotaAtual.startsWith('/colaborador')) {
      this.definirPerfil('Colaborador');
      return;
    }

    if (rotaAtual.startsWith('/admin') || rotaAtual.startsWith('/nova-empresa')) {
      this.definirPerfil('Admin');
      return;
    }

    this.definirPerfil('Gestor');
  }

  private lerAcessoSalvo(): AcessoSessao | null {
    if (!this.estaNoNavegador()) {
      return null;
    }

    const acessoSalvo = localStorage.getItem('acessoInicialPulso');

    if (!acessoSalvo) {
      return null;
    }

    try {
      return JSON.parse(acessoSalvo);
    } catch {
      return null;
    }
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
