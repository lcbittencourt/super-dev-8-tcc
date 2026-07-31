import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';
type AbaFornecedores = 'fornecedores' | 'solicitacoes' | 'contratos';
type ModalFornecedores = 'cadastro' | 'detalhes' | 'contrato' | null;
type StatusFornecedor = 'Ativo' | 'Inativo' | 'Pendente';
type StatusSolicitacao = 'Pendente' | 'Aprovado' | 'Reprovado';
type StatusContrato = 'Vigente' | 'Vencendo' | 'Encerrado';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface Fornecedor {
  nome: string;
  razaoSocial: string;
  categoria: string;
  cnpj: string;
  cidade: string;
  telefone: string;
  email: string;
  representante: string;
  status: StatusFornecedor;
}

interface SolicitacaoFornecedor {
  data: string;
  solicitante: string;
  fornecedor: string;
  categoria: string;
  motivo: string;
  status: StatusSolicitacao;
  retorno: string;
}

interface ContratoFornecedor {
  fornecedor: string;
  categoria: string;
  inicio: string;
  termino: string;
  valorMensal: string;
  status: StatusContrato;
}

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [FormsModule, AcoesTopoComponent],
  templateUrl: './fornecedores.html',
  styleUrl: './fornecedores.css',
})
export class FornecedoresComponent implements OnInit {
  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  abaAtiva: AbaFornecedores = 'fornecedores';
  modalAberto: ModalFornecedores = null;
  termoPesquisa = '';
  filtroCategoria = 'Todas as categorias';
  filtroStatus = 'Todos os status';
  fornecedorSelecionado: Fornecedor | null = null;

  fornecedores: Fornecedor[] = [
    {
      nome: 'ABC Informática',
      razaoSocial: 'ABC Informática Ltda',
      categoria: 'TI',
      cnpj: '12.345.678/0001-90',
      cidade: 'Blumenau/SC',
      telefone: '(47) 3333-0000',
      email: 'contato@abc.com',
      representante: 'João Martins',
      status: 'Ativo',
    },
    {
      nome: 'CleanMais Serviços',
      razaoSocial: 'CleanMais Serviços Ltda',
      categoria: 'Limpeza',
      cnpj: '45.222.111/0001-10',
      cidade: 'Itajaí/SC',
      telefone: '(47) 98888-0000',
      email: 'atendimento@cleanmais.com',
      representante: 'Carla Ferreira',
      status: 'Ativo',
    },
    {
      nome: 'Jurídica Prime',
      razaoSocial: 'Jurídica Prime Consultoria Ltda',
      categoria: 'Jurídico',
      cnpj: '88.765.432/0001-44',
      cidade: 'Joinville/SC',
      telefone: '(47) 3222-9000',
      email: 'juridico@prime.com',
      representante: 'Ana Ribeiro',
      status: 'Pendente',
    },
  ];

  solicitacoes: SolicitacaoFornecedor[] = [
    {
      data: '04/07/2026',
      solicitante: 'Ana Lima',
      fornecedor: 'Jurídica Prime',
      categoria: 'Jurídico',
      motivo: 'Análise de contrato',
      status: 'Pendente',
      retorno: '',
    },
    {
      data: '03/07/2026',
      solicitante: 'Carlos Souza',
      fornecedor: 'DataCloud',
      categoria: 'TI',
      motivo: 'Serviço de hospedagem',
      status: 'Pendente',
      retorno: '',
    },
  ];

  contratos: ContratoFornecedor[] = [
    {
      fornecedor: 'ABC Informática',
      categoria: 'TI',
      inicio: '01/01/2026',
      termino: '31/12/2026',
      valorMensal: 'R$ 4.500,00',
      status: 'Vigente',
    },
    {
      fornecedor: 'CleanMais Serviços',
      categoria: 'Limpeza',
      inicio: '01/03/2026',
      termino: '30/07/2026',
      valorMensal: 'R$ 2.300,00',
      status: 'Vencendo',
    },
  ];

  categorias = [
    'Todas as categorias',
    'TI',
    'Marketing',
    'Jurídico',
    'Manutenção',
    'Limpeza',
    'RH',
    'Papelaria',
    'Mobiliário',
    'Educacional',
    'Alimentício',
  ];

  statusDisponiveis = ['Todos os status', 'Ativo', 'Inativo', 'Pendente'];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.carregarEmpresaSelecionada();
    }
  }

  get fornecedoresFiltrados(): Fornecedor[] {
    const busca = this.termoPesquisa.trim().toLowerCase();

    return this.fornecedores.filter((fornecedor) => {
      const texto = [
        fornecedor.nome,
        fornecedor.razaoSocial,
        fornecedor.categoria,
        fornecedor.cnpj,
        fornecedor.cidade,
        fornecedor.telefone,
        fornecedor.email,
      ]
        .join(' ')
        .toLowerCase();

      const combinaPesquisa = !busca || texto.includes(busca);
      const combinaCategoria =
        this.filtroCategoria === 'Todas as categorias' ||
        fornecedor.categoria === this.filtroCategoria;
      const combinaStatus =
        this.filtroStatus === 'Todos os status' || fornecedor.status === this.filtroStatus;

      return combinaPesquisa && combinaCategoria && combinaStatus;
    });
  }

  get fornecedoresAtivos(): number {
    return this.fornecedores.filter((fornecedor) => fornecedor.status === 'Ativo').length;
  }

  get solicitacoesPendentes(): number {
    return this.solicitacoes.filter((solicitacao) => solicitacao.status === 'Pendente').length;
  }

  get contratosVencendo(): number {
    return this.contratos.filter((contrato) => contrato.status === 'Vencendo').length;
  }

  get documentosPendentes(): number {
    return this.fornecedores.filter((fornecedor) => fornecedor.status === 'Pendente').length;
  }

  abrirAba(aba: AbaFornecedores) {
    this.abaAtiva = aba;
  }

  abrirCadastro() {
    this.modalAberto = 'cadastro';
  }

  abrirDetalhes(fornecedor: Fornecedor) {
    this.fornecedorSelecionado = fornecedor;
    this.modalAberto = 'detalhes';
  }

  abrirContrato() {
    this.modalAberto = 'contrato';
  }

  fecharModal() {
    this.modalAberto = null;
  }

  aprovar(solicitacao: SolicitacaoFornecedor) {
    solicitacao.status = 'Aprovado';
    solicitacao.retorno = 'Fornecedor liberado';
  }

  reprovar(solicitacao: SolicitacaoFornecedor) {
    solicitacao.status = 'Reprovado';
    solicitacao.retorno = 'Solicitação encerrada';
  }

  classeStatus(status: StatusFornecedor | StatusSolicitacao | StatusContrato): string {
    if (status === 'Ativo' || status === 'Aprovado' || status === 'Vigente') {
      return 'aprovado';
    }

    if (status === 'Pendente' || status === 'Vencendo') {
      return 'pendente';
    }

    return 'erro';
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = localStorage.getItem('empresaSelecionadaDashboard');

    if (!empresaSalva) {
      return;
    }

    this.empresaSelecionada = {
      ...this.empresaSelecionada,
      ...JSON.parse(empresaSalva),
    };
  }
}
