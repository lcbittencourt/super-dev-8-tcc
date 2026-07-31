import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';

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

interface PeriodoFerias {
  inicio: string;
  dias: number;
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
  fracionada?: boolean;
  periodos?: PeriodoFerias[];
  abonoPecuniario?: boolean;
  diasAbono?: number;
}

interface DiaCalendario {
  data: string;
  dia: number;
  pertenceAoMes: boolean;
  ehHoje: boolean;
}

@Component({
  selector: 'app-ferias',
  standalone: true,
  imports: [CommonModule, FormsModule, AcoesTopoComponent],
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
    fracionar: 'Não',
    abono: 'Não',
    diasAbono: 0,
    periodos: [
      { inicio: '', dias: 14 },
      { inicio: '', dias: 5 }
    ] as PeriodoFerias[],
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

  mesesCalendario = [
    { valor: 0, nome: 'Janeiro' },
    { valor: 1, nome: 'Fevereiro' },
    { valor: 2, nome: 'Março' },
    { valor: 3, nome: 'Abril' },
    { valor: 4, nome: 'Maio' },
    { valor: 5, nome: 'Junho' },
    { valor: 6, nome: 'Julho' },
    { valor: 7, nome: 'Agosto' },
    { valor: 8, nome: 'Setembro' },
    { valor: 9, nome: 'Outubro' },
    { valor: 10, nome: 'Novembro' },
    { valor: 11, nome: 'Dezembro' }
  ];
  anosCalendario = this.criarAnosCalendario();
  diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  mesSelecionado = new Date().getMonth();
  anoSelecionado = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    this.aplicarPerfilDaRota();

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

  private aplicarPerfilDaRota() {
    const perfil = this.route.snapshot.queryParamMap.get('perfil');

    if (perfil === 'gestor' || perfil === 'colaborador') {
      this.escolherPerfil(perfil);
    }
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

  eventosDoDia(diaCalendario: DiaCalendario): SolicitacaoFerias[] {
    const dataDia = new Date(`${diaCalendario.data}T00:00:00`);

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
    const erros = this.validarRegrasSolicitacao();

    if (!colaborador) {
      alert('Informe um colaborador cadastrado.');
      return;
    }

    if (erros.length > 0) {
      alert(erros.join('\n'));
      return;
    }

    const periodos = this.periodosSolicitacaoValidos();
    const primeiroPeriodo = periodos[0];

    const nova: SolicitacaoFerias = {
      id: Date.now().toString(),
      colaboradorId: colaborador.id,
      colaborador: colaborador.nome,
      departamento: colaborador.departamento,
      inicio: primeiroPeriodo.inicio,
      fim: this.calcularFimPeriodo(primeiroPeriodo, -1),
      dias: this.totalDiasFeriasSolicitados(),
      dataSolicitacao: this.dataHoje(),
      situacao: 'Pendente',
      substituto: this.novaSolicitacao.substituto,
      contato: '',
      observacaoColaborador: this.novaSolicitacao.observacoes,
      parecerGestor: '',
      aprovador: '',
      dataAprovacao: '',
      saldoDisponivel: this.saldoFerias(),
      fracionada: this.novaSolicitacao.fracionar === 'Sim',
      periodos,
      abonoPecuniario: this.novaSolicitacao.abono === 'Sim',
      diasAbono: this.diasAbonoSelecionados()
    };

    this.solicitacoes = [nova, ...this.solicitacoes];
    this.salvarSolicitacoes();
    alert('Solicitação enviada para aprovação do gestor.');
  }

  calcularRetorno(ajusteDias = 0): string {
    if (this.novaSolicitacao.fracionar === 'Sim') {
      const periodos = this.periodosSolicitacaoValidos();
      const ultimo = periodos[periodos.length - 1];

      return ultimo ? this.calcularFimPeriodo(ultimo, ajusteDias) : '';
    }

    if (!this.novaSolicitacao.inicio || Number(this.novaSolicitacao.dias || 0) <= 0) {
      return '';
    }

    const data = new Date(`${this.novaSolicitacao.inicio}T00:00:00`);
    data.setDate(data.getDate() + Number(this.novaSolicitacao.dias || 0) + ajusteDias);

    return data.toISOString().slice(0, 10);
  }

  saldoFerias(): number {
    return 30;
  }

  diasVendidos(): number {
    return this.solicitacoes
      .filter(solicitacao => solicitacao.abonoPecuniario && solicitacao.situacao !== 'Cancelada')
      .reduce((total, solicitacao) => total + Number(solicitacao.diasAbono || 0), 0);
  }

  solicitacoesPendentesColaborador(): number {
    return this.pendentes();
  }

  saldoRestante(): number {
    return Math.max(
      this.saldoFerias() - this.totalDiasFeriasSolicitados() - this.diasAbonoSelecionados(),
      0
    );
  }

  totalDiasFeriasSolicitados(): number {
    return this.periodosSolicitacaoValidos().reduce(
      (total, periodo) => total + Number(periodo.dias || 0),
      0
    );
  }

  diasAbonoSelecionados(): number {
    return this.novaSolicitacao.abono === 'Sim'
      ? Number(this.novaSolicitacao.diasAbono || 0)
      : 0;
  }

  maximoAbono(): number {
    return Math.min(10, Math.floor(this.saldoFerias() / 3));
  }

  periodoDescricao(): string {
    const periodos = this.periodosSolicitacaoValidos();

    if (periodos.length === 0) {
      return '-';
    }

    return periodos
      .map((periodo, indice) => 'Período ' + (indice + 1) + ': ' + this.formatarData(periodo.inicio) + ' · ' + periodo.dias + ' dias')
      .join(' | ');
  }

  atualizarFracionamento() {
    if (this.novaSolicitacao.fracionar === 'Não') {
      this.novaSolicitacao.periodos = [
        { inicio: this.novaSolicitacao.inicio, dias: Number(this.novaSolicitacao.dias || 0) }
      ];
      return;
    }

    if (this.novaSolicitacao.periodos.length === 0) {
      this.novaSolicitacao.periodos = [{ inicio: '', dias: 14 }, { inicio: '', dias: 5 }];
    }
  }

  adicionarPeriodoFerias() {
    if (this.novaSolicitacao.periodos.length >= 3) {
      alert('As férias podem ser fracionadas em no máximo 3 períodos.');
      return;
    }

    this.novaSolicitacao.periodos.push({ inicio: '', dias: 5 });
  }

  removerPeriodoFerias(indice: number) {
    if (this.novaSolicitacao.periodos.length <= 1) {
      return;
    }

    this.novaSolicitacao.periodos.splice(indice, 1);
  }

  validarRegrasSolicitacao(): string[] {
    const erros: string[] = [];
    const periodos = this.periodosSolicitacaoValidos();
    const totalDias = this.totalDiasFeriasSolicitados();
    const diasAbono = this.diasAbonoSelecionados();

    if (periodos.length === 0 || totalDias <= 0) {
      erros.push('Informe ao menos um período de férias.');
    }

    if (this.novaSolicitacao.fracionar === 'Sim') {
      if (periodos.length > 3) {
        erros.push('As férias fracionadas podem ter no máximo 3 períodos.');
      }

      if (!periodos.some(periodo => Number(periodo.dias || 0) >= 14)) {
        erros.push('Nas férias fracionadas, um dos períodos precisa ter pelo menos 14 dias.');
      }

      if (periodos.some(periodo => Number(periodo.dias || 0) < 5)) {
        erros.push('Nas férias fracionadas, os demais períodos precisam ter pelo menos 5 dias.');
      }
    }

    if (diasAbono > this.maximoAbono()) {
      erros.push('O abono pecuniário pode ser de no máximo ' + this.maximoAbono() + ' dias.');
    }

    if (totalDias + diasAbono > this.saldoFerias()) {
      erros.push('A soma de férias e abono não pode ultrapassar o saldo disponível.');
    }

    return erros;
  }

  regrasFerias(): string[] {
    return [
      'Férias fracionadas: até 3 períodos.',
      'Um período deve ter no mínimo 14 dias.',
      'Os demais períodos devem ter no mínimo 5 dias.',
      'Abono pecuniário: venda de até 1/3 do saldo, limitado a ' + this.maximoAbono() + ' dias.'
    ];
  }

  calcularFimPeriodo(periodo: PeriodoFerias, ajusteDias = 0): string {
    if (!periodo.inicio || Number(periodo.dias || 0) <= 0) {
      return '';
    }

    const data = new Date(periodo.inicio + 'T00:00:00');
    data.setDate(data.getDate() + Number(periodo.dias || 0) + ajusteDias);

    return data.toISOString().slice(0, 10);
  }

  private periodosSolicitacaoValidos(): PeriodoFerias[] {
    if (this.novaSolicitacao.fracionar === 'Não') {
      return this.novaSolicitacao.inicio && Number(this.novaSolicitacao.dias || 0) > 0
        ? [{ inicio: this.novaSolicitacao.inicio, dias: Number(this.novaSolicitacao.dias || 0) }]
        : [];
    }

    return this.novaSolicitacao.periodos
      .filter(periodo => periodo.inicio && Number(periodo.dias || 0) > 0)
      .map(periodo => ({ inicio: periodo.inicio, dias: Number(periodo.dias || 0) }));
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
    const data = new Date(this.anoSelecionado, this.mesSelecionado, 1);
    const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(data);
    const nomeMes = mes.charAt(0).toUpperCase() + mes.slice(1);

    return `${nomeMes} de ${this.anoSelecionado}`;
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

  diasCalendario(): DiaCalendario[] {
    const primeiroDiaMes = new Date(this.anoSelecionado, this.mesSelecionado, 1);
    const ultimoDiaMes = new Date(this.anoSelecionado, this.mesSelecionado + 1, 0);
    const primeiroDiaSemana = primeiroDiaMes.getDay();
    const totalDiasMes = ultimoDiaMes.getDate();
    const totalCelulas = Math.ceil((primeiroDiaSemana + totalDiasMes) / 7) * 7;
    const dataInicial = new Date(this.anoSelecionado, this.mesSelecionado, 1 - primeiroDiaSemana);
    const hoje = this.dataHoje();

    return Array.from({ length: totalCelulas }, (_, indice) => {
      const data = new Date(dataInicial);
      data.setDate(dataInicial.getDate() + indice);
      const dataCampo = this.dataParaCampo(data);

      return {
        data: dataCampo,
        dia: data.getDate(),
        pertenceAoMes: data.getMonth() === this.mesSelecionado,
        ehHoje: dataCampo === hoje
      };
    });
  }

  mesAnterior() {
    if (this.mesSelecionado === 0) {
      this.mesSelecionado = 11;
      this.anoSelecionado -= 1;
      return;
    }

    this.mesSelecionado -= 1;
  }

  proximoMes() {
    if (this.mesSelecionado === 11) {
      this.mesSelecionado = 0;
      this.anoSelecionado += 1;
      return;
    }

    this.mesSelecionado += 1;
  }

  alterarMesCalendario(mes: number | string) {
    this.mesSelecionado = Number(mes);
  }

  alterarAnoCalendario(ano: number | string) {
    this.anoSelecionado = Number(ano);
  }

  private criarAnosCalendario(): number[] {
    const anoAtual = new Date().getFullYear();

    return Array.from({ length: 11 }, (_, indice) => anoAtual - 5 + indice);
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
