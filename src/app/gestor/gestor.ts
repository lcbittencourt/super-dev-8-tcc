import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiPulsoService } from '../servicos/api-pulso.service';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';
interface EmpresaGestor {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface Indicador {
  titulo: string;
  valor: string;
  nota: string;
  tendencia: 'positiva' | 'negativa';
}

interface Resumo {
  titulo: string;
  valor: string;
  nota: string;
}

interface ModuloGestor {
  id?: string;
  nome?: string;
  liberado?: boolean;
}

interface BarraGrafico {
  rotulo: string;
  valor: string;
  percentual: number;
}

interface Aprovacao {
  id: string;
  categoria: string;
  data: string;
  solicitante: string;
  iniciais: string;
  detalhe: string;
  status: string;
  situacao: 'pendente' | 'urgente' | 'analise';
}

interface ColaboradorGestor {
  id?: string;
  nome?: string;
  departamento?: string;
  cargo?: string;
  admissao?: string;
  situacao?: string;
  diasLicencaMedica?: number;
}

interface RegistroPontoGestor {
  colaboradorId?: string;
  data?: string;
  situacao?: string;
  horasExtras?: string | number;
  bancoHoras?: string | number;
}

interface FeriasGestor {
  id?: string;
  colaborador?: string;
  departamento?: string;
  inicio?: string;
  fim?: string;
  dias?: number;
  dataSolicitacao?: string;
  situacao?: string;
}

interface ChamadoGestor {
  id?: string;
  numero?: string;
  titulo?: string;
  categoria?: string;
  prioridade?: string;
  solicitante?: string;
  setorDestino?: string;
  dataAbertura?: string;
  ultimaAtualizacao?: string;
  situacao?: string;
  status?: string;
}

interface CursoGestor {
  id?: string;
  nome?: string;
  prazoConclusao?: string;
  validadeCertificado?: string;
  situacao?: string;
}

interface AcompanhamentoGestor {
  colaborador?: string;
  departamento?: string;
  curso?: string;
  progresso?: number;
  situacao?: string;
}

interface CursoColaboradorGestor {
  nome?: string;
  validade?: string;
  progresso?: number;
  certificado?: boolean;
  cargaHoraria?: string;
}

@Component({
  selector: 'app-gestor',
  standalone: true,
  imports: [RouterLink, AcoesTopoComponent],
  templateUrl: './gestor.html',
  styleUrl: './gestor.css',
})
export class GestorComponent implements OnInit {
  gestor = 'Gestor';
  empresa: EmpresaGestor = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  menuAberto = false;
  mesAtual = '';
  textoRegistrosPonto = '0 registros';

  colaboradores: ColaboradorGestor[] = [];
  registrosPonto: RegistroPontoGestor[] = [];
  ferias: FeriasGestor[] = [];
  chamados: ChamadoGestor[] = [];
  cursos: CursoGestor[] = [];
  acompanhamentos: AcompanhamentoGestor[] = [];
  cursosColaborador: CursoColaboradorGestor[] = [];
  modulosGestor: ModuloGestor[] = [];

  indicadores: Indicador[] = [];
  resumos: Resumo[] = [];
  presencaMensal: BarraGrafico[] = [];
  chamadosPorCategoria: BarraGrafico[] = [];
  aprovacoes: Aprovacao[] = [];

  constructor(
    private api: ApiPulsoService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    this.mesAtual = this.nomeMesAtual();

    if (!this.estaNoNavegador()) {
      this.atualizarPainel();
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarModulosGestor();
    this.carregarDadosDaEmpresa();
    this.atualizarPainel();
  }

  alternarMenu() {
    this.menuAberto = !this.menuAberto;
  }

  fecharMenu() {
    this.menuAberto = false;
  }

  chamadosParaAprovacao(): ChamadoGestor[] {
    return this.chamados.filter((chamado) => this.chamadoAguardandoAprovacao(chamado));
  }

  identificarChamado(chamado: ChamadoGestor): string {
    return chamado.id || chamado.numero || chamado.titulo || '-';
  }

  aprovarChamado(chamado: ChamadoGestor) {
    this.atualizarSituacaoChamado(chamado, 'Em análise');
  }

  iniciarAtendimentoChamado(chamado: ChamadoGestor) {
    this.atualizarSituacaoChamado(chamado, 'Em andamento');
  }

  reprovarChamado(chamado: ChamadoGestor) {
    const confirmar = confirm('Deseja reprovar/cancelar este chamado?');

    if (!confirmar) {
      return;
    }

    this.atualizarSituacaoChamado(chamado, 'Cancelado');
  }

  moduloLiberado(id: string): boolean {
    if (!this.modulosGestor.length) {
      return true;
    }

    const idControle = this.normalizarIdModulo(id);
    const modulo = this.modulosGestor.find(
      (item) => this.normalizarIdModulo(item.id || item.nome || '') === idControle,
    );

    return modulo ? Boolean(modulo.liberado) : true;
  }

  iniciaisEmpresa(): string {
    return this.empresa.logo || this.iniciais(this.empresa.nome || 'Empresa');
  }

  private carregarModulosGestor() {
    this.carregarModulosGestorLocais();

    this.api.listarModulosEmpresa(this.empresa.id).subscribe({
      next: (modulos) => {
        this.modulosGestor = modulos.map((modulo) => ({
          id: modulo.id,
          nome: modulo.nome,
          liberado: modulo.liberado,
        }));
        this.salvarModulosGestorLocais();
      },
      error: () => undefined,
    });
  }

  private carregarModulosGestorLocais() {
    const modulos = this.lerJson('modulos:' + this.empresa.id, []);

    this.modulosGestor = Array.isArray(modulos) ? modulos : [];
  }

  private salvarModulosGestorLocais() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem('modulos:' + this.empresa.id, JSON.stringify(this.modulosGestor));
  }

  private normalizarIdModulo(valor: string): string {
    const texto = valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    const mapa: Record<string, string> = {
      'colaboradores e departamentos': 'colaboradores',
      departamentos: 'colaboradores',
      'controle de ponto': 'controle-ponto',
      'ferias e afastamentos': 'ferias',
      relatorios: 'relatorios',
    };

    return mapa[texto] || texto.replace(/\s+/g, '-');
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = this.lerJson('empresaSelecionadaDashboard', null);

    if (!empresaSalva) {
      return;
    }

    this.empresa = {
      ...this.empresa,
      ...empresaSalva,
      cidade: empresaSalva.cidade || this.empresa.cidade,
      logo: empresaSalva.logo || this.iniciais(empresaSalva.nome || this.empresa.nome),
    };
  }

  private carregarDadosDaEmpresa() {
    const id = this.empresa.id;
    const dadosTreinamentos = this.lerJson('treinamentos:' + id, {});

    this.colaboradores = this.lerArray('colaboradores:' + id);
    this.registrosPonto = this.lerArray('controlePonto:' + id);
    this.ferias = this.lerArray('ferias:' + id);
    this.chamados = this.lerArray('chamados:' + id);
    this.cursos = Array.isArray(dadosTreinamentos.cursos) ? dadosTreinamentos.cursos : [];
    this.acompanhamentos = Array.isArray(dadosTreinamentos.acompanhamentos)
      ? dadosTreinamentos.acompanhamentos
      : [];
    this.cursosColaborador = Array.isArray(dadosTreinamentos.cursosColaborador)
      ? dadosTreinamentos.cursosColaborador
      : [];
  }

  private atualizarPainel() {
    const totalColaboradores = this.colaboradores.length;
    const ativos = this.colaboradores.filter(
      (colaborador) => colaborador.situacao !== 'Inativo',
    ).length;
    const presentes = this.presentesHoje();
    const percentualPresenca = ativos ? Math.round((presentes / ativos) * 100) : 0;
    const chamadosAbertos = this.chamadosAbertos();
    const pendencias = this.pendenciasGestor();

    this.indicadores = [
      {
        titulo: 'Colaboradores',
        valor: String(totalColaboradores),
        nota: ativos + ' ativo(s)',
        tendencia: 'positiva',
      },
      {
        titulo: 'Presentes hoje',
        valor: String(presentes),
        nota: percentualPresenca + '% do quadro ativo',
        tendencia: 'positiva',
      },
      {
        titulo: 'Chamados abertos',
        valor: String(chamadosAbertos),
        nota: this.chamadosUrgentes() + ' urgente(s)',
        tendencia: chamadosAbertos > 0 ? 'negativa' : 'positiva',
      },
      {
        titulo: 'Pendências do gestor',
        valor: String(pendencias),
        nota: pendencias > 0 ? 'Requer ação' : 'Sem pendências',
        tendencia: pendencias > 0 ? 'negativa' : 'positiva',
      },
    ];

    this.resumos = [
      {
        titulo: 'Férias pendentes',
        valor: String(this.feriasPendentes()),
        nota: 'Solicitações aguardando aprovação',
      },
      {
        titulo: 'Treinamentos pendentes',
        valor: String(this.treinamentosPendentes()),
        nota: this.treinamentosVencendo() + ' vencendo em 30 dias',
      },
      {
        titulo: 'Horas extras (mês)',
        valor: this.horasExtrasMes() + 'h',
        nota: 'Conforme registros de ponto',
      },
      {
        titulo: 'Novos colaboradores',
        valor: String(this.novosColaboradoresMes()),
        nota: 'Admissões neste mês',
      },
    ];

    this.presencaMensal = this.criarGraficoPresenca();
    this.chamadosPorCategoria = this.criarGraficoChamados();
    this.aprovacoes = this.criarPendencias();
    this.textoRegistrosPonto = this.registrosPonto.length + ' registro(s)';
  }

  private presentesHoje(): number {
    const hoje = this.dataHoje();
    const registrosHoje = this.registrosPonto.filter((registro) => registro.data === hoje);

    if (registrosHoje.length) {
      return registrosHoje.filter((registro) => registro.situacao === 'Completo').length;
    }

    return Math.max(
      this.colaboradores.filter((colaborador) => colaborador.situacao !== 'Inativo').length -
        this.colaboradoresEmFerias() -
        this.colaboradoresLicencaMedica(),
      0,
    );
  }

  private colaboradoresEmFerias(): number {
    const hoje = this.dataHoje();
    const feriasPorSolicitacao = this.ferias
      .filter((solicitacao) => solicitacao.situacao === 'Aprovada')
      .filter(
        (solicitacao) => (solicitacao.inicio || '') <= hoje && (solicitacao.fim || '') >= hoje,
      ).length;

    const feriasPorCadastro = this.colaboradores.filter(
      (colaborador) => colaborador.situacao === 'Férias',
    ).length;

    return Math.max(feriasPorSolicitacao, feriasPorCadastro);
  }

  private colaboradoresLicencaMedica(): number {
    return this.colaboradores.filter(
      (colaborador) => colaborador.situacao === 'Licença Médica/Atestado',
    ).length;
  }

  private chamadosAbertos(): number {
    return this.chamados.filter((chamado) => this.chamadoAberto(chamado)).length;
  }

  private chamadosUrgentes(): number {
    return this.chamados.filter(
      (chamado) =>
        this.chamadoAberto(chamado) && ['Urgente', 'Crítica'].includes(chamado.prioridade || ''),
    ).length;
  }

  private pendenciasGestor(): number {
    return this.feriasPendentes() + this.treinamentosPendentes() + this.chamadosParaAprovacao().length;
  }

  private feriasPendentes(): number {
    return this.ferias.filter((solicitacao) => solicitacao.situacao === 'Pendente').length;
  }

  private treinamentosPendentes(): number {
    const acompanhamentosPendentes = this.acompanhamentos.filter(
      (item) => item.situacao === 'Pendente' || Number(item.progresso || 0) < 100,
    ).length;
    const cursosPendentes = this.cursosColaborador.filter(
      (curso) => Number(curso.progresso || 0) < 100,
    ).length;

    return acompanhamentosPendentes + cursosPendentes;
  }

  private treinamentosVencendo(): number {
    return [
      ...this.cursos.map((curso) => curso.prazoConclusao || curso.validadeCertificado || ''),
      ...this.cursosColaborador.map((curso) => curso.validade || ''),
    ].filter((data) => this.dataNosProximosDias(data, 30)).length;
  }

  private horasExtrasMes(): number {
    return this.registrosPonto
      .filter((registro) => this.dataNoMesAtual(registro.data || ''))
      .reduce(
        (total, registro) => total + this.extrairHoras(registro.horasExtras ?? registro.bancoHoras),
        0,
      );
  }

  private novosColaboradoresMes(): number {
    return this.colaboradores.filter((colaborador) =>
      this.dataNoMesAtual(colaborador.admissao || ''),
    ).length;
  }

  private criarGraficoPresenca(): BarraGrafico[] {
    const semanas = [
      { rotulo: 'Semana 1', inicio: 1, fim: 7 },
      { rotulo: 'Semana 2', inicio: 8, fim: 14 },
      { rotulo: 'Semana 3', inicio: 15, fim: 21 },
      { rotulo: 'Semana 4', inicio: 22, fim: 31 },
    ];

    return semanas.map((semana) => {
      const registros = this.registrosPonto.filter((registro) => {
        const data = this.criarData(registro.data || '');

        if (!data || !this.dataNoMesAtual(registro.data || '')) {
          return false;
        }

        const dia = data.getDate();
        return dia >= semana.inicio && dia <= semana.fim;
      });
      const completos = registros.filter((registro) => registro.situacao === 'Completo').length;
      const percentual = registros.length ? Math.round((completos / registros.length) * 100) : 0;

      return {
        rotulo: semana.rotulo,
        valor: percentual + '%',
        percentual,
      };
    });
  }

  private criarGraficoChamados(): BarraGrafico[] {
    const contagem = new Map<string, number>();

    this.chamados.forEach((chamado) => {
      const rotulo = chamado.setorDestino || chamado.categoria || 'Sem categoria';
      contagem.set(rotulo, (contagem.get(rotulo) || 0) + 1);
    });

    const itens = Array.from(contagem.entries())
      .map(([rotulo, total]) => ({ rotulo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    if (!itens.length) {
      return [{ rotulo: 'Sem chamados', valor: '0', percentual: 0 }];
    }

    const maior = Math.max(...itens.map((item) => item.total), 1);

    return itens.map((item) => ({
      rotulo: item.rotulo,
      valor: String(item.total),
      percentual: Math.round((item.total / maior) * 100),
    }));
  }

  private criarPendencias(): Aprovacao[] {
    const feriasPendentes = this.ferias
      .filter((solicitacao) => solicitacao.situacao === 'Pendente')
      .map((solicitacao) => ({
        id: solicitacao.id || '-',
        categoria: 'Férias',
        data: this.formatarData(solicitacao.dataSolicitacao || solicitacao.inicio || ''),
        solicitante: solicitacao.colaborador || '-',
        iniciais: this.iniciais(solicitacao.colaborador || 'Pessoa'),
        detalhe: (solicitacao.dias || 0) + ' dia(s)',
        status: 'Pendente',
        situacao: 'pendente' as const,
      }));

    const chamadosUrgentes = this.chamados
      .filter(
        (chamado) =>
          this.chamadoAberto(chamado) && ['Urgente', 'Crítica'].includes(chamado.prioridade || ''),
      )
      .map((chamado) => ({
        id: chamado.numero || '-',
        categoria: 'Chamado',
        data: this.formatarData(chamado.dataAbertura || ''),
        solicitante: chamado.solicitante || '-',
        iniciais: this.iniciais(chamado.solicitante || 'Pessoa'),
        detalhe: chamado.titulo || chamado.categoria || '-',
        status: chamado.prioridade || 'Urgente',
        situacao: 'urgente' as const,
      }));

    const treinamentosPendentes = this.acompanhamentos
      .filter((item) => item.situacao === 'Pendente')
      .map((item) => ({
        id: item.curso || '-',
        categoria: 'Treinamento',
        data: '-',
        solicitante: item.colaborador || '-',
        iniciais: this.iniciais(item.colaborador || 'Pessoa'),
        detalhe: item.curso || 'Treinamento pendente',
        status: 'Pendente',
        situacao: 'analise' as const,
      }));

    return [...feriasPendentes, ...chamadosUrgentes, ...treinamentosPendentes].slice(0, 8);
  }

  private chamadoAberto(chamado: ChamadoGestor): boolean {
    const situacao = chamado.situacao || chamado.status || '';
    return !['Resolvido', 'Cancelado'].includes(situacao);
  }

  private chamadoAguardandoAprovacao(chamado: ChamadoGestor): boolean {
    const situacao = chamado.situacao || chamado.status || 'Aberto';
    return ['Aberto', 'Reaberto'].includes(situacao);
  }

  private atualizarSituacaoChamado(chamado: ChamadoGestor, situacao: string) {
    const id = this.identificarChamado(chamado);

    this.chamados = this.chamados.map((item) =>
      this.identificarChamado(item) === id
        ? {
            ...item,
            situacao,
            status: situacao,
            responsavel: this.gestor,
            ultimaAtualizacao: this.dataHoje(),
          }
        : item,
    );

    this.salvarChamados();
    this.atualizarPainel();
  }

  private salvarChamados() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem('chamados:' + this.empresa.id, JSON.stringify(this.chamados));
  }

  private lerArray(chave: string): any[] {
    const valor = this.lerJson(chave, []);
    return Array.isArray(valor) ? valor : [];
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

  private dataHoje(): string {
    return this.dataParaCampo(new Date());
  }

  private dataParaCampo(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return ano + '-' + mes + '-' + dia;
  }

  private dataNoMesAtual(dataTexto: string): boolean {
    const data = this.criarData(dataTexto);
    const hoje = new Date();

    return (
      !!data && data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth()
    );
  }

  private dataNosProximosDias(dataTexto: string, dias: number): boolean {
    const data = this.criarData(dataTexto);

    if (!data) {
      return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + dias);

    return data >= hoje && data <= limite;
  }

  private criarData(dataTexto: string): Date | null {
    if (!dataTexto) {
      return null;
    }

    const data = dataTexto.includes('T') ? new Date(dataTexto) : new Date(dataTexto + 'T00:00:00');

    return Number.isNaN(data.getTime()) ? null : data;
  }

  private formatarData(dataTexto: string): string {
    const data = this.criarData(dataTexto);

    if (!data) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR').format(data);
  }

  private nomeMesAtual(): string {
    const texto = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private iniciais(nome: string): string {
    const iniciais = nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase();

    return iniciais || 'GE';
  }

  private extrairHoras(valor: string | number | undefined): number {
    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : 0;
    }

    if (!valor) {
      return 0;
    }

    const normalizado = String(valor)
      .replace(',', '.')
      .match(/\d+(\.\d+)?/);
    return normalizado ? Number(normalizado[0]) : 0;
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
