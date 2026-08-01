import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';
type PerfilTreinamento = 'gestor' | 'colaborador' | '';
type SituacaoCurso = 'Ativo' | 'Inativo';
type SituacaoAcompanhamento = 'Em andamento' | 'Concluído' | 'Pendente';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface ColaboradorTreinamento {
  id: string;
  nome: string;
  departamento: string;
  cargo?: string;
  situacao?: string;
}

interface CursoTreinamento {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  objetivo: string;
  publicoAlvo: string;
  cargaHoraria: string;
  prazoConclusao: string;
  validadeCertificado: string;
  obrigatorio: boolean;
  situacao: SituacaoCurso;
  instrutor: string;
  modulos: ModuloCurso[];
  perguntas: PerguntaAvaliacao[];
}

interface ModuloCurso {
  titulo: string;
  formato: string;
  concluido: boolean;
}

interface PerguntaAvaliacao {
  pergunta: string;
  alternativas: string;
  respostaCorreta: string;
  peso: number;
}

interface AcompanhamentoTreinamento {
  colaboradorId?: string;
  colaborador: string;
  departamento: string;
  curso: string;
  progresso: number;
  nota: number;
  situacao: SituacaoAcompanhamento;
}

interface CursoColaborador {
  id: string;
  nome: string;
  categoria: string;
  cargaHoraria: string;
  instrutor: string;
  validade: string;
  progresso: number;
  nota: number;
  certificado: boolean;
  obrigatorio: boolean;
  modulos: ModuloCurso[];
}

@Component({
  selector: 'app-treinamentos',
  standalone: true,
  imports: [FormsModule, AcoesTopoComponent],
  templateUrl: './treinamentos.html',
  styleUrl: './treinamentos.css',
})
export class TreinamentosComponent implements OnInit {
  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  perfil: PerfilTreinamento = '';
  mostrarEscolhaPerfil = true;
  telaGestor: 'painel' | 'cadastro' = 'painel';
  telaColaborador: 'meus-cursos' | 'execucao' = 'meus-cursos';
  filtroObrigatorio = 'Todos';
  filtroSituacao = 'Todos';
  filtroCategoria = 'Todas';
  pesquisaCurso = '';
  cursoSelecionado: CursoColaborador | null = null;
  feedbackAberto = false;

  colaboradores: ColaboradorTreinamento[] = [];
  cursos: CursoTreinamento[] = [];
  acompanhamentos: AcompanhamentoTreinamento[] = [];
  cursosColaborador: CursoColaborador[] = [];

  cursoEmCadastro: CursoTreinamento = this.criarCursoVazio();

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    this.aplicarPerfilDaRota();

    if (!this.estaNoNavegador()) {
      this.carregarDadosPadrao();
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarColaboradores();
    this.carregarDados();
  }

  escolherPerfil(perfil: PerfilTreinamento) {
    this.perfil = perfil;
    this.mostrarEscolhaPerfil = false;
  }

  private aplicarPerfilDaRota() {
    const perfil = this.route.snapshot.queryParamMap.get('perfil');

    if (perfil === 'gestor' || perfil === 'colaborador') {
      this.escolherPerfil(perfil);
    }
  }

  abrirNovoCurso() {
    this.cursoEmCadastro = this.criarCursoVazio();
    this.telaGestor = 'cadastro';
  }

  editarCurso(curso: CursoTreinamento) {
    this.cursoEmCadastro = JSON.parse(JSON.stringify(curso));
    this.telaGestor = 'cadastro';
  }

  salvarCurso() {
    const curso = {
      ...this.cursoEmCadastro,
      id: this.cursoEmCadastro.id || Date.now().toString(),
    };

    const existeCurso = this.cursos.some((item) => item.id === curso.id);
    this.cursos = existeCurso
      ? this.cursos.map((item) => (item.id === curso.id ? curso : item))
      : [curso, ...this.cursos];

    this.salvarDados();
    this.telaGestor = 'painel';
    alert('Curso salvo com sucesso.');
  }

  editandoCursoExistente(): boolean {
    return !!this.cursoEmCadastro.id && this.cursos.some((item) => item.id === this.cursoEmCadastro.id);
  }

  excluirCurso() {
    if (!this.editandoCursoExistente()) {
      return;
    }

    if (this.estaNoNavegador() && !confirm('Deseja realmente apagar este treinamento?')) {
      return;
    }

    this.cursos = this.cursos.filter((item) => item.id !== this.cursoEmCadastro.id);
    this.salvarDados();
    this.telaGestor = 'painel';
    alert('Treinamento apagado com sucesso.');
  }

  adicionarModulo() {
    this.cursoEmCadastro.modulos.push({
      titulo: `Módulo ${this.cursoEmCadastro.modulos.length + 1}`,
      formato: 'Vídeo',
      concluido: false,
    });
  }

  adicionarPergunta() {
    this.cursoEmCadastro.perguntas.push({
      pergunta: '',
      alternativas: '',
      respostaCorreta: '',
      peso: 0,
    });
  }

  cursosFiltrados(): CursoTreinamento[] {
    const pesquisa = this.pesquisaCurso.trim().toLowerCase();

    return this.cursos.filter((curso) => {
      const combinaPesquisa = !pesquisa || curso.nome.toLowerCase().includes(pesquisa);
      const combinaObrigatorio =
        this.filtroObrigatorio === 'Todos' ||
        (this.filtroObrigatorio === 'Obrigatórios' && curso.obrigatorio) ||
        (this.filtroObrigatorio === 'Opcionais' && !curso.obrigatorio);
      const combinaSituacao =
        this.filtroSituacao === 'Todos' || curso.situacao === this.filtroSituacao;
      const combinaCategoria =
        this.filtroCategoria === 'Todas' || curso.categoria === this.filtroCategoria;

      return combinaPesquisa && combinaObrigatorio && combinaSituacao && combinaCategoria;
    });
  }

  categorias(): string[] {
    return [...new Set(this.cursos.map((curso) => curso.categoria))].sort();
  }

  cursosObrigatorios(): number {
    return this.cursos.filter((curso) => curso.obrigatorio).length;
  }

  colaboradoresEmTreinamento(): number {
    return this.acompanhamentos.filter((item) => item.situacao === 'Em andamento').length;
  }

  colaboradoresCadastrados(): ColaboradorTreinamento[] {
    return this.colaboradores;
  }

  mediaConclusao(): number {
    if (!this.acompanhamentos.length) {
      return 0;
    }

    const total = this.acompanhamentos.reduce((soma, item) => soma + item.progresso, 0);
    return Math.round(total / this.acompanhamentos.length);
  }

  cursosObrigatoriosColaborador(): number {
    return this.cursosColaborador.filter((curso) => curso.obrigatorio).length;
  }

  cursosConcluidosColaborador(): number {
    return this.cursosColaborador.filter((curso) => curso.progresso === 100).length;
  }

  cursosEmAndamentoColaborador(): number {
    return this.cursosColaborador.filter((curso) => curso.progresso > 0 && curso.progresso < 100)
      .length;
  }

  certificadosColaborador(): number {
    return this.cursosColaborador.filter((curso) => curso.certificado).length;
  }

  certificadosEmitidos(): number {
    return this.certificadosColaborador();
  }

  certificadosPendentes(): number {
    return this.cursosColaborador.filter((curso) => !curso.certificado).length;
  }

  certificadosVencidos(): number {
    return 0;
  }

  certificadosVencendo(): number {
    return 0;
  }

  horasTreinadas(): number {
    return this.cursosColaborador
      .filter((curso) => curso.progresso === 100)
      .reduce((total, curso) => total + this.extrairHoras(curso.cargaHoraria), 0);
  }

  historicoColaborador(): CursoColaborador[] {
    return this.cursosColaborador.filter((curso) => curso.progresso === 100 || curso.certificado);
  }

  modulosConcluidos(curso: CursoColaborador): number {
    return curso.modulos.filter((modulo) => modulo.concluido).length;
  }

  totalModulos(curso: CursoColaborador): number {
    return curso.modulos.length;
  }

  totalQuestoes(curso: CursoColaborador): number {
    const cursoCompleto = this.cursos.find((item) => item.id === curso.id);
    return cursoCompleto?.perguntas.length || 0;
  }

  tempoRestanteAvaliacao(): number {
    return 0;
  }

  notaMinimaAvaliacao(): number {
    return 0;
  }

  resultadoAvaliacao(curso: CursoColaborador): string {
    if (this.totalQuestoes(curso) === 0) {
      return 'Sem avaliação cadastrada';
    }

    return curso.nota >= this.notaMinimaAvaliacao()
      ? 'Parabéns, aprovado'
      : 'Nova tentativa disponível';
  }

  abrirCurso(curso: CursoColaborador) {
    this.cursoSelecionado = curso;
    this.telaColaborador = 'execucao';
  }

  voltarMeusCursos() {
    this.telaColaborador = 'meus-cursos';
    this.cursoSelecionado = null;
  }

  baixarCertificado() {
    alert('Certificado em PDF gerado para download.');
  }

  enviarFeedback() {
    this.feedbackAberto = false;
    alert('Feedback enviado.');
  }

  barraProgresso(progresso: number): string {
    const preenchidos = Math.round(progresso / 10);
    return '■'.repeat(preenchidos) + '□'.repeat(10 - preenchidos);
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

  private carregarDados() {
    const dadosSalvos = localStorage.getItem(this.chaveTreinamentos());

    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      this.cursos = (dados.cursos || []).filter(
        (curso: CursoTreinamento) => !this.cursoDemonstracao(curso),
      );
      this.acompanhamentos = this.sincronizarAcompanhamentos(dados.acompanhamentos || []);
      this.cursosColaborador = (dados.cursosColaborador || []).filter(
        (curso: CursoColaborador) => !this.cursoColaboradorDemonstracao(curso),
      );
      this.salvarDados();
      return;
    }

    this.carregarDadosPadrao();
    this.salvarDados();
  }

  private carregarDadosPadrao() {
    this.cursos = this.cursosPadrao();
    this.acompanhamentos = this.sincronizarAcompanhamentos(this.acompanhamentosPadrao());
    this.cursosColaborador = this.cursosColaboradorPadrao();
  }

  private sincronizarAcompanhamentos(
    acompanhamentos: AcompanhamentoTreinamento[],
  ): AcompanhamentoTreinamento[] {
    return acompanhamentos
      .filter((item) => !this.acompanhamentoDemonstracao(item))
      .filter((item) => this.cursos.some((curso) => curso.nome === item.curso))
      .map((item) => {
        const colaborador = this.colaboradores.find(
          (pessoa) => pessoa.id === item.colaboradorId || pessoa.nome === item.colaborador,
        );

        return colaborador
          ? {
              ...item,
              colaboradorId: colaborador.id,
              colaborador: colaborador.nome,
              departamento: colaborador.departamento,
            }
          : item;
      });
  }

  private salvarDados() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(
      this.chaveTreinamentos(),
      JSON.stringify({
        cursos: this.cursos,
        acompanhamentos: this.acompanhamentos,
        cursosColaborador: this.cursosColaborador,
      }),
    );
  }

  private criarCursoVazio(): CursoTreinamento {
    return {
      id: '',
      nome: '',
      categoria: '',
      descricao: '',
      objetivo: '',
      publicoAlvo: '',
      cargaHoraria: '',
      prazoConclusao: '',
      validadeCertificado: '',
      obrigatorio: true,
      situacao: 'Ativo',
      instrutor: '',
      modulos: [],
      perguntas: [],
    };
  }

  private cursosPadrao(): CursoTreinamento[] {
    return [];
  }

  private criarCurso(
    id: string,
    nome: string,
    categoria: string,
    cargaHoraria: string,
    obrigatorio: boolean,
    objetivo: string,
  ): CursoTreinamento {
    return {
      id,
      nome,
      categoria,
      descricao: `${nome} para capacitação dos colaboradores de ${this.empresaSelecionada.nome}.`,
      objetivo,
      publicoAlvo: 'Colaboradores selecionados',
      cargaHoraria,
      prazoConclusao: '',
      validadeCertificado: '',
      obrigatorio,
      situacao: 'Ativo',
      instrutor: 'Instrutor interno',
      modulos: [
        { titulo: 'Introdução', formato: 'Texto', concluido: true },
        { titulo: 'Vídeo 1', formato: 'Vídeo', concluido: true },
        { titulo: 'PDF', formato: 'PDF', concluido: true },
        { titulo: 'Questionário', formato: 'Questionário', concluido: true },
        { titulo: 'Vídeo 2', formato: 'Vídeo', concluido: false },
        { titulo: 'Avaliação Final', formato: 'Avaliação Final', concluido: false },
      ],
      perguntas: [
        {
          pergunta: 'Qual é o principal objetivo deste treinamento?',
          alternativas: 'Prevenir riscos;Cumprir rotina;Ignorar normas',
          respostaCorreta: 'Prevenir riscos',
          peso: 0,
        },
      ],
    };
  }

  private acompanhamentosPadrao(): AcompanhamentoTreinamento[] {
    return [];
  }

  private cursosColaboradorPadrao(): CursoColaborador[] {
    return [];
  }

  private cursoDemonstracao(curso: CursoTreinamento): boolean {
    return ['integracao', 'lgpd', 'seguranca', 'lideranca'].includes(curso.id);
  }

  private cursoColaboradorDemonstracao(curso: CursoColaborador): boolean {
    return ['integracao', 'lgpd'].includes(curso.id);
  }

  private acompanhamentoDemonstracao(item: AcompanhamentoTreinamento): boolean {
    return (
      !item.colaboradorId &&
      ['João', 'Maria', 'Carlos'].includes(item.colaborador) &&
      ['LGPD', 'Integração', 'Segurança da Informação'].includes(item.curso)
    );
  }

  private extrairHoras(cargaHoraria: string): number {
    const horas = Number(String(cargaHoraria || '').replace(/[^0-9]/g, ''));
    return Number.isFinite(horas) ? horas : 0;
  }

  private normalizarColaborador(colaborador: any): ColaboradorTreinamento {
    return {
      id: colaborador.id,
      nome: colaborador.nome,
      departamento: colaborador.departamento || '-',
      cargo: colaborador.cargo || '-',
      situacao: colaborador.situacao || 'Ativo',
    };
  }

  private colaboradoresPadrao(): ColaboradorTreinamento[] {
    return [];
  }

  private chaveColaboradores(): string {
    return `colaboradores:${this.empresaSelecionada.id}`;
  }

  private chaveTreinamentos(): string {
    return `treinamentos:${this.empresaSelecionada.id}`;
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
