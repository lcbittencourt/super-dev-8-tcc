import { Component, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

interface ModuloSistema {
  nome: string;
  descricao: string;
  liberado: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {

  empresas = [
    {
      id: 'tx001',
      nome: 'Têxtil Vale Norte',
      cidade: 'Blumenau, SC',
      plano: 'Empresarial',
      usuarios: 0,
      modulos: 8,
      situacao: 'Ativa',
      logo: 'TV'
    }
  ];

  empresaSelecionada: any = this.empresas[0];
  pesquisaEmpresa = '';
  paginaEmpresas = 0;
  empresasPorPagina = 3;

  private empresasRemovidas = [
    'ml002',
    'cf003',
    'tc004',
    'al005',
    'pl006'
  ];

  private nomesEmpresasRemovidas = [
    'metalurgica muller',
    'metalúrgica müller',
    'confeccoes schmitt',
    'confecções schmitt',
    'tecnocampo solucoes',
    'tecnocampo soluções',
    'alimentos beira-rio',
    'plastico riedel',
    'plástico riedel',
    'plasticos riedel',
    'plásticos riedel'
  ];

  private modulosBase: ModuloSistema[] = [
    {
      nome: 'Dashboard',
      descricao: 'Painel geral com indicadores',
      liberado: true
    },
    {
      nome: 'Colaboradores',
      descricao: 'Cadastro e gestão de pessoas',
      liberado: true
    },
    {
      nome: 'Controle de ponto',
      descricao: 'Jornada, banco de horas e exceções',
      liberado: true
    },
    {
      nome: 'Férias e afastamentos',
      descricao: 'Solicitações, aprovações e calendário',
      liberado: true
    },
    {
      nome: 'Treinamentos',
      descricao: 'NRs, compliance e capacitações',
      liberado: true
    },
    {
      nome: 'Chamados',
      descricao: 'TI, manutenção e atendimento interno',
      liberado: true
    },
    {
      nome: 'Comunicados',
      descricao: 'Mural e avisos corporativos',
      liberado: true
    },
    {
      nome: 'Eventos',
      descricao: 'Confraternizações e datas importantes',
      liberado: true
    },
    {
      nome: 'Fornecedores',
      descricao: 'Cadastro e contratos',
      liberado: false
    },
    {
      nome: 'Relatórios',
      descricao: 'Exportações e análises customizadas',
      liberado: true
    }
  ];

  modulosSistema: ModuloSistema[] = this.criarModulosPadrao();

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    this.limparDadosEmpresasRemovidas();

    const empresasSalvas = JSON.parse(
      localStorage.getItem('empresas') || '[]'
    );

    this.empresas = this.mesclarEmpresasSalvas(empresasSalvas);
    this.atualizarUsuariosEmpresas();

    this.empresaSelecionada = this.recuperarEmpresaSelecionada() || this.empresas[0];
    this.posicionarPaginaEmpresaSelecionada();
    this.carregarModulosEmpresa();
    this.salvarEmpresaSelecionada();
  }

  selecionarEmpresa(empresa: any) {
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

    return this.empresas.filter(empresa => {
      const texto = [
        empresa.nome,
        empresa.cidade,
        empresa.plano,
        empresa.situacao
      ].join(' ').toLowerCase();

      return texto.includes(pesquisa);
    });
  }

  empresasVisiveis() {
    const inicio = this.paginaEmpresas * this.empresasPorPagina;
    return this.empresasFiltradas().slice(inicio, inicio + this.empresasPorPagina);
  }

  totalPaginasEmpresas() {
    return Math.max(
      1,
      Math.ceil(this.empresasFiltradas().length / this.empresasPorPagina)
    );
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
      localStorage.setItem(
        'empresaEmEdicao',
        JSON.stringify(this.empresaSelecionada)
      );
    }

    this.router.navigate(['/nova-empresa', this.empresaSelecionada.id]);
  }

  excluirEmpresa() {
    if (!this.empresaSelecionada) {
      return;
    }

    const confirmar = confirm(
      `Deseja excluir a empresa ${this.empresaSelecionada.nome}?`
    );

    if (!confirmar) {
      return;
    }

    this.empresas = this.empresas.filter(
      empresa => empresa.id !== this.empresaSelecionada.id
    );

    const empresasSalvas = this.estaNoNavegador()
      ? JSON.parse(localStorage.getItem('empresas') || '[]')
      : [];

    const empresasAtualizadas = empresasSalvas.filter(
      (empresa: any) => empresa.id !== this.empresaSelecionada.id
    );

    localStorage.setItem(
      'empresas',
      JSON.stringify(empresasAtualizadas)
    );

    if (this.paginaEmpresas > this.totalPaginasEmpresas() - 1) {
      this.paginaEmpresas = this.totalPaginasEmpresas() - 1;
    }

    this.empresaSelecionada = this.empresasVisiveis()[0] || this.empresas[0] || null;
    this.carregarModulosEmpresa();
    this.salvarEmpresaSelecionada();
  }

  alternarModulo(modulo: ModuloSistema) {
    if (modulo.liberado) {
      modulo.liberado = false;
      return;
    }

    if (this.modulosLiberados() >= this.limiteModulosEmpresa()) {
      alert(`O plano ${this.empresaSelecionada.plano} permite liberar somente ${this.limiteModulosEmpresa()} módulo(s).`);
      return;
    }

    modulo.liberado = true;
  }

  salvarModulosEmpresa() {
    if (!this.estaNoNavegador() || !this.empresaSelecionada) {
      return;
    }

    localStorage.setItem(
      this.chaveModulosEmpresa(),
      JSON.stringify(this.modulosSistema)
    );

    this.empresaSelecionada.modulos = this.modulosLiberados();
    this.empresas = this.empresas.map(empresa => {
      if (empresa.id === this.empresaSelecionada.id) {
        return {
          ...empresa,
          modulos: this.empresaSelecionada.modulos
        };
      }

      return empresa;
    });

    this.salvarEmpresaSelecionada();
    alert(`Alterações salvas para ${this.empresaSelecionada.nome}.`);
  }

  modulosLiberados(): number {
    return this.modulosSistema.filter(modulo => modulo.liberado).length;
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
    return this.empresas.reduce(
      (total, empresa) => total + empresa.usuarios,
      0
    );
  }

  mrrEstimado(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(0);
  }

  totalInadimplentes(): number {
    return this.empresas.filter(
      empresa => empresa.situacao === 'Inadimplente'
    ).length;
  }

  totalAtivas() {
    return this.empresas.filter(
      empresa => empresa.situacao === 'Ativa'
    ).length;
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private atualizarUsuariosEmpresas() {
    this.empresas = this.empresas.map(empresa => ({
      ...empresa,
      usuarios: this.contarColaboradoresEmpresa(empresa.id)
    }));
  }

  private contarColaboradoresEmpresa(empresaId: string): number {
    if (!this.estaNoNavegador()) {
      return 0;
    }

    const colaboradores = JSON.parse(
      localStorage.getItem(`colaboradores:${empresaId}`) || '[]'
    );

    return Array.isArray(colaboradores) ? colaboradores.length : 0;
  }

  private atualizarEmpresaSelecionada() {
    const visiveis = this.empresasVisiveis();
    const selecionadaEstaVisivel = visiveis.some(
      empresa => empresa.id === this.empresaSelecionada?.id
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

    localStorage.setItem(
      'empresaSelecionadaDashboard',
      JSON.stringify(this.empresaSelecionada)
    );
  }

  private recuperarEmpresaSelecionada() {
    const empresaSalva = localStorage.getItem('empresaSelecionadaDashboard');

    if (!empresaSalva) {
      return null;
    }

    const empresa = JSON.parse(empresaSalva);

    return this.empresas.find(
      item => item.id === empresa.id
    ) || null;
  }

  private posicionarPaginaEmpresaSelecionada() {
    const indice = this.empresasFiltradas().findIndex(
      empresa => empresa.id === this.empresaSelecionada?.id
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

    const modulosSalvos = localStorage.getItem(this.chaveModulosEmpresa());
    this.modulosSistema = modulosSalvos
      ? JSON.parse(modulosSalvos)
      : this.criarModulosPadrao();

    this.ajustarModulosAoLimite();
    this.empresaSelecionada.modulos = this.modulosLiberados();
    this.atualizarContagemEmpresaSelecionada();
  }

  private criarModulosPadrao(): ModuloSistema[] {
    return this.modulosBase.map(modulo => ({ ...modulo }));
  }

  private ajustarModulosAoLimite() {
    const limite = this.limiteModulosEmpresa();
    let liberados = 0;

    this.modulosSistema = this.modulosSistema.map(modulo => {
      if (!modulo.liberado) {
        return modulo;
      }

      liberados++;

      if (liberados > limite) {
        return {
          ...modulo,
          liberado: false
        };
      }

      return modulo;
    });
  }

  private chaveModulosEmpresa(): string {
    return `modulos:${this.empresaSelecionada.id}`;
  }

  private atualizarContagemEmpresaSelecionada() {
    this.empresas = this.empresas.map(empresa => {
      if (empresa.id === this.empresaSelecionada.id) {
        return {
          ...empresa,
          modulos: this.empresaSelecionada.modulos
        };
      }

      return empresa;
    });
  }

  private mesclarEmpresasSalvas(empresasSalvas: any[]) {
    const empresasSalvasNormalizadas = empresasSalvas
      .map(empresa => this.normalizarEmpresa(empresa))
      .filter(empresa => !this.empresaFoiRemovida(empresa));

    const empresasBaseAtualizadas = this.empresas.map(empresa => {
      const empresaSalva = empresasSalvasNormalizadas.find(
        (salva: any) => salva.id === empresa.id
      );

      return this.normalizarEmpresa(
        empresaSalva ? { ...empresa, ...empresaSalva } : empresa
      );
    });

    const idsBase = this.empresas.map(empresa => empresa.id);
    const empresasNovas = empresasSalvasNormalizadas.filter(
      (empresa: any) => !idsBase.includes(empresa.id)
    );

    return [
      ...empresasBaseAtualizadas,
      ...empresasNovas
    ];
  }

  private normalizarEmpresa(empresa: any) {
    const { users, status, ...dadosEmpresa } = empresa;

    return {
      ...dadosEmpresa,
      usuarios: empresa.usuarios ?? users ?? 0,
      situacao: empresa.situacao ?? status ?? 'Ativa'
    };
  }

  private limparDadosEmpresasRemovidas() {
    const empresasSalvas = JSON.parse(localStorage.getItem('empresas') || '[]')
      .filter((empresa: any) => !this.empresaFoiRemovida(empresa));

    localStorage.setItem('empresas', JSON.stringify(empresasSalvas));

    this.empresasRemovidas.forEach(id => {
      [
        'modulos',
        'colaboradores',
        'controlePonto',
        'ferias',
        'treinamentos',
        'chamados',
        'usuariosSistema'
      ].forEach(prefixo => localStorage.removeItem(`${prefixo}:${id}`));
    });

    ['empresaSelecionadaDashboard', 'empresaEmEdicao'].forEach(chave => {
      const valor = localStorage.getItem(chave);

      if (!valor) {
        return;
      }

      const empresa = JSON.parse(valor);

      if (this.empresaFoiRemovida(empresa)) {
        localStorage.removeItem(chave);
      }
    });
  }

  private empresaFoiRemovida(empresa: any): boolean {
    const id = empresa?.id;
    const nome = this.normalizarTexto(empresa?.nome || empresa?.nomeFantasia || empresa?.razaoSocial || '');

    return this.empresasRemovidas.includes(id)
      || this.nomesEmpresasRemovidas.includes(nome);
  }

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

}
