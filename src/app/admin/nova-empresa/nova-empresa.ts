import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nova-empresa',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './nova-empresa.html',
  styleUrl: './nova-empresa.css'
})
export class NovaEmpresaComponent implements OnInit {

  planoSelecionado = 'Profissional';
  modoEdicao = false;
  idEdicao = '';

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
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.modoEdicao = true;
    this.idEdicao = id;

    const empresasSalvas = JSON.parse(localStorage.getItem('empresas') || '[]');

    const empresaEncontrada = empresasSalvas.find(
      (empresa: any) => empresa.id === id
    );

    if (empresaEncontrada) {
      this.empresa.razaoSocial = empresaEncontrada.nome;
      this.empresa.nomeFantasia = empresaEncontrada.nome;
      this.empresa.cidade = empresaEncontrada.cidade;
      this.planoSelecionado = empresaEncontrada.plano;
    }
  }

  selecionarPlano(plano: string) {
    this.planoSelecionado = plano;
  }

  salvarEmpresa() {
    const nomeEmpresa = this.empresa.nomeFantasia || this.empresa.razaoSocial;

    const novaEmpresa = {
      id: this.modoEdicao ? this.idEdicao : Date.now().toString(),
      nome: nomeEmpresa,
      cidade: this.empresa.cidade,
      plano: this.planoSelecionado,
      users: 0,
      modulos: this.definirQuantidadeModulos(),
      status: 'Trial',
      logo: this.gerarLogo(nomeEmpresa)
    };

    const empresasSalvas = JSON.parse(localStorage.getItem('empresas') || '[]');

    if (this.modoEdicao) {
      const empresasAtualizadas = empresasSalvas.map((empresa: any) => {
        if (empresa.id === this.idEdicao) {
          return novaEmpresa;
        }

        return empresa;
      });

      localStorage.setItem('empresas', JSON.stringify(empresasAtualizadas));
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

}