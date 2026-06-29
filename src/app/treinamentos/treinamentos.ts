import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type PerfilTreinamento = 'gestor' | 'colaborador' | '';
type SituacaoCurso = 'Ativo' | 'Inativo';
type SituacaoAcompanhamento = 'Em andamento' | 'Concluído' | 'Pendente';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './treinamentos.html',
  styleUrl: './treinamentos.css'
})
export class TreinamentosComponent implements OnInit {

  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV'
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

  cursos: CursoTreinamento[] = [];
  acompanhamentos: AcompanhamentoTreinamento[] = [];
  cursosColaborador: CursoColaborador[] = [];

  cursoEmCadastro: CursoTreinamento = this.criarCursoVazio();

  certificadoResumo = {
    emitidos: 312,
    pendentes: 18,
    vencidos: 6
  };

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      this.carregarDadosPadrao();
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarDados();
  }

  escolherPerfil(perfil: PerfilTreinamento) {
    this.perfil = perfil;
    this.mostrarEscolhaPerfil = false;
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
      id: this.cursoEmCadastro.id || Date.now().toString()
    };

    const existeCurso = this.cursos.some(item => item.id === curso.id);
    this.cursos = existeCurso
      ? this.cursos.map(item => item.id === curso.id ? curso : item)
      : [curso, ...this.cursos];

    this.salvarDados();
    this.telaGestor = 'painel';
    alert('Curso salvo com sucesso.');
  }

  adicionarModulo() {
    this.cursoEmCadastro.modulos.push({
      titulo: `Módulo ${this.cursoEmCadastro.modulos.length + 1}`,
      formato: 'Vídeo',
      concluido: false
    });
  }

  adicionarPergunta() {
    this.cursoEmCadastro.perguntas.push({
      pergunta: '',
      alternativas: '',
      respostaCorreta: '',
      peso: 1
    });
  }

  cursosFiltrados(): CursoTreinamento[] {
    const pesquisa = this.pesquisaCurso.trim().toLowerCase();

    return this.cursos.filter(curso => {
      const combinaPesquisa = !pesquisa || curso.nome.toLowerCase().includes(pesquisa);
      const combinaObrigatorio = this.filtroObrigatorio === 'Todos'
        || (this.filtroObrigatorio === 'Obrigatórios' && curso.obrigatorio)
        || (this.filtroObrigatorio === 'Opcionais' && !curso.obrigatorio);
      const combinaSituacao = this.filtroSituacao === 'Todos' || curso.situacao === this.filtroSituacao;
      const combinaCategoria = this.filtroCategoria === 'Todas' || curso.categoria === this.filtroCategoria;

      return combinaPesquisa && combinaObrigatorio && combinaSituacao && combinaCategoria;
    });
  }

  categorias(): string[] {
    return [...new Set(this.cursos.map(curso => curso.categoria))].sort();
  }

  cursosObrigatorios(): number {
    return this.cursos.filter(curso => curso.obrigatorio).length;
  }

  colaboradoresEmTreinamento(): number {
    return this.acompanhamentos.filter(item => item.situacao === 'Em andamento').length;
  }

  mediaConclusao(): number {
    if (!this.acompanhamentos.length) {
      return 0;
    }

    const total = this.acompanhamentos.reduce((soma, item) => soma + item.progresso, 0);
    return Math.round(total / this.acompanhamentos.length);
  }

  cursosObrigatoriosColaborador(): number {
    return this.cursosColaborador.filter(curso => curso.obrigatorio).length;
  }

  cursosConcluidosColaborador(): number {
    return this.cursosColaborador.filter(curso => curso.progresso === 100).length;
  }

  cursosEmAndamentoColaborador(): number {
    return this.cursosColaborador.filter(curso => curso.progresso > 0 && curso.progresso < 100).length;
  }

  certificadosColaborador(): number {
    return this.cursosColaborador.filter(curso => curso.certificado).length;
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

  private carregarDados() {
    const dadosSalvos = localStorage.getItem(this.chaveTreinamentos());

    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      this.cursos = dados.cursos || [];
      this.acompanhamentos = dados.acompanhamentos || [];
      this.cursosColaborador = dados.cursosColaborador || [];
      return;
    }

    this.carregarDadosPadrao();
    this.salvarDados();
  }

  private carregarDadosPadrao() {
    this.cursos = this.cursosPadrao();
    this.acompanhamentos = this.acompanhamentosPadrao();
    this.cursosColaborador = this.cursosColaboradorPadrao();
  }

  private salvarDados() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(this.chaveTreinamentos(), JSON.stringify({
      cursos: this.cursos,
      acompanhamentos: this.acompanhamentos,
      cursosColaborador: this.cursosColaborador
    }));
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
      modulos: [
        { titulo: 'Módulo 1', formato: 'Vídeo', concluido: false },
        { titulo: 'Módulo 2', formato: 'PDF', concluido: false },
        { titulo: 'Módulo 3', formato: 'Apresentação', concluido: false },
        { titulo: 'Módulo 4', formato: 'Questionário', concluido: false },
        { titulo: 'Módulo 5', formato: 'Avaliação Final', concluido: false }
      ],
      perguntas: [
        { pergunta: '', alternativas: '', respostaCorreta: '', peso: 1 }
      ]
    };
  }

  private cursosPadrao(): CursoTreinamento[] {
    return [
      this.criarCurso('integracao', 'Integração', 'RH', '4h', true, 'Editar'),
      this.criarCurso('lgpd', 'LGPD', 'Compliance', '2h', true, 'Turmas'),
      this.criarCurso('seguranca', 'Segurança da Informação', 'TI', '3h', true, 'Relatórios'),
      this.criarCurso('lideranca', 'Liderança', 'Desenvolvimento', '8h', false, 'Editar')
    ];
  }

  private criarCurso(id: string, nome: string, categoria: string, cargaHoraria: string, obrigatorio: boolean, objetivo: string): CursoTreinamento {
    return {
      id,
      nome,
      categoria,
      descricao: `${nome} para capacitação dos colaboradores de ${this.empresaSelecionada.nome}.`,
      objetivo,
      publicoAlvo: 'Colaboradores selecionados',
      cargaHoraria,
      prazoConclusao: '30 dias',
      validadeCertificado: '12 meses',
      obrigatorio,
      situacao: 'Ativo',
      instrutor: 'Instrutor interno',
      modulos: [
        { titulo: 'Introdução', formato: 'Texto', concluido: true },
        { titulo: 'Vídeo 1', formato: 'Vídeo', concluido: true },
        { titulo: 'PDF', formato: 'PDF', concluido: true },
        { titulo: 'Questionário', formato: 'Questionário', concluido: true },
        { titulo: 'Vídeo 2', formato: 'Vídeo', concluido: false },
        { titulo: 'Avaliação Final', formato: 'Avaliação Final', concluido: false }
      ],
      perguntas: [
        {
          pergunta: 'Qual é o principal objetivo deste treinamento?',
          alternativas: 'Prevenir riscos;Cumprir rotina;Ignorar normas',
          respostaCorreta: 'Prevenir riscos',
          peso: 2
        }
      ]
    };
  }

  private acompanhamentosPadrao(): AcompanhamentoTreinamento[] {
    return [
      { colaborador: 'João', departamento: 'Financeiro', curso: 'LGPD', progresso: 85, nota: 90, situacao: 'Em andamento' },
      { colaborador: 'Maria', departamento: 'RH', curso: 'Integração', progresso: 100, nota: 98, situacao: 'Concluído' },
      { colaborador: 'Carlos', departamento: 'TI', curso: 'Segurança da Informação', progresso: 40, nota: 0, situacao: 'Em andamento' }
    ];
  }

  private cursosColaboradorPadrao(): CursoColaborador[] {
    return [
      {
        id: 'lgpd',
        nome: 'LGPD',
        categoria: 'Compliance',
        cargaHoraria: '2h',
        instrutor: 'Instrutor interno',
        validade: '12 meses',
        progresso: 75,
        nota: 90,
        certificado: false,
        obrigatorio: true,
        modulos: this.criarCurso('lgpd', 'LGPD', 'Compliance', '2h', true, 'Turmas').modulos
      },
      {
        id: 'integracao',
        nome: 'Integração',
        categoria: 'RH',
        cargaHoraria: '4h',
        instrutor: 'RH Corporativo',
        validade: 'Indeterminada',
        progresso: 100,
        nota: 98,
        certificado: true,
        obrigatorio: true,
        modulos: this.criarCurso('integracao', 'Integração', 'RH', '4h', true, 'Editar').modulos.map(modulo => ({ ...modulo, concluido: true }))
      }
    ];
  }

  private chaveTreinamentos(): string {
    return `treinamentos:${this.empresaSelecionada.id}`;
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

}
