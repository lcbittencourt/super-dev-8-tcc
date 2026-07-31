import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiPulsoService, DepartamentoApi } from '../servicos/api-pulso.service';

import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';
type SituacaoColaborador = 'Ativo' | 'Inativo' | 'Férias' | 'Licença Médica/Atestado';
type SituacaoDepartamento = 'Ativo' | 'Inativo';
type NivelColaborador =
  | 'Não se aplica'
  | 'Junior I'
  | 'Junior II'
  | 'Junior III'
  | 'Pleno I'
  | 'Pleno II'
  | 'Pleno III'
  | 'Senior I'
  | 'Senior II'
  | 'Senior III';

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  nivel: NivelColaborador;
  admissao: string;
  salario: number;
  gestor: string;
  situacao: SituacaoColaborador;
  diasLicencaMedica: number;
  foto: string;
}

interface Departamento {
  id: string;
  empresaId: string;
  nome: string;
  codigo: string;
  responsavel: string;
  centroCusto: string;
  descricao: string;
  situacao: SituacaoDepartamento;
}

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [FormsModule, AcoesTopoComponent],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css',
})
export class ColaboradoresComponent implements OnInit {
  colaboradores: Colaborador[] = [];
  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };
  tela: 'lista' | 'cadastro' = 'lista';
  visaoAdmin = false;
  termoPesquisa = '';
  filtroSituacao = 'Todos';
  filtroDepartamento = 'Todos';
  modoEdicao = false;
  apiDisponivel = false;
  departamentosCadastrados: Departamento[] = [];
  departamentoCadastro: Departamento = this.criarDepartamentoVazio();
  termoPesquisaDepartamento = '';
  filtroSituacaoDepartamento = 'Todos';
  modoEdicaoDepartamento = false;
  apiDepartamentosDisponivel = false;

  niveis: NivelColaborador[] = [
    'Não se aplica',
    'Junior I',
    'Junior II',
    'Junior III',
    'Pleno I',
    'Pleno II',
    'Pleno III',
    'Senior I',
    'Senior II',
    'Senior III',
  ];

  colaborador: Colaborador = this.criarColaboradorVazio();

  constructor(
    private api: ApiPulsoService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      this.colaboradores = [];
      return;
    }

    this.carregarEmpresaSelecionada();
    this.visaoAdmin = this.route.snapshot.queryParamMap.get('visao') === 'admin';
    this.carregarColaboradoresBanco();
    this.carregarDepartamentosBanco();
  }

  get colaboradoresFiltrados(): Colaborador[] {
    const busca = this.termoPesquisa.trim().toLowerCase();

    return this.colaboradores.filter((colaborador) => {
      const texto = [
        colaborador.nome,
        colaborador.email,
        colaborador.cargo,
        colaborador.departamento,
        colaborador.nivel,
        colaborador.gestor,
      ]
        .join(' ')
        .toLowerCase();

      const combinaPesquisa = !busca || texto.includes(busca);
      const combinaSituacao =
        this.filtroSituacao === 'Todos' || colaborador.situacao === this.filtroSituacao;
      const combinaDepartamento =
        this.filtroDepartamento === 'Todos' || colaborador.departamento === this.filtroDepartamento;

      return combinaPesquisa && combinaSituacao && combinaDepartamento;
    });
  }

  get departamentos(): string[] {
    return [
      ...new Set(this.colaboradores.map((colaborador) => colaborador.departamento).filter(Boolean)),
    ].sort();
  }

  get departamentosFiltrados(): Departamento[] {
    const busca = this.termoPesquisaDepartamento.trim().toLowerCase();

    return this.departamentosCadastrados.filter((departamento) => {
      const texto = [
        departamento.nome,
        departamento.codigo,
        departamento.responsavel,
        departamento.centroCusto,
        departamento.descricao,
        departamento.situacao,
      ]
        .join(' ')
        .toLowerCase();
      const combinaPesquisa = !busca || texto.includes(busca);
      const combinaSituacao =
        this.filtroSituacaoDepartamento === 'Todos' ||
        departamento.situacao === this.filtroSituacaoDepartamento;

      return combinaPesquisa && combinaSituacao;
    });
  }

  abrirCadastro() {
    this.modoEdicao = false;
    this.colaborador = this.criarColaboradorVazio();
    this.tela = 'cadastro';
  }

  editarColaborador(colaborador: Colaborador) {
    this.modoEdicao = true;
    this.colaborador = { ...colaborador };
    this.tela = 'cadastro';
  }

  excluirColaborador(colaborador: Colaborador) {
    const confirmar = confirm('Deseja excluir o colaborador ' + colaborador.nome + '?');

    if (!confirmar) {
      return;
    }

    if (this.apiDisponivel) {
      this.api.excluirColaborador(colaborador.id).subscribe({
        next: () => {
          this.colaboradores = this.colaboradores.filter((item) => item.id !== colaborador.id);
          this.salvarLocalmente();
        },
        error: () => alert('Não foi possível excluir no banco. Confira se a API está ligada.'),
      });
      return;
    }

    this.colaboradores = this.colaboradores.filter((item) => item.id !== colaborador.id);
    this.salvarLocalmente();
  }

  salvarColaborador() {
    const dados = {
      ...this.colaborador,
      empresaId: this.empresaSelecionada.id,
    };

    if (this.apiDisponivel) {
      const requisicao = this.modoEdicao
        ? this.api.atualizarColaborador(this.colaborador.id, dados)
        : this.api.criarColaborador(dados);

      requisicao.subscribe({
        next: (colaboradorSalvo) => {
          const colaboradorNormalizado = this.normalizarColaborador(colaboradorSalvo);

          if (this.modoEdicao) {
            this.colaboradores = this.colaboradores.map((item) =>
              item.id === colaboradorNormalizado.id ? colaboradorNormalizado : item,
            );
          } else {
            this.colaboradores = [colaboradorNormalizado, ...this.colaboradores];
          }

          this.salvarLocalmente();
          this.voltarLista();
        },
        error: () => alert('Não foi possível salvar no banco. Confira se a API está ligada.'),
      });
      return;
    }

    if (this.modoEdicao) {
      this.colaboradores = this.colaboradores.map((item) => {
        if (item.id === this.colaborador.id) {
          return { ...this.colaborador };
        }

        return item;
      });
    } else {
      this.colaboradores = [
        { ...this.colaborador, id: Date.now().toString() },
        ...this.colaboradores,
      ];
    }

    this.salvarLocalmente();
    this.voltarLista();
  }

  salvarDepartamento() {
    const nome = this.departamentoCadastro.nome.trim();

    if (!nome) {
      alert('Informe o nome do departamento.');
      return;
    }

    const departamentoParaSalvar: Departamento = {
      ...this.departamentoCadastro,
      empresaId: this.empresaSelecionada.id,
      nome,
      codigo: this.departamentoCadastro.codigo.trim() || this.gerarCodigoDepartamento(nome),
      responsavel: this.departamentoCadastro.responsavel.trim(),
      centroCusto: this.departamentoCadastro.centroCusto.trim(),
      descricao: this.departamentoCadastro.descricao.trim(),
    };

    if (this.apiDepartamentosDisponivel) {
      const requisicao = this.modoEdicaoDepartamento
        ? this.api.atualizarDepartamento(departamentoParaSalvar.id, departamentoParaSalvar)
        : this.api.criarDepartamento(departamentoParaSalvar);

      requisicao.subscribe({
        next: (departamento) => this.confirmarDepartamentoSalvo(departamento),
        error: () => this.salvarDepartamentoLocal(departamentoParaSalvar),
      });
      return;
    }

    this.salvarDepartamentoLocal(departamentoParaSalvar);
  }

  editarDepartamento(departamento: Departamento) {
    this.departamentoCadastro = { ...departamento };
    this.modoEdicaoDepartamento = true;
  }

  excluirDepartamento(departamento: Departamento) {
    const confirmar = confirm('Deseja excluir o departamento ' + departamento.nome + '?');

    if (!confirmar) {
      return;
    }

    if (this.apiDepartamentosDisponivel) {
      this.api.excluirDepartamento(departamento.id).subscribe({
        next: () => this.removerDepartamentoDaTela(departamento.id),
        error: () => this.removerDepartamentoDaTela(departamento.id),
      });
      return;
    }

    this.removerDepartamentoDaTela(departamento.id);
  }

  limparFormularioDepartamento() {
    this.departamentoCadastro = this.criarDepartamentoVazio();
    this.modoEdicaoDepartamento = false;
  }

  voltarLista() {
    this.tela = 'lista';
  }

  contarPorSituacao(situacao: SituacaoColaborador): number {
    return this.colaboradores.filter((colaborador) => colaborador.situacao === situacao).length;
  }

  contarDepartamentosPorSituacao(situacao: SituacaoDepartamento): number {
    return this.departamentosCadastrados.filter(
      (departamento) => departamento.situacao === situacao,
    ).length;
  }

  atualizarSituacao() {
    if (this.colaborador.situacao !== 'Licença Médica/Atestado') {
      this.colaborador.diasLicencaMedica = 0;
    }
  }

  formatarSalario(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  }

  formatarData(data: string): string {
    if (!data) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data));
  }

  gerarIniciais(nome: string): string {
    if (!nome) {
      return 'CO';
    }

    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase();
  }

  carregarFoto(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    if (!arquivo) {
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      this.colaborador.foto = String(leitor.result || '');
    };

    leitor.readAsDataURL(arquivo);
  }

  private carregarColaboradoresBanco() {
    this.api.listarColaboradores(this.empresaSelecionada.id).subscribe({
      next: (colaboradores) => {
        this.apiDisponivel = true;
        this.colaboradores = colaboradores.map((colaborador) =>
          this.normalizarColaborador(colaborador),
        );
        this.salvarLocalmente();
      },
      error: () => {
        this.apiDisponivel = false;
        this.carregarColaboradoresLocais();
      },
    });
  }

  private carregarDepartamentosBanco() {
    this.api.listarDepartamentos(this.empresaSelecionada.id).subscribe({
      next: (departamentos) => {
        this.apiDepartamentosDisponivel = true;
        this.departamentosCadastrados = departamentos.map((departamento) =>
          this.normalizarDepartamento(departamento),
        );
        this.salvarDepartamentosLocalmente();
      },
      error: () => {
        this.apiDepartamentosDisponivel = false;
        this.carregarDepartamentosLocais();
      },
    });
  }

  private carregarColaboradoresLocais() {
    this.migrarColaboradoresAntigos();

    const salvos = localStorage.getItem(this.chaveColaboradores());
    const colaboradores = salvos ? JSON.parse(salvos) : [];

    this.colaboradores = colaboradores.map((colaborador: Colaborador) =>
      this.normalizarColaborador(colaborador),
    );
  }

  private carregarDepartamentosLocais() {
    const salvos = localStorage.getItem(this.chaveDepartamentos());
    const departamentos = salvos ? JSON.parse(salvos) : [];

    this.departamentosCadastrados = Array.isArray(departamentos)
      ? departamentos.map((departamento) => this.normalizarDepartamento(departamento))
      : [];
  }

  private normalizarColaborador(colaborador: any): Colaborador {
    return {
      id: colaborador.id || Date.now().toString(),
      nome: colaborador.nome || '',
      email: colaborador.email || '',
      telefone: colaborador.telefone || '',
      cargo: colaborador.cargo || '',
      departamento: colaborador.departamento || '',
      nivel: colaborador.nivel || 'Não se aplica',
      admissao: colaborador.admissao || '',
      salario: Number(colaborador.salario || 0),
      gestor: colaborador.gestor || '',
      situacao: colaborador.situacao || 'Ativo',
      diasLicencaMedica: Number(colaborador.diasLicencaMedica || 0),
      foto: colaborador.foto || '',
    };
  }

  private normalizarDepartamento(departamento: any): Departamento {
    return {
      id: departamento.id || Date.now().toString(),
      empresaId: departamento.empresaId || departamento.empresa_id || this.empresaSelecionada.id,
      nome: departamento.nome || '',
      codigo: departamento.codigo || '',
      responsavel: departamento.responsavel || '',
      centroCusto: departamento.centroCusto || departamento.centro_custo || '',
      descricao: departamento.descricao || '',
      situacao: departamento.situacao === 'Inativo' ? 'Inativo' : 'Ativo',
    };
  }

  private criarColaboradorVazio(): Colaborador {
    return {
      id: '',
      nome: '',
      email: '',
      telefone: '',
      cargo: '',
      departamento: '',
      nivel: 'Não se aplica',
      admissao: '',
      salario: 0,
      gestor: '',
      situacao: 'Ativo',
      diasLicencaMedica: 0,
      foto: '',
    };
  }

  private criarDepartamentoVazio(): Departamento {
    return {
      id: Date.now().toString(),
      empresaId: this.empresaSelecionada.id,
      nome: '',
      codigo: '',
      responsavel: '',
      centroCusto: '',
      descricao: '',
      situacao: 'Ativo',
    };
  }

  private confirmarDepartamentoSalvo(departamento: DepartamentoApi) {
    const departamentoNormalizado = this.normalizarDepartamento(departamento);
    const jaExiste = this.departamentosCadastrados.some(
      (item) => item.id === departamentoNormalizado.id,
    );

    this.departamentosCadastrados = jaExiste
      ? this.departamentosCadastrados.map((item) =>
          item.id === departamentoNormalizado.id ? departamentoNormalizado : item,
        )
      : [departamentoNormalizado, ...this.departamentosCadastrados];

    this.salvarDepartamentosLocalmente();
    this.limparFormularioDepartamento();
  }

  private salvarDepartamentoLocal(departamento: Departamento) {
    const departamentoNormalizado = this.normalizarDepartamento(departamento);

    if (this.modoEdicaoDepartamento) {
      this.departamentosCadastrados = this.departamentosCadastrados.map((item) =>
        item.id === departamentoNormalizado.id ? departamentoNormalizado : item,
      );
    } else {
      this.departamentosCadastrados = [departamentoNormalizado, ...this.departamentosCadastrados];
    }

    this.salvarDepartamentosLocalmente();
    this.limparFormularioDepartamento();
  }

  private removerDepartamentoDaTela(id: string) {
    this.departamentosCadastrados = this.departamentosCadastrados.filter(
      (departamento) => departamento.id !== id,
    );
    this.salvarDepartamentosLocalmente();
    this.limparFormularioDepartamento();
  }

  private salvarLocalmente() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(this.chaveColaboradores(), JSON.stringify(this.colaboradores));
  }

  private salvarDepartamentosLocalmente() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(
      this.chaveDepartamentos(),
      JSON.stringify(this.departamentosCadastrados),
    );
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = localStorage.getItem('empresaSelecionadaDashboard');

    if (!empresaSalva) {
      return;
    }

    this.empresaSelecionada = JSON.parse(empresaSalva);
  }

  private chaveColaboradores(): string {
    return 'colaboradores:' + this.empresaSelecionada.id;
  }

  private chaveDepartamentos(): string {
    return 'departamentos:' + this.empresaSelecionada.id;
  }

  private gerarCodigoDepartamento(nome: string): string {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
  }

  private migrarColaboradoresAntigos() {
    const chaveAtual = this.chaveColaboradores();
    const colaboradoresDaEmpresa = localStorage.getItem(chaveAtual);
    const colaboradoresAntigos = localStorage.getItem('colaboradores');
    const migracaoJaExecutada = localStorage.getItem('colaboradoresMigradosPorEmpresa');

    if (colaboradoresDaEmpresa || !colaboradoresAntigos || migracaoJaExecutada) {
      return;
    }

    localStorage.setItem(chaveAtual, colaboradoresAntigos);
    localStorage.setItem('colaboradoresMigradosPorEmpresa', 'true');
  }
}
