import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
      users: 148,
      modulos: 8,
      status: 'Ativa',
      logo: 'TV'
    },
    {
      id: 'ml002',
      nome: 'Metalúrgica Müller',
      cidade: 'Brusque, SC',
      plano: 'Profissional',
      users: 62,
      modulos: 6,
      status: 'Ativa',
      logo: 'MM'
    },
    {
      id: 'cf003',
      nome: 'Confecções Schmitt',
      cidade: 'Pomerode, SC',
      plano: 'Empresarial',
      users: 230,
      modulos: 9,
      status: 'Ativa',
      logo: 'CS'
    },
    {
      id: 'tc004',
      nome: 'TecnoCampo Soluções',
      cidade: 'Joinville, SC',
      plano: 'Inicial',
      users: 18,
      modulos: 4,
      status: 'Trial',
      logo: 'TC'
    },
    {
      id: 'al005',
      nome: 'Alimentos Beira-Rio',
      cidade: 'Itajaí, SC',
      plano: 'Profissional',
      users: 95,
      modulos: 7,
      status: 'Ativa',
      logo: 'AB'
    },
    {
      id: 'pl006',
      nome: 'Plásticos Riedel',
      cidade: 'Indaial, SC',
      plano: 'Inicial',
      users: 24,
      modulos: 5,
      status: 'Inadimplente',
      logo: 'PR'
    }
  ];

  empresaSelecionada: any = this.empresas[0];

  modulosSistema = [
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

  constructor(private router: Router) {}

  ngOnInit() {
    const empresasSalvas = JSON.parse(
      localStorage.getItem('empresas') || '[]'
    );

    const idsEmpresasAtuais = this.empresas.map(empresa => empresa.id);

    const empresasSemDuplicar = empresasSalvas.filter(
      (empresa: any) => !idsEmpresasAtuais.includes(empresa.id)
    );

    this.empresas = [
      ...this.empresas,
      ...empresasSemDuplicar
    ];

    this.empresaSelecionada = this.empresas[0];
  }

  selecionarEmpresa(empresa: any) {
    this.empresaSelecionada = empresa;
  }

  editarEmpresa() {
    if (!this.empresaSelecionada) {
      return;
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

    const empresasSalvas = JSON.parse(
      localStorage.getItem('empresas') || '[]'
    );

    const empresasAtualizadas = empresasSalvas.filter(
      (empresa: any) => empresa.id !== this.empresaSelecionada.id
    );

    localStorage.setItem(
      'empresas',
      JSON.stringify(empresasAtualizadas)
    );

    this.empresaSelecionada = this.empresas.length > 0 ? this.empresas[0] : null;
  }

  alternarModulo(modulo: any) {
    modulo.liberado = !modulo.liberado;
  }

  totalUsuarios() {
    return this.empresas.reduce(
      (total, empresa) => total + empresa.users,
      0
    );
  }

  totalAtivas() {
    return this.empresas.filter(
      empresa => empresa.status === 'Ativa'
    ).length;
  }

}