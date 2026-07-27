import { Component, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nova-empresa',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './nova-empresa.html',
  styleUrl: './nova-empresa.css'
})
export class NovaEmpresaComponent implements OnInit {

  planoSelecionado = 'Profissional';
  modoEdicao = false;
  idEdicao = '';
  empresaOriginal: any = null;

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
    telefone: ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object
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

    const empresasSalvas = JSON.parse(localStorage.getItem('empresas') || '[]');
    const empresaEmEdicao = JSON.parse(localStorage.getItem('empresaEmEdicao') || 'null');
    const empresaEncontrada = empresasSalvas.find(
      (empresa: any) => empresa.id === id
    ) || (empresaEmEdicao?.id === id ? empresaEmEdicao : null);

    if (empresaEncontrada) {
      this.empresaOriginal = empresaEncontrada;
      this.empresa.razaoSocial = empresaEncontrada.nome;
      this.empresa.nomeFantasia = empresaEncontrada.nome;
      this.empresa.cidade = empresaEncontrada.cidade;
      this.planoSelecionado = empresaEncontrada.plano;
    }
  }

  selecionarPlano(plano: string) {
    this.planoSelecionado = plano;
  }

  proximoPasso() {
    if (this.passoAtual < this.totalPassos) {
      this.passoAtual++;
    }
  }

  passoAnterior() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
    }
  }

  irParaPasso(numero: number) {
    this.passoAtual = numero;
  }

  salvarEmpresa() {
    const nomeEmpresa = this.empresa.nomeFantasia || this.empresa.razaoSocial;

    const novaEmpresa = {
      id: this.modoEdicao ? this.idEdicao : Date.now().toString(),
      nome: nomeEmpresa,
      cidade: this.empresa.cidade,
      plano: this.planoSelecionado,
      usuarios: this.empresaOriginal?.usuarios ?? this.empresaOriginal?.users ?? 0,
      modulos: this.definirQuantidadeModulos(),
      situacao: this.empresaOriginal?.situacao ?? this.empresaOriginal?.status ?? 'Trial',
      logo: this.gerarLogo(nomeEmpresa)
    };

    if (!this.estaNoNavegador()) {
      this.router.navigate(['/admin']);
      return;
    }

    const empresasSalvas = JSON.parse(localStorage.getItem('empresas') || '[]');

    if (this.modoEdicao) {
      const empresaJaSalva = empresasSalvas.some(
        (empresa: any) => empresa.id === this.idEdicao
      );

      if (!empresaJaSalva) {
        empresasSalvas.push(novaEmpresa);
        localStorage.setItem('empresas', JSON.stringify(empresasSalvas));
        localStorage.removeItem('empresaEmEdicao');
        this.router.navigate(['/admin']);
        return;
      }

      const empresasAtualizadas = empresasSalvas.map((empresa: any) => {
        if (empresa.id === this.idEdicao) {
          return novaEmpresa;
        }

        return empresa;
      });

      localStorage.setItem('empresas', JSON.stringify(empresasAtualizadas));
      localStorage.removeItem('empresaEmEdicao');
      this.router.navigate(['/admin']);
      return;
    }

    empresasSalvas.push(novaEmpresa);
    localStorage.setItem('empresas', JSON.stringify(empresasSalvas));

    this.router.navigate(['/admin']);
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

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

}
