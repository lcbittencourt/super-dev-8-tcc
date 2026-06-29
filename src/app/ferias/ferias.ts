import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type PerfilFerias = 'gestor' | 'colaborador' | '';
type SituacaoFerias = 'Pendente' | 'Aprovada' | 'Reprovada' | 'Cancelada' | 'Concluída';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface ColaboradorFerias {
  id: string;
  nome: string;
  departamento: string;
  cargo?: string;
}

interface SolicitacaoFerias {
  id: string;
  colaboradorId: string;
  colaborador: string;
  departamento: string;
  inicio: string;
  fim: string;
  dias: number;
  dataSolicitacao: string;
  situacao: SituacaoFerias;
  substituto: string;
  contato: string;
  observacaoColaborador: string;
  parecerGestor: string;
  aprovador: string;
  dataAprovacao: string;
  saldoDisponivel: number;
}

@Component({
  selector: 'app-ferias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ferias.html',
  styleUrl: './ferias.css'
})
export class FeriasComponent implements OnInit {

  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV'
  };

  perfil: PerfilFerias = '';
  mostrarEscolhaPerfil = true;
  filtroSituacao = 'Todos';
  pesquisaNome = '';
  solicitacaoSelecionada: SolicitacaoFerias | null = null;
  eventoCalendarioSelecionado: SolicitacaoFerias | null = null;

  colaboradores: ColaboradorFerias[] = [];
  solicitacoes: SolicitacaoFerias[] = [];

  novaSolicitacao = {
    inicio: '2026-09-01',
    dias: 20,
    abono: 'Não',
    substituto: 'Fulano',
    observacoes: ''
  };

  etapas = [
    { nome: 'Solicitação enviada', situacao: 'feito' },
    { nome: 'Aguardando aprovação', situacao: 'atual' },
    { nome: 'Aprovada', situacao: 'vazio' },
    { nome: 'Programada', situacao: 'vazio' },
    { nome: 'Férias iniciadas', situacao: 'vazio' },
    { nome: 'Retorno', situacao: 'vazio' }
  ];

  diasCalendario = Array.from({ length: 31 }, (_, indice) => indice + 1);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarColaboradores();
    this.carregarSolicitacoes();
  }

  escolherPerfil(perfil: PerfilFerias) {
    this.perfil = perfil;
    this.mostrarEscolhaPerfil = false;
  }

  trocarPerfil() {
    this.mostrarEscolhaPerfil = true;
  }

  solicitacoesFiltradas(): SolicitacaoFerias[] {
    const pesquisa = this.pesquisaNome.trim().toLowerCase();

    return this.solicitacoes.filter(solicitacao => {
      const combinaSituacao = this.filtroSituacao === 'Todos' || solicitacao.situacao === this.filtroSituacao;
      const combinaPesquisa = !pesquisa || solicitacao.colaborador.toLowerCase().includes(pesquisa);

      return combinaSituacao && combinaPesquisa;
    });
  }

  pendentes(): number {
    return this.solicitacoes.filter(solicitacao => solicitacao.situacao === 'Pendente').length;
  }

  colaboradoresEmFerias(): SolicitacaoFerias[] {
    return this.solicitacoes.filter(solicitacao => solicitacao.situacao === 'Aprovada' && solicitacao.inicio <= '2026-07-29');
  }

  retornamEstaSemana(): number {
    return this.solicitacoes.filter(solicitacao => solicitacao.situacao === 'Aprovada' && solicitacao.fim >= '2026-07-29').length;
  }

  proximasFerias(): SolicitacaoFerias[] {
    return this.solicitacoes.filter(solicitacao => solicitacao.situacao === 'Aprovada' && solicitacao.inicio > '2026-07-29');
  }

  eventosDoDia(dia: number): SolicitacaoFerias[] {
    return this.solicitacoes.filter(solicitacao => {
      const inicio = this.diaDaData(solicitacao.inicio);
      const fim = this.diaDaData(solicitacao.fim);

      return solicitacao.situacao === 'Aprovada' && dia >= inicio && dia <= fim;
    });
  }

  abrirSolicitacao(solicitacao: SolicitacaoFerias) {
    this.solicitacaoSelecionada = { ...solicitacao };
  }

  fecharSolicitacao() {
    this.solicitacaoSelecionada = null;
  }

  aprovarSolicitacao() {
    this.atualizarSolicitacaoSelecionada('Aprovada');
  }

  reprovarSolicitacao() {
    this.atualizarSolicitacaoSelecionada('Reprovada');
  }

  abrirEventoCalendario(solicitacao: SolicitacaoFerias) {
    this.eventoCalendarioSelecionado = solicitacao;
  }

  enviarSolicitacao() {
    const colaborador = this.colaboradores[0] || {
      id: 'colaborador-atual',
      nome: 'Colaborador',
      departamento: 'Departamento'
    };

    const nova: SolicitacaoFerias = {
      id: Date.now().toString(),
      colaboradorId: colaborador.id,
      colaborador: colaborador.nome,
      departamento: colaborador.departamento,
      inicio: this.novaSolicitacao.inicio,
      fim: this.calcularRetorno(-1),
      dias: Number(this.novaSolicitacao.dias || 0),
      dataSolicitacao: '2026-06-29',
      situacao: 'Pendente',
      substituto: this.novaSolicitacao.substituto,
      contato: 'gestor@empresa.com',
      observacaoColaborador: this.novaSolicitacao.observacoes,
      parecerGestor: '',
      aprovador: '',
      dataAprovacao: '',
      saldoDisponivel: 30
    };

    this.solicitacoes = [nova, ...this.solicitacoes];
    this.salvarSolicitacoes();
    alert('Solicitação enviada para aprovação do gestor.');
  }

  calcularRetorno(ajusteDias = 0): string {
    const data = new Date(`${this.novaSolicitacao.inicio}T00:00:00`);
    data.setDate(data.getDate() + Number(this.novaSolicitacao.dias || 0) + ajusteDias);

    return data.toISOString().slice(0, 10);
  }

  saldoRestante(): number {
    return Math.max(30 - Number(this.novaSolicitacao.dias || 0), 0);
  }

  historico(): SolicitacaoFerias[] {
    return this.solicitacoes.filter(solicitacao => solicitacao.situacao !== 'Pendente');
  }

  formatarData(data: string): string {
    if (!data) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data));
  }

  periodoCurto(solicitacao: SolicitacaoFerias): string {
    return `${this.formatarDiaMes(solicitacao.inicio)} a ${this.formatarDiaMes(solicitacao.fim)}`;
  }

  private atualizarSolicitacaoSelecionada(situacao: SituacaoFerias) {
    if (!this.solicitacaoSelecionada) {
      return;
    }

    const atualizada = {
      ...this.solicitacaoSelecionada,
      situacao,
      aprovador: 'Gestor responsável',
      dataAprovacao: '2026-06-29'
    };

    this.solicitacoes = this.solicitacoes.map(solicitacao => {
      if (solicitacao.id === atualizada.id) {
        return atualizada;
      }

      return solicitacao;
    });

    this.solicitacaoSelecionada = atualizada;
    this.salvarSolicitacoes();
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = localStorage.getItem('empresaSelecionadaDashboard');

    if (empresaSalva) {
      this.empresaSelecionada = JSON.parse(empresaSalva);
    }
  }

  private carregarColaboradores() {
    const colaboradoresSalvos = localStorage.getItem(this.chaveColaboradores());
    const colaboradores = colaboradoresSalvos ? JSON.parse(colaboradoresSalvos) : [];

    this.colaboradores = colaboradores.length
      ? colaboradores
      : this.colaboradoresPadrao();
  }

  private carregarSolicitacoes() {
    const solicitacoesSalvas = localStorage.getItem(this.chaveFerias());

    this.solicitacoes = solicitacoesSalvas
      ? JSON.parse(solicitacoesSalvas).map((solicitacao: any) => this.normalizarSolicitacao(solicitacao))
      : this.solicitacoesPadrao();

    this.salvarSolicitacoes();
  }

  private salvarSolicitacoes() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(this.chaveFerias(), JSON.stringify(this.solicitacoes));
  }

  private normalizarSolicitacao(solicitacao: any): SolicitacaoFerias {
    const { status, ...dadosSolicitacao } = solicitacao;

    return {
      ...dadosSolicitacao,
      situacao: solicitacao.situacao ?? status ?? 'Pendente'
    };
  }

  private colaboradoresPadrao(): ColaboradorFerias[] {
    const nomesPorEmpresa: Record<string, ColaboradorFerias[]> = {
      tx001: [
        { id: 'joao', nome: 'João Silva', departamento: 'Financeiro' },
        { id: 'maria', nome: 'Maria Souza', departamento: 'RH' },
        { id: 'carlos', nome: 'Carlos Mendes', departamento: 'Financeiro' }
      ],
      ml002: [
        { id: 'ana', nome: 'Ana Müller', departamento: 'Produção' },
        { id: 'bruno', nome: 'Bruno Keller', departamento: 'Manutenção' },
        { id: 'livia', nome: 'Lívia Stein', departamento: 'Qualidade' }
      ]
    };

    return nomesPorEmpresa[this.empresaSelecionada.id] || [
      { id: 'joao', nome: 'João Silva', departamento: 'Financeiro' },
      { id: 'maria', nome: 'Maria Souza', departamento: 'RH' },
      { id: 'carlos', nome: 'Carlos Mendes', departamento: 'Operações' }
    ];
  }

  private solicitacoesPadrao(): SolicitacaoFerias[] {
    const [primeiro, segundo, terceiro] = this.colaboradoresPadrao();

    return [
      {
        id: `${this.empresaSelecionada.id}-1`,
        colaboradorId: primeiro.id,
        colaborador: primeiro.nome,
        departamento: primeiro.departamento,
        inicio: '2026-09-01',
        fim: '2026-09-20',
        dias: 20,
        dataSolicitacao: '2026-07-15',
        situacao: 'Pendente',
        substituto: 'Fulano',
        contato: 'joao@empresa.com',
        observacaoColaborador: '',
        parecerGestor: '',
        aprovador: '',
        dataAprovacao: '',
        saldoDisponivel: 30
      },
      {
        id: `${this.empresaSelecionada.id}-2`,
        colaboradorId: segundo.id,
        colaborador: segundo.nome,
        departamento: segundo.departamento,
        inicio: '2026-07-05',
        fim: '2026-07-25',
        dias: 20,
        dataSolicitacao: '2026-07-10',
        situacao: 'Aprovada',
        substituto: terceiro.nome,
        contato: 'maria@empresa.com',
        observacaoColaborador: 'Viagem familiar programada.',
        parecerGestor: 'Aprovado conforme saldo disponível.',
        aprovador: 'Gestor responsável',
        dataAprovacao: '2026-07-12',
        saldoDisponivel: 30
      },
      {
        id: `${this.empresaSelecionada.id}-3`,
        colaboradorId: terceiro.id,
        colaborador: terceiro.nome,
        departamento: terceiro.departamento,
        inicio: '2026-08-03',
        fim: '2026-09-01',
        dias: 30,
        dataSolicitacao: '2026-06-20',
        situacao: 'Aprovada',
        substituto: primeiro.nome,
        contato: 'carlos@empresa.com',
        observacaoColaborador: '',
        parecerGestor: 'Escala validada.',
        aprovador: 'Gestor responsável',
        dataAprovacao: '2026-06-24',
        saldoDisponivel: 30
      }
    ];
  }

  private formatarDiaMes(data: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC'
    }).format(new Date(data));
  }

  private diaDaData(data: string): number {
    return new Date(`${data}T00:00:00`).getDate();
  }

  private chaveColaboradores(): string {
    return `colaboradores:${this.empresaSelecionada.id}`;
  }

  private chaveFerias(): string {
    return `ferias:${this.empresaSelecionada.id}`;
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

}
