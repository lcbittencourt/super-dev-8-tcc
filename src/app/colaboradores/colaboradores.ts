import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css'
})
export class ColaboradoresComponent implements OnInit {

  colaboradores: Colaborador[] = [];
  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV'
  };
  tela: 'lista' | 'cadastro' = 'lista';
  termoPesquisa = '';
  filtroSituacao = 'Todos';
  filtroDepartamento = 'Todos';
  modoEdicao = false;

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
    'Senior III'
  ];

  colaborador: Colaborador = this.criarColaboradorVazio();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      this.colaboradores = [];
      return;
    }

    this.carregarEmpresaSelecionada();
    this.migrarColaboradoresAntigos();

    const salvos = localStorage.getItem(this.chaveColaboradores());
    const colaboradores = salvos ? JSON.parse(salvos) : [];

    this.colaboradores = colaboradores.map((colaborador: Colaborador) => ({
      ...colaborador,
      nivel: colaborador.nivel || 'Não se aplica',
      diasLicencaMedica: colaborador.diasLicencaMedica || 0
    }));
  }

  get colaboradoresFiltrados(): Colaborador[] {
    const busca = this.termoPesquisa.trim().toLowerCase();

    return this.colaboradores.filter(colaborador => {
      const texto = [
        colaborador.nome,
        colaborador.email,
        colaborador.cargo,
        colaborador.departamento,
        colaborador.nivel,
        colaborador.gestor
      ].join(' ').toLowerCase();

      const combinaPesquisa = !busca || texto.includes(busca);
      const combinaSituacao = this.filtroSituacao === 'Todos' || colaborador.situacao === this.filtroSituacao;
      const combinaDepartamento = this.filtroDepartamento === 'Todos' || colaborador.departamento === this.filtroDepartamento;

      return combinaPesquisa && combinaSituacao && combinaDepartamento;
    });
  }

  get departamentos(): string[] {
    return [...new Set(this.colaboradores.map(colaborador => colaborador.departamento).filter(Boolean))].sort();
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
    const confirmar = confirm(`Deseja excluir o colaborador ${colaborador.nome}?`);

    if (!confirmar) {
      return;
    }

    this.colaboradores = this.colaboradores.filter(item => item.id !== colaborador.id);
    this.salvarLocalmente();
  }

  salvarColaborador() {
    if (this.modoEdicao) {
      this.colaboradores = this.colaboradores.map(item => {
        if (item.id === this.colaborador.id) {
          return { ...this.colaborador };
        }

        return item;
      });
    } else {
      this.colaboradores = [
        { ...this.colaborador, id: Date.now().toString() },
        ...this.colaboradores
      ];
    }

    this.salvarLocalmente();
    this.voltarLista();
  }

  voltarLista() {
    this.tela = 'lista';
  }

  contarPorSituacao(situacao: SituacaoColaborador): number {
    return this.colaboradores.filter(colaborador => colaborador.situacao === situacao).length;
  }

  atualizarSituacao() {
    if (this.colaborador.situacao !== 'Licença Médica/Atestado') {
      this.colaborador.diasLicencaMedica = 0;
    }
  }

  formatarSalario(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
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
      .map(parte => parte[0])
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
      foto: ''
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
    return `colaboradores:${this.empresaSelecionada.id}`;
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
