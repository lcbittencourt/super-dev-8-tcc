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
  situacao?: string;
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
    inicio: '',
    dias: 0,
    abono: 'Não',
    substituto: '',
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

  diasCalendario = this.criarDiasCalendario();

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
    return this.solicitacoes.filter(solicitacao => solicitacao.situacao === 'Aprovada' && solicitacao.inicio <= this.dataHoje() && solicitacao.fim >= this.dataHoje());
  }

  retornamEstaSemana(): number {
    return this.solicitacoes.filter(solicitacao => solicitacao.situacao === 'Aprovada' && solicitacao.fim >= this.dataHoje() && solicitacao.fim <= this.dataDaquiSeteDias()).length;
  }

  proximasFerias(): SolicitacaoFerias[] {
    return this.solicitacoes.filter(solicitacao => solicitacao.situacao === 'Aprovada' && solicitacao.inicio > this.dataHoje());
  }

  eventosDoDia(dia: number): SolicitacaoFerias[] {
    const hoje = new Date();
    const dataDia = new Date(hoje.getFullYear(), hoje.getMonth(), dia);

    return this.solicitacoes.filter(solicitacao => {
      const inicio = new Date(`${solicitacao.inicio}T00:00:00`);
      const fim = new Date(`${solicitacao.fim}T00:00:00`);

      return solicitacao.situacao === 'Aprovada' && dataDia >= inicio && dataDia <= fim;
    });
  }

  colaboradoresCadastrados(): ColaboradorFerias[] {
    const pesquisa = this.pesquisaNome.trim().toLowerCase();

    if (!pesquisa) {
      return this.colaboradores;
    }

    return this.colaboradores.filter(colaborador => {
      const texto = [
        colaborador.nome,
        colaborador.departamento,
        colaborador.cargo,
        colaborador.situacao
      ].join(' ').toLowerCase();

      return texto.includes(pesquisa);
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
    const colaborador = this.colaboradores[0];

    if (!colaborador || !this.novaSolicitacao.inicio || Number(this.novaSolicitacao.dias || 0) <= 0) {
      alert('Informe um colaborador cadastrado, data de início e quantidade de dias.');
      return;
    }

    const nova: SolicitacaoFerias = {
      id: Date.now().toString(),
      colaboradorId: colaborador.id,
      colaborador: colaborador.nome,
      departamento: colaborador.departamento,
      inicio: this.novaSolicitacao.inicio,
      fim: this.calcularRetorno(-1),
      dias: Number(this.novaSolicitacao.dias || 0),
      dataSolicitacao: this.dataHoje(),
      situacao: 'Pendente',
      substituto: this.novaSolicitacao.substituto,
      contato: '',
      observacaoColaborador: this.novaSolicitacao.observacoes,
      parecerGestor: '',
      aprovador: '',
      dataAprovacao: '',
      saldoDisponivel: this.saldoFerias()
    };

    this.solicitacoes = [nova, ...this.solicitacoes];
    this.salvarSolicitacoes();
    alert('Solicitação enviada para aprovação do gestor.');
  }

  calcularRetorno(ajusteDias = 0): string {
    if (!this.novaSolicitacao.inicio || Number(this.novaSolicitacao.dias || 0) <= 0) {
      return '';
    }

    const data = new Date(`${this.novaSolicitacao.inicio}T00:00:00`);
    data.setDate(data.getDate() + Number(this.novaSolicitacao.dias || 0) + ajusteDias);

    return data.toISOString().slice(0, 10);
  }

  saldoFerias(): number {
    return 0;
  }

  diasVendidos(): number {
    return 0;
  }

  solicitacoesPendentesColaborador(): number {
    return this.pendentes();
  }

  saldoRestante(): number {
    return Math.max(this.saldoFerias() - Number(this.novaSolicitacao.dias || 0), 0);
  }

  diasRestantesFerias(solicitacao: SolicitacaoFerias): number {
    return this.diferencaDias(new Date(), new Date(`${solicitacao.fim}T00:00:00`));
  }

  diasParaInicio(solicitacao: SolicitacaoFerias): number {
    return this.diferencaDias(new Date(), new Date(`${solicitacao.inicio}T00:00:00`));
  }

  ultimaFeriasTexto(): string {
    const ultima = this.historico()[0];

    if (!ultima) {
      return '-';
    }

    return `${this.formatarData(ultima.inicio)} até ${this.formatarData(ultima.fim)} · ${ultima.dias} dias`;
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

  mesCalendario(): string {
    const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

    return mes.charAt(0).toUpperCase() + mes.slice(1);
  }

  private atualizarSolicitacaoSelecionada(situacao: SituacaoFerias) {
    if (!this.solicitacaoSelecionada) {
      return;
    }

    const atualizada = {
      ...this.solicitacaoSelecionada,
      situacao,
      aprovador: 'Gestor responsável',
      dataAprovacao: this.dataHoje()
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
      ? colaboradores.map((colaborador: any) => this.normalizarColaborador(colaborador))
      : this.colaboradoresPadrao();
  }

  private carregarSolicitacoes() {
    const solicitacoesSalvas = localStorage.getItem(this.chaveFerias());

    this.solicitacoes = solicitacoesSalvas
      ? JSON.parse(solicitacoesSalvas)
          .map((solicitacao: any) => this.normalizarSolicitacao(solicitacao))
          .filter((solicitacao: SolicitacaoFerias) => !this.solicitacaoDemonstracao(solicitacao))
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

  private normalizarColaborador(colaborador: any): ColaboradorFerias {
    return {
      id: colaborador.id,
      nome: colaborador.nome,
      departamento: colaborador.departamento || '-',
      cargo: colaborador.cargo || '-',
      situacao: colaborador.situacao || 'Ativo'
    };
  }

  private colaboradoresPadrao(): ColaboradorFerias[] {
    return [];
  }

  private solicitacoesPadrao(): SolicitacaoFerias[] {
    return [];
  }

  private solicitacaoDemonstracao(solicitacao: SolicitacaoFerias): boolean {
    const idsDemonstracao = [
      `${this.empresaSelecionada.id}-1`,
      `${this.empresaSelecionada.id}-2`,
      `${this.empresaSelecionada.id}-3`
    ];

    return idsDemonstracao.includes(solicitacao.id)
      && ['João Silva', 'Maria Souza', 'Carlos Mendes'].includes(solicitacao.colaborador);
  }

  private dataHoje(): string {
    return this.dataParaCampo(new Date());
  }

  private dataDaquiSeteDias(): string {
    const data = new Date();
    data.setDate(data.getDate() + 7);

    return this.dataParaCampo(data);
  }

  private criarDiasCalendario(): number[] {
    const hoje = new Date();
    const totalDias = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

    return Array.from({ length: totalDias }, (_, indice) => indice + 1);
  }

  private dataParaCampo(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }


  private diferencaDias(inicio: Date, fim: Date): number {
    const milissegundosDia = 1000 * 60 * 60 * 24;
    const diferenca = Math.ceil((fim.getTime() - inicio.getTime()) / milissegundosDia);

    return Math.max(diferenca, 0);
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
