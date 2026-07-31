import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiPulsoService, EmpresaApi } from '../../servicos/api-pulso.service';
import { AcoesTopoComponent } from '../../acoes-topo/acoes-topo';

@Component({
  selector: 'app-nova-empresa',
  standalone: true,
  imports: [RouterLink, FormsModule, AcoesTopoComponent],
  templateUrl: './nova-empresa.html',
  styleUrl: './nova-empresa.css',
})
export class NovaEmpresaComponent implements OnInit {
  planoSelecionado = 'Profissional';
  modoEdicao = false;
  idEdicao = '';
  empresaOriginal: EmpresaApi | null = null;
  etapaAtual = 1;

  etapasCadastro = [
    { numero: 1, titulo: 'Dados' },
    { numero: 2, titulo: 'Plano' },
    { numero: 3, titulo: 'Responsável' },
    { numero: 4, titulo: 'Revisão' },
  ];

  passoAtual = 1;
  totalPassos = 3;

  passos = [
    { numero: 1, titulo: 'Responsável técnico', descricao: 'Contato principal' },
    { numero: 2, titulo: 'Dados da empresa', descricao: 'Informações cadastrais' },
    { numero: 3, titulo: 'Plano e contrato', descricao: 'Escolha do plano' },
  ];

  empresa = {
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    cidade: '',
    setor: '',
    responsavel: '',
    email: '',
    telefone: '',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiPulsoService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.modoEdicao = true;
    this.idEdicao = id;

    if (!this.estaNoNavegador()) {
      return;
    }

    this.api.obterEmpresa(id).subscribe({
      next: (empresa) => this.preencherFormulario(empresa),
      error: () => this.carregarEmpresaLocal(id),
    });
  }

  selecionarPlano(plano: string) {
    this.planoSelecionado = plano;
  }

  irParaEtapa(etapa: number) {
    if (etapa < this.etapaAtual || this.podeAvancarEtapa()) {
      this.etapaAtual = etapa;
    }
  }

  avancarEtapa() {
    if (!this.podeAvancarEtapa()) {
      alert(this.mensagemEtapa());
      return;
    }

    this.etapaAtual = Math.min(this.etapaAtual + 1, this.etapasCadastro.length);
  }

  voltarEtapa() {
    this.etapaAtual = Math.max(this.etapaAtual - 1, 1);
  }

  podeAvancarEtapa(): boolean {
    if (this.etapaAtual === 1) {
      return Boolean((this.empresa.nomeFantasia || this.empresa.razaoSocial).trim() && this.empresa.cidade.trim());
    }

    if (this.etapaAtual === 2) {
      return Boolean(this.planoSelecionado);
    }

    if (this.etapaAtual === 3) {
      return Boolean(this.empresa.responsavel.trim() && this.empresa.email.trim());
    }

    return true;
  }

  mensagemEtapa(): string {
    if (this.etapaAtual === 1) {
      return 'Informe o nome da empresa e cidade/estado.';
    }

    if (this.etapaAtual === 2) {
      return 'Selecione um plano.';
    }

    if (this.etapaAtual === 3) {
      return 'Informe nome e e-mail do responsável.';
    }

    return 'Confira os dados antes de salvar.';
  }

  salvarEmpresa() {
    const nomeEmpresa = this.empresa.nomeFantasia || this.empresa.razaoSocial;

    if (!nomeEmpresa.trim()) {
      alert('Informe o nome da empresa.');
      this.etapaAtual = 1;
      return;
    }

    if (!this.empresa.responsavel.trim() || !this.empresa.email.trim()) {
      alert('Informe nome e e-mail do responsável.');
      this.etapaAtual = 3;
      return;
    }

    const dadosEmpresa: Partial<EmpresaApi> = {
      id: this.modoEdicao ? this.idEdicao : undefined,
      razaoSocial: this.empresa.razaoSocial,
      nome: nomeEmpresa,
      nomeFantasia: this.empresa.nomeFantasia,
      cnpj: this.empresa.cnpj,
      inscricaoEstadual: this.empresa.inscricaoEstadual,
      cidade: this.empresa.cidade,
      setor: this.empresa.setor,
      responsavel: this.empresa.responsavel,
      email: this.empresa.email,
      telefone: this.empresa.telefone,
      plano: this.planoSelecionado,
      usuarios: this.empresaOriginal?.usuarios ?? 0,
      modulos: this.definirQuantidadeModulos(),
      situacao: this.empresaOriginal?.situacao ?? 'Trial',
      logo: this.gerarLogo(nomeEmpresa),
    };

    const requisicao = this.modoEdicao
      ? this.api.atualizarEmpresa(this.idEdicao, dadosEmpresa)
      : this.api.criarEmpresa(dadosEmpresa);

    requisicao.subscribe({
      next: (empresa) => {
        if (this.estaNoNavegador()) {
          localStorage.setItem('empresaSelecionadaDashboard', JSON.stringify(empresa));
          localStorage.removeItem('empresaEmEdicao');
        }

        this.router.navigate(['/admin']);
      },
      error: () => {
        alert('Não foi possível salvar no banco. Confira se a API está ligada com npm run api.');
      },
    });
  }

  definirQuantidadeModulos(): number {
    if (this.planoSelecionado === 'Inicial') {
      return 4;
    }

    if (this.planoSelecionado === 'Profissional') {
      return 7;
    }

    return 10;
  }

  gerarLogo(nome: string): string {
    if (!nome) {
      return 'NE';
    }

    return nome
      .split(' ')
      .map((palavra: string) => palavra[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatarCnpj() {
    let valor = this.empresa.cnpj.replace(/\D/g, '');

    valor = valor.substring(0, 14);
    valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
    valor = valor.replace(/(\d{4})(\d)/, '$1-$2');

    this.empresa.cnpj = valor;
  }

  formatarTelefone() {
    let valor = this.empresa.telefone.replace(/\D/g, '');

    valor = valor.substring(0, 11);

    if (valor.length <= 10) {
      valor = valor.replace(/^(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      valor = valor.replace(/^(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    }

    this.empresa.telefone = valor;
  }

  private preencherFormulario(empresa: EmpresaApi) {
    this.empresaOriginal = empresa;
    this.empresa.razaoSocial = empresa.razaoSocial || empresa.nome;
    this.empresa.nomeFantasia = empresa.nomeFantasia || empresa.nome;
    this.empresa.cnpj = empresa.cnpj || '';
    this.empresa.inscricaoEstadual = empresa.inscricaoEstadual || '';
    this.empresa.cidade = empresa.cidade || '';
    this.empresa.setor = empresa.setor || '';
    this.empresa.responsavel = empresa.responsavel || '';
    this.empresa.email = empresa.email || '';
    this.empresa.telefone = empresa.telefone || '';
    this.planoSelecionado = empresa.plano || 'Profissional';
  }

  private carregarEmpresaLocal(id: string) {
    const empresasSalvas = JSON.parse(localStorage.getItem('empresas') || '[]');
    const empresaEmEdicao = JSON.parse(localStorage.getItem('empresaEmEdicao') || 'null');
    const empresaEncontrada =
      empresasSalvas.find((empresa: any) => empresa.id === id) ||
      (empresaEmEdicao?.id === id ? empresaEmEdicao : null);

    if (empresaEncontrada) {
      this.preencherFormulario(empresaEncontrada);
    }
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
