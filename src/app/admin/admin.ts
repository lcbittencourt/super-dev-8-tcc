import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiPulsoService, EmpresaApi, ModuloApi } from '../servicos/api-pulso.service';

interface ModuloSistema {
  id?: string;
  nome: string;
  descricao: string;
  liberado: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit {
  empresas: EmpresaApi[] = [
    {
      id: 'tx001',
      nome: 'Têxtil Vale Norte',
      cidade: 'Blumenau, SC',
      plano: 'Empresarial',
      usuarios: 0,
      modulos: 8,
      situacao: 'Ativa',
      logo: 'TV',
    },
  ];

  empresaSelecionada: EmpresaApi | null = this.empresas[0];
  pesquisaEmpresa = '';
  paginaEmpresas = 0;
  empresasPorPagina = 3;
  apiDisponivel = false;

  private modulosBase: ModuloSistema[] = [
    {
      id: 'dashboard',
      nome: 'Dashboard',
      descricao: 'Painel geral com indicadores',
      liberado: true,
    },
    {
      id: 'colaboradores',
      nome: 'Colaboradores',
      descricao: 'Cadastro e gestão de pessoas',
      liberado: true,
    },
    {
      id: 'controle-ponto',
      nome: 'Controle de ponto',
      descricao: 'Jornada, banco de horas e exceções',
      liberado: true,
    },
    {
      id: 'ferias',
      nome: 'Férias e afastamentos',
      descricao: 'Solicitações, aprovações e calendário',
      liberado: true,
    },
    {
      id: 'treinamentos',
      nome: 'Treinamentos',
      descricao: 'NRs, compliance e capacitações',
      liberado: true,
    },
    {
      id: 'chamados',
      nome: 'Chamados',
      descricao: 'TI, manutenção e atendimento interno',
      liberado: true,
    },
    {
      id: 'comunicados',
      nome: 'Comunicados',
      descricao: 'Mural e avisos corporativos',
      liberado: true,
    },
    {
      id: 'eventos',
      nome: 'Eventos',
      descricao: 'Confraternizações e datas importantes',
      liberado: true,
    },
    {
      id: 'fornecedores',
      nome: 'Fornecedores',
      descricao: 'Cadastro e contratos',
      liberado: false,
    },
    {
      id: 'relatorios',
      nome: 'Relatórios',
      descricao: 'Exportações e análises customizadas',
      liberado: true,
    },
  ];

  modulosSistema: ModuloSistema[] = this.criarModulosPadrao();

  constructor(
    private router: Router,
    private api: ApiPulsoService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    this.carregarEmpresasBanco();
  }

  selecionarEmpresa(empresa: EmpresaApi) {
    this.empresaSelecionada = empresa;
    this.carregarModulosEmpresa();
    this.salvarEmpresaSelecionada();
  }

  pesquisarEmpresa() {
    this.paginaEmpresas = 0;
    this.atualizarEmpresaSelecionada();
  }

  empresasFiltradas() {
    const pesquisa = this.pesquisaEmpresa.trim().toLowerCase();

    if (!pesquisa) {
      return this.empresas;
    }

    return this.empresas.filter((empresa) => {
      const texto = [empresa.nome, empresa.cidade, empresa.plano, empresa.situacao]
        .join(' ')
        .toLowerCase();

      return texto.includes(pesquisa);
    });
  }

  empresasVisiveis() {
    const inicio = this.paginaEmpresas * this.empresasPorPagina;
    return this.empresasFiltradas().slice(inicio, inicio + this.empresasPorPagina);
  }

  totalPaginasEmpresas() {
    return Math.max(1, Math.ceil(this.empresasFiltradas().length / this.empresasPorPagina));
  }

  voltarEmpresas() {
    if (this.paginaEmpresas === 0) {
      return;
    }

    this.paginaEmpresas--;
    this.atualizarEmpresaSelecionada();
  }

  avancarEmpresas() {
    if (this.paginaEmpresas >= this.totalPaginasEmpresas() - 1) {
      return;
    }

    this.paginaEmpresas++;
    this.atualizarEmpresaSelecionada();
  }

  editarEmpresa() {
    if (!this.empresaSelecionada) {
      return;
    }

    if (this.estaNoNavegador()) {
      localStorage.setItem('empresaEmEdicao', JSON.stringify(this.empresaSelecionada));
    }

    this.router.navigate(['/nova-empresa', this.empresaSelecionada.id]);
  }

  excluirEmpresa() {
    if (!this.empresaSelecionada) {
      return;
    }

    const empresa = this.empresaSelecionada;
    const confirmar = confirm('Deseja excluir a empresa ' + empresa.nome + '?');

    if (!confirmar) {
      return;
    }

    if (this.apiDisponivel) {
      this.api.excluirEmpresa(empresa.id).subscribe({
        next: () => this.removerEmpresaDaTela(empresa.id),
        error: () => alert('Não foi possível excluir no banco. Confira se a API está ligada.'),
      });
      return;
    }

    this.removerEmpresaDaTela(empresa.id);
  }

  alternarModulo(modulo: ModuloSistema) {
    if (modulo.liberado) {
      modulo.liberado = false;
      return;
    }

    if (this.modulosLiberados() >= this.limiteModulosEmpresa()) {
      alert(
        'O plano ' +
          this.empresaSelecionada?.plano +
          ' permite liberar somente ' +
          this.limiteModulosEmpresa() +
          ' módulo(s).',
      );
      return;
    }

    modulo.liberado = true;
  }

  salvarModulosEmpresa() {
    if (!this.estaNoNavegador() || !this.empresaSelecionada) {
      return;
    }

    if (this.apiDisponivel) {
      this.api.salvarModulosEmpresa(this.empresaSelecionada.id, this.modulosSistema).subscribe({
        next: (modulos) => {
          this.modulosSistema = modulos.map((modulo) => this.normalizarModulo(modulo));
          this.atualizarContagemModulosSelecionada();
          this.salvarEmpresaSelecionada();
          alert('Alterações salvas para ' + this.empresaSelecionada?.nome + '.');
        },
        error: (erro) => {
          const mensagem = erro?.error?.mensagem || 'Não foi possível salvar os módulos no banco.';
          alert(mensagem);
        },
      });
      return;
    }

    localStorage.setItem(this.chaveModulosEmpresa(), JSON.stringify(this.modulosSistema));
    this.atualizarContagemModulosSelecionada();
    this.salvarEmpresaSelecionada();
    alert('Alterações salvas para ' + this.empresaSelecionada.nome + '.');
  }

  modulosLiberados(): number {
    return this.modulosSistema.filter((modulo) => modulo.liberado).length;
  }

  limiteModulosEmpresa(): number {
    if (!this.empresaSelecionada) {
      return 0;
    }

    if (this.empresaSelecionada.plano === 'Inicial') {
      return 4;
    }

    if (this.empresaSelecionada.plano === 'Profissional') {
      return 7;
    }

    return this.modulosSistema.length;
  }

  moduloBloqueadoPorLimite(modulo: ModuloSistema): boolean {
    return !modulo.liberado && this.modulosLiberados() >= this.limiteModulosEmpresa();
  }

  totalUsuarios() {
    return this.empresas.reduce((total, empresa) => total + Number(empresa.usuarios || 0), 0);
  }

  mrrEstimado(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(0);
  }

  totalInadimplentes(): number {
    return this.empresas.filter((empresa) => empresa.situacao === 'Inadimplente').length;
  }

  totalAtivas() {
    return this.empresas.filter((empresa) => empresa.situacao === 'Ativa').length;
  }

  private carregarEmpresasBanco() {
    this.api.listarEmpresas().subscribe({
      next: (empresas) => {
        this.apiDisponivel = true;
        this.empresas = empresas.map((empresa) => this.normalizarEmpresa(empresa));

        if (this.empresas.length === 0) {
          this.empresas = [];
          this.empresaSelecionada = null;
          return;
        }

        this.empresaSelecionada = this.recuperarEmpresaSelecionada() || this.empresas[0];
        this.posicionarPaginaEmpresaSelecionada();
        this.carregarModulosEmpresa();
        this.salvarEmpresaSelecionada();
      },
      error: () => {
        this.apiDisponivel = false;
        this.carregarEmpresasLocais();
      },
    });
  }

  private carregarEmpresasLocais() {
    const empresasSalvas = JSON.parse(localStorage.getItem('empresas') || '[]');

    this.empresas = this.mesclarEmpresasSalvas(empresasSalvas);
    this.atualizarUsuariosEmpresasLocais();
    this.empresaSelecionada = this.recuperarEmpresaSelecionada() || this.empresas[0] || null;
    this.posicionarPaginaEmpresaSelecionada();
    this.carregarModulosEmpresa();
    this.salvarEmpresaSelecionada();
  }

  private removerEmpresaDaTela(empresaId: string) {
    this.empresas = this.empresas.filter((empresa) => empresa.id !== empresaId);

    if (this.estaNoNavegador()) {
      const empresasSalvas = JSON.parse(localStorage.getItem('empresas') || '[]');
      const empresasAtualizadas = empresasSalvas.filter((empresa: any) => empresa.id !== empresaId);
      localStorage.setItem('empresas', JSON.stringify(empresasAtualizadas));
    }

    if (this.paginaEmpresas > this.totalPaginasEmpresas() - 1) {
      this.paginaEmpresas = this.totalPaginasEmpresas() - 1;
    }

    this.empresaSelecionada = this.empresasVisiveis()[0] || this.empresas[0] || null;
    this.carregarModulosEmpresa();
    this.salvarEmpresaSelecionada();
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private atualizarUsuariosEmpresasLocais() {
    this.empresas = this.empresas.map((empresa) => ({
      ...empresa,
      usuarios: this.contarColaboradoresEmpresa(empresa.id),
    }));
  }

  private contarColaboradoresEmpresa(empresaId: string): number {
    if (!this.estaNoNavegador()) {
      return 0;
    }

    const colaboradores = JSON.parse(localStorage.getItem('colaboradores:' + empresaId) || '[]');

    return Array.isArray(colaboradores) ? colaboradores.length : 0;
  }

  private atualizarEmpresaSelecionada() {
    const visiveis = this.empresasVisiveis();
    const selecionadaEstaVisivel = visiveis.some(
      (empresa) => empresa.id === this.empresaSelecionada?.id,
    );

    if (!selecionadaEstaVisivel) {
      this.empresaSelecionada = visiveis[0] || null;
      this.carregarModulosEmpresa();
      this.salvarEmpresaSelecionada();
    }
  }

  private salvarEmpresaSelecionada() {
    if (!this.estaNoNavegador() || !this.empresaSelecionada) {
      return;
    }

    localStorage.setItem('empresaSelecionadaDashboard', JSON.stringify(this.empresaSelecionada));
  }

  private recuperarEmpresaSelecionada() {
    const empresaSalva = localStorage.getItem('empresaSelecionadaDashboard');

    if (!empresaSalva) {
      return null;
    }

    const empresa = JSON.parse(empresaSalva);

    return this.empresas.find((item) => item.id === empresa.id) || null;
  }

  private posicionarPaginaEmpresaSelecionada() {
    const indice = this.empresasFiltradas().findIndex(
      (empresa) => empresa.id === this.empresaSelecionada?.id,
    );

    if (indice < 0) {
      this.paginaEmpresas = 0;
      return;
    }

    this.paginaEmpresas = Math.floor(indice / this.empresasPorPagina);
  }

  private carregarModulosEmpresa() {
    if (!this.estaNoNavegador() || !this.empresaSelecionada) {
      this.modulosSistema = this.criarModulosPadrao();
      return;
    }

    if (this.apiDisponivel) {
      this.api.listarModulosEmpresa(this.empresaSelecionada.id).subscribe({
        next: (modulos) => {
          this.modulosSistema = modulos.map((modulo) => this.normalizarModulo(modulo));
          this.ajustarModulosAoLimite();
          this.atualizarContagemModulosSelecionada();
        },
        error: () => this.carregarModulosLocais(),
      });
      return;
    }

    this.carregarModulosLocais();
  }

  private carregarModulosLocais() {
    if (!this.empresaSelecionada) {
      return;
    }

    const modulosSalvos = localStorage.getItem(this.chaveModulosEmpresa());
    this.modulosSistema = modulosSalvos ? JSON.parse(modulosSalvos) : this.criarModulosPadrao();

    this.ajustarModulosAoLimite();
    this.atualizarContagemModulosSelecionada();
  }

  private criarModulosPadrao(): ModuloSistema[] {
    return this.modulosBase.map((modulo) => ({ ...modulo }));
  }

  private ajustarModulosAoLimite() {
    const limite = this.limiteModulosEmpresa();
    let liberados = 0;

    this.modulosSistema = this.modulosSistema.map((modulo) => {
      if (!modulo.liberado) {
        return modulo;
      }

      liberados++;

      if (liberados > limite) {
        return {
          ...modulo,
          liberado: false,
        };
      }

      return modulo;
    });
  }

  private chaveModulosEmpresa(): string {
    return 'modulos:' + this.empresaSelecionada?.id;
  }

  private atualizarContagemModulosSelecionada() {
    if (!this.empresaSelecionada) {
      return;
    }

    this.empresaSelecionada = {
      ...this.empresaSelecionada,
      modulos: this.modulosLiberados(),
    };

    this.empresas = this.empresas.map((empresa) => {
      if (empresa.id === this.empresaSelecionada?.id) {
        return {
          ...empresa,
          modulos: this.modulosLiberados(),
        };
      }

      return empresa;
    });
  }

  private mesclarEmpresasSalvas(empresasSalvas: any[]) {
    const empresasSalvasNormalizadas = empresasSalvas.map((empresa) =>
      this.normalizarEmpresa(empresa),
    );

    const empresasBaseAtualizadas = this.empresas.map((empresa) => {
      const empresaSalva = empresasSalvasNormalizadas.find((salva: any) => salva.id === empresa.id);

      return this.normalizarEmpresa(empresaSalva ? { ...empresa, ...empresaSalva } : empresa);
    });

    const idsBase = this.empresas.map((empresa) => empresa.id);
    const empresasNovas = empresasSalvasNormalizadas.filter(
      (empresa: any) => !idsBase.includes(empresa.id),
    );

    return [...empresasBaseAtualizadas, ...empresasNovas];
  }

  private normalizarEmpresa(empresa: any): EmpresaApi {
    const { users, status, ...dadosEmpresa } = empresa;

    return {
      id: dadosEmpresa.id,
      razaoSocial: dadosEmpresa.razaoSocial || dadosEmpresa.razao_social || dadosEmpresa.nome || '',
      nome: dadosEmpresa.nome || dadosEmpresa.nomeFantasia || dadosEmpresa.razaoSocial || '',
      nomeFantasia: dadosEmpresa.nomeFantasia || dadosEmpresa.nome || '',
      cnpj: dadosEmpresa.cnpj || '',
      inscricaoEstadual: dadosEmpresa.inscricaoEstadual || dadosEmpresa.inscricao_estadual || '',
      cidade: dadosEmpresa.cidade || '',
      setor: dadosEmpresa.setor || '',
      responsavel: dadosEmpresa.responsavel || '',
      email: dadosEmpresa.email || '',
      telefone: dadosEmpresa.telefone || '',
      plano: dadosEmpresa.plano || 'Profissional',
      usuarios: dadosEmpresa.usuarios ?? users ?? 0,
      modulos: dadosEmpresa.modulos ?? 0,
      situacao: dadosEmpresa.situacao ?? status ?? 'Ativa',
      logo: dadosEmpresa.logo || this.gerarLogo(dadosEmpresa.nome || ''),
    };
  }

  private normalizarModulo(modulo: ModuloApi): ModuloSistema {
    return {
      id: modulo.id,
      nome: modulo.nome,
      descricao: modulo.descricao,
      liberado: modulo.liberado,
    };
  }

  private gerarLogo(nome: string): string {
    const partes = (nome || '').split(' ').filter(Boolean).slice(0, 2);

    if (partes.length === 0) {
      return 'NE';
    }

    return partes.map((parte) => parte[0]).join('').toUpperCase();
  }
}