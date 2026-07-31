import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApiPulsoService,
  DepartamentoApi,
} from '../servicos/api-pulso.service';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';

type SituacaoDepartamento = 'Ativo' | 'Inativo';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
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

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [FormsModule, AcoesTopoComponent],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.css',
})
export class DepartamentosComponent implements OnInit {
  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  departamentos: Departamento[] = [];
  departamento: Departamento = this.criarDepartamentoVazio();
  termoPesquisa = '';
  filtroSituacao = 'Todos';
  modoEdicao = false;
  apiDisponivel = false;

  constructor(
    private api: ApiPulsoService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarDepartamentosBanco();
  }

  get departamentosFiltrados(): Departamento[] {
    const busca = this.termoPesquisa.trim().toLowerCase();

    return this.departamentos.filter((departamento) => {
      const texto = [
        departamento.nome,
        departamento.codigo,
        departamento.responsavel,
        departamento.centroCusto,
        departamento.situacao,
      ]
        .join(' ')
        .toLowerCase();
      const combinaPesquisa = !busca || texto.includes(busca);
      const combinaSituacao =
        this.filtroSituacao === 'Todos' || departamento.situacao === this.filtroSituacao;

      return combinaPesquisa && combinaSituacao;
    });
  }

  totalAtivos(): number {
    return this.departamentos.filter((departamento) => departamento.situacao === 'Ativo').length;
  }

  totalInativos(): number {
    return this.departamentos.filter((departamento) => departamento.situacao === 'Inativo').length;
  }

  salvarDepartamento() {
    const nome = this.departamento.nome.trim();

    if (!nome) {
      alert('Informe o nome do departamento.');
      return;
    }

    const departamentoParaSalvar: Departamento = {
      ...this.departamento,
      empresaId: this.empresaSelecionada.id,
      nome,
      codigo: this.departamento.codigo.trim() || this.gerarCodigo(nome),
      responsavel: this.departamento.responsavel.trim(),
      centroCusto: this.departamento.centroCusto.trim(),
      descricao: this.departamento.descricao.trim(),
    };

    if (this.apiDisponivel) {
      const requisicao = this.modoEdicao
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
    this.departamento = { ...departamento };
    this.modoEdicao = true;
  }

  excluirDepartamento(departamento: Departamento) {
    const confirmar = confirm('Deseja excluir o departamento ' + departamento.nome + '?');

    if (!confirmar) {
      return;
    }

    if (this.apiDisponivel) {
      this.api.excluirDepartamento(departamento.id).subscribe({
        next: () => this.removerDepartamentoDaTela(departamento.id),
        error: () => this.removerDepartamentoDaTela(departamento.id),
      });
      return;
    }

    this.removerDepartamentoDaTela(departamento.id);
  }

  limparFormulario() {
    this.departamento = this.criarDepartamentoVazio();
    this.modoEdicao = false;
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = this.lerJson('empresaSelecionadaDashboard', null);

    if (!empresaSalva) {
      return;
    }

    this.empresaSelecionada = {
      ...this.empresaSelecionada,
      ...empresaSalva,
      logo: empresaSalva.logo || this.empresaSelecionada.logo,
    };
  }

  private carregarDepartamentosBanco() {
    this.api.listarDepartamentos(this.empresaSelecionada.id).subscribe({
      next: (departamentos) => {
        this.apiDisponivel = true;
        this.departamentos = departamentos.map((departamento) =>
          this.normalizarDepartamento(departamento),
        );
        this.salvarDepartamentosLocais();
      },
      error: () => {
        this.apiDisponivel = false;
        this.carregarDepartamentosLocais();
      },
    });
  }

  private carregarDepartamentosLocais() {
    const departamentos = this.lerJson(this.chaveDepartamentos(), []);

    this.departamentos = Array.isArray(departamentos)
      ? departamentos.map((departamento) => this.normalizarDepartamento(departamento))
      : [];
  }

  private salvarDepartamentoLocal(departamento: Departamento) {
    const departamentoNormalizado = this.normalizarDepartamento(departamento);

    if (this.modoEdicao) {
      this.departamentos = this.departamentos.map((item) =>
        item.id === departamentoNormalizado.id ? departamentoNormalizado : item,
      );
    } else {
      this.departamentos = [departamentoNormalizado, ...this.departamentos];
    }

    this.salvarDepartamentosLocais();
    this.limparFormulario();
    alert('Departamento salvo para ' + this.empresaSelecionada.nome + '.');
  }

  private confirmarDepartamentoSalvo(departamento: DepartamentoApi) {
    const departamentoNormalizado = this.normalizarDepartamento(departamento);
    const jaExiste = this.departamentos.some((item) => item.id === departamentoNormalizado.id);

    this.departamentos = jaExiste
      ? this.departamentos.map((item) =>
          item.id === departamentoNormalizado.id ? departamentoNormalizado : item,
        )
      : [departamentoNormalizado, ...this.departamentos];

    this.salvarDepartamentosLocais();
    this.limparFormulario();
    alert('Departamento salvo para ' + this.empresaSelecionada.nome + '.');
  }

  private removerDepartamentoDaTela(id: string) {
    this.departamentos = this.departamentos.filter((departamento) => departamento.id !== id);
    this.salvarDepartamentosLocais();
    this.limparFormulario();
  }

  private salvarDepartamentosLocais() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(this.chaveDepartamentos(), JSON.stringify(this.departamentos));
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

  private gerarCodigo(nome: string): string {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
  }

  private chaveDepartamentos(): string {
    return 'departamentos:' + this.empresaSelecionada.id;
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

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
