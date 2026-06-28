import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

type SituacaoColaborador = 'Ativo' | 'Inativo' | 'Férias';
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
  foto: string;
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

  private colaboradoresPadrao: Colaborador[] = [
    {
      id: 'col001',
      nome: 'Mariana Costa',
      email: 'mariana.costa@empresa.com',
      telefone: '(11) 98888-1001',
      cargo: 'Analista de RH',
      departamento: 'Recursos Humanos',
      nivel: 'Pleno I',
      admissao: '2023-04-10',
      salario: 6200,
      gestor: 'Rafael Lima',
      situacao: 'Ativo',
      foto: ''
    },
    {
      id: 'col002',
      nome: 'Bruno Almeida',
      email: 'bruno.almeida@empresa.com',
      telefone: '(21) 97777-2040',
      cargo: 'Coordenador Financeiro',
      departamento: 'Financeiro',
      nivel: 'Senior I',
      admissao: '2021-09-02',
      salario: 9800,
      gestor: 'Carla Nunes',
      situacao: 'Férias',
      foto: ''
    },
    {
      id: 'col003',
      nome: 'Luiza Martins',
      email: 'luiza.martins@empresa.com',
      telefone: '(31) 96666-3030',
      cargo: 'Desenvolvedora Front-end',
      departamento: 'Tecnologia',
      nivel: 'Junior III',
      admissao: '2024-01-15',
      salario: 8400,
      gestor: 'Diego Rocha',
      situacao: 'Ativo',
      foto: ''
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      this.colaboradores = this.colaboradoresPadrao;
      return;
    }

    const salvos = localStorage.getItem('colaboradores');
    const colaboradores = salvos ? JSON.parse(salvos) : this.colaboradoresPadrao;

    this.colaboradores = colaboradores.map((colaborador: Colaborador) => ({
      ...colaborador,
      nivel: colaborador.nivel || 'Não se aplica'
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
      foto: ''
    };
  }

  private salvarLocalmente() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem('colaboradores', JSON.stringify(this.colaboradores));
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

}
