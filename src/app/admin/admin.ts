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
      nome: 'Têxtil Vale Norte',
      cidade: 'Blumenau, SC',
      usuarios: 148,
      modulos: '8/10',
      plano: 'Empresarial',
      status: 'Ativa'
    },
    {
      nome: 'Metalúrgica Muller',
      cidade: 'Brusque, SC',
      usuarios: 62,
      modulos: '6/10',
      plano: 'Profissional',
      status: 'Ativa'
    },
    {
      nome: 'Confecções Schmitt',
      cidade: 'Pomerode, SC',
      usuarios: 230,
      modulos: '9/10',
      plano: 'Empresarial',
      status: 'Ativa'
    },
    {
      nome: 'TecnoCampo Soluções',
      cidade: 'Joinville, SC',
      usuarios: 18,
      modulos: '4/10',
      plano: 'Inicial',
      status: 'Trial'
    },
    {
      nome: 'Alimentos Beira-Rio',
      cidade: 'Itajaí, SC',
      usuarios: 95,
      modulos: '7/10',
      plano: 'Profissional',
      status: 'Ativa'
    },
    {
      nome: 'Plásticos Riedel',
      cidade: 'Indaial, SC',
      usuarios: 24,
      modulos: '5/10',
      plano: 'Inicial',
      status: 'Inadimplente'
    }
  ];

  modulos = [
    'Dashboard',
    'Colaboradores',
    'Controle de ponto',
    'Férias e afastamentos',
    'Treinamentos',
    'Chamados',
    'Comunicados',
    'Eventos',
    'Fornecedores',
    'Relatórios'
  ];

}