import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent {
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

  empresaSelecionada = this.empresas[0];

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

  selecionarEmpresa(empresa: any) {
    this.empresaSelecionada = empresa;
  }

  alternarModulo(modulo: any) {
    modulo.liberado = !modulo.liberado;
  }

  totalUsuarios() {
    return this.empresas.reduce((total, empresa) => total + empresa.users, 0);
  }

  totalAtivas() {
    return this.empresas.filter(empresa => empresa.status === 'Ativa').length;
  }
}