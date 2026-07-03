import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';

type FiltroChamado = 'Todos' | 'Abertos' | 'Em andamento' | 'Resolvidos';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface ChamadoEmpresa {
  id: string;
  numero: string;
  titulo: string;
  categoria: string;
  prioridade: string;
  solicitante: string;
  setorSolicitante: string;
  dataAbertura: string;
  situacao: string;
  responsavel?: string;
  sla?: string;
}

@Component({
  selector: 'app-chamados',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './chamados.html',
  styleUrl: './chamados.css',
})
export class ChamadosComponent implements OnInit {
  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  filtros: FiltroChamado[] = ['Todos', 'Abertos', 'Em andamento', 'Resolvidos'];
  filtroSelecionado: FiltroChamado = 'Todos';
  chamados: ChamadoEmpresa[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarChamadosDaEmpresa();
  }

  selecionarFiltro(filtro: FiltroChamado) {
    this.filtroSelecionado = filtro;
  }

  chamadosFiltrados(): ChamadoEmpresa[] {
    return this.filtrarChamados(this.filtroSelecionado);
  }

  private filtrarChamados(filtro: FiltroChamado): ChamadoEmpresa[] {
    if (filtro === 'Todos') {
      return this.chamados;
    }

    if (filtro === 'Abertos') {
      return this.chamados.filter((chamado) =>
        ['Aberto', 'Em análise', 'Aguardando colaborador', 'Aguardando terceiro', 'Reaberto'].includes(
          chamado.situacao,
        ),
      );
    }

    if (filtro === 'Resolvidos') {
      return this.chamados.filter((chamado) => chamado.situacao === 'Resolvido');
    }

    return this.chamados.filter((chamado) => chamado.situacao === 'Em andamento');
  }

  totalPorFiltro(filtro: FiltroChamado): number {
    return this.filtrarChamados(filtro).length;
  }

  iniciais(nome: string): string {
    return (nome || '-')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
  }

  formatarData(data: string): string {
    if (!data) {
      return '-';
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return dataConvertida.toLocaleDateString('pt-BR');
  }

  classePrioridade(prioridade: string): string {
    if (['Alta', 'Urgente', 'Crítica'].includes(prioridade)) {
      return 'erro';
    }

    if (prioridade === 'Média') {
      return 'alerta';
    }

    return 'informativo';
  }

  classeSituacao(situacao: string): string {
    if (situacao === 'Resolvido') {
      return 'sucesso';
    }

    if (['Aberto', 'Reaberto'].includes(situacao)) {
      return 'alerta';
    }

    if (situacao === 'Cancelado') {
      return 'erro';
    }

    return 'informativo';
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = this.lerJson('empresaSelecionadaDashboard', null);

    if (!empresaSalva) {
      return;
    }

    this.empresaSelecionada = {
      ...this.empresaSelecionada,
      ...empresaSalva,
      logo: empresaSalva.logo || this.empresaSelecionada.logo,
    };
  }

  private carregarChamadosDaEmpresa() {
    const chamados = this.lerJson(this.chaveChamados(), []);

    this.chamados = Array.isArray(chamados)
      ? chamados.map((chamado) => this.normalizarChamado(chamado))
      : [];
  }

  private normalizarChamado(chamado: any): ChamadoEmpresa {
    return {
      id: chamado.id || chamado.numero || String(Date.now()),
      numero: chamado.numero || chamado.id || '-',
      titulo: chamado.titulo || chamado.assunto || 'Chamado sem assunto',
      categoria: chamado.categoria || chamado.setorDestino || '-',
      prioridade: chamado.prioridade || 'Média',
      solicitante: chamado.solicitante || chamado.solicitanteNome || '-',
      setorSolicitante: chamado.setorSolicitante || chamado.departamento || '-',
      dataAbertura: chamado.dataAbertura || chamado.data || '',
      situacao: chamado.situacao || chamado.status || 'Aberto',
      responsavel: chamado.responsavel || '',
      sla: chamado.sla || '-',
    };
  }

  private chaveChamados(): string {
    return 'chamados:' + this.empresaSelecionada.id;
  }

  private lerJson(chave: string, retornoPadrao: any) {
    const valor = localStorage.getItem(chave);

    if (!valor) {
      return retornoPadrao;
    }

    try {
      return JSON.parse(valor);
    } catch {
      return retornoPadrao;
    }
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
