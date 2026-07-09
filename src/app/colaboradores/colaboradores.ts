import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiPulsoService } from '../servicos/api-pulso.service';

type SituacaoColaborador = 'Ativo' | 'Inativo' | 'Férias' | 'Licença Médica/Atestado';
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

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
  termoPesquisa = '';
  filtroSituacao = 'Todos';
  filtroDepartamento = 'Todos';
  modoEdicao = false;
  apiDisponivel = false;

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
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      this.colaboradores = [];
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarColaboradoresBanco();
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

  voltarLista() {
    this.tela = 'lista';
  }

  contarPorSituacao(situacao: SituacaoColaborador): number {
    return this.colaboradores.filter((colaborador) => colaborador.situacao === situacao).length;
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

  private carregarColaboradoresLocais() {
    this.migrarColaboradoresAntigos();

    const salvos = localStorage.getItem(this.chaveColaboradores());
    const colaboradores = salvos ? JSON.parse(salvos) : [];

    this.colaboradores = colaboradores.map((colaborador: Colaborador) =>
      this.normalizarColaborador(colaborador),
    );
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

  private salvarLocalmente() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(this.chaveColaboradores(), JSON.stringify(this.colaboradores));
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