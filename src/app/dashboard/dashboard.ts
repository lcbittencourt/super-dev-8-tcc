import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';

interface EmpresaPainel {
  id: string;
  nome: string;
  cidade: string;
  plano: string;
  usuarios: number;
  modulos: number;
  situacao: string;
  logo: string;
}

interface ColaboradorPainel {
  nome: string;
  situacao: string;
  diasLicencaMedica?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  empresa: EmpresaPainel = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    plano: 'Empresarial',
    usuarios: 147,
    modulos: 8,
    situacao: 'Ativa',
    logo: 'TV'
  };

  colaboradores: ColaboradorPainel[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    const empresaSelecionada = localStorage.getItem('empresaSelecionadaDashboard');

    if (empresaSelecionada) {
      this.empresa = this.normalizarEmpresa(JSON.parse(empresaSelecionada));
    }

    const colaboradoresSalvos = localStorage.getItem(this.chaveColaboradores());

    this.colaboradores = colaboradoresSalvos ? JSON.parse(colaboradoresSalvos) : [];
  }

  funcionarios(): number {
    return this.colaboradores.length || this.empresa.usuarios || 0;
  }

  ferias(): number {
    return this.contarSituacao('Férias');
  }

  licencaMedica(): number {
    return this.contarSituacao('Licença Médica/Atestado');
  }

  presentesHoje(): number {
    return Math.max(
      this.funcionarios() - this.ferias() - this.licencaMedica(),
      0
    );
  }

  aniversariantes(): number {
    return 3;
  }

  treinamentosPendentes(): number {
    return 14;
  }

  chamadosAbertos(): number {
    return 9;
  }

  totalDiasLicenca(): number {
    return this.colaboradores
      .filter(colaborador => colaborador.situacao === 'Licença Médica/Atestado')
      .reduce((total, colaborador) => total + Number(colaborador.diasLicencaMedica || 0), 0);
  }

  private contarSituacao(situacao: string): number {
    return this.colaboradores.filter(
      colaborador => colaborador.situacao === situacao
    ).length;
  }

  private normalizarEmpresa(empresa: any): EmpresaPainel {
    const { users, status, ...dadosEmpresa } = empresa;

    return {
      ...this.empresa,
      ...dadosEmpresa,
      usuarios: empresa.usuarios ?? users ?? this.empresa.usuarios,
      situacao: empresa.situacao ?? status ?? this.empresa.situacao
    };
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private chaveColaboradores(): string {
    return `colaboradores:${this.empresa.id}`;
  }

}
