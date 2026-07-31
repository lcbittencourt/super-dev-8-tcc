import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AcoesTopoComponent } from '../../acoes-topo/acoes-topo';

interface Chamado {
  id: number;
  titulo: string;
  categoria: string;
  prioridade: string;
  setorSolicitante: string;
  descricao: string;
  situacao: string;
}

@Component({
  selector: 'app-novo-chamado',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AcoesTopoComponent],
  templateUrl: './novo-chamado.html',
  styleUrl: './novo-chamado.css',
})
export class NovoChamado {
  categorias = ['TI', 'Predial', 'RH', 'Financeiro'];
  prioridades = ['Baixa', 'Média', 'Alta', 'Urgente'];

  chamados: Chamado[] = [
    {
      id: 1,
      titulo: 'Computador não liga',
      categoria: 'TI',
      prioridade: 'Alta',
      setorSolicitante: 'Produção',
      descricao: 'A estação de trabalho da linha 2 não está ligando.',
      situacao: 'Aberto',
    },
    {
      id: 2,
      titulo: 'Ar-condicionado com vazamento',
      categoria: 'Predial',
      prioridade: 'Média',
      setorSolicitante: 'Administrativo',
      descricao: 'Vazamento de água próximo à sala de reuniões.',
      situacao: 'Em andamento',
    },
    {
      id: 3,
      titulo: 'Dúvida sobre folha de ponto',
      categoria: 'RH',
      prioridade: 'Baixa',
      setorSolicitante: 'Comercial',
      descricao: 'Registro de horas do último dia não apareceu no sistema.',
      situacao: 'Resolvido',
    },
  ];

  idEmEdicao: number | null = null;

  chamado = this.chamadoVazio();

  get modoEdicao(): boolean {
    return this.idEmEdicao !== null;
  }

  salvarChamado() {
    if (!this.chamado.titulo.trim()) {
      return;
    }

    if (this.modoEdicao) {
      this.chamados = this.chamados.map((item) =>
        item.id === this.idEmEdicao ? { ...item, ...this.chamado } : item,
      );
    } else {
      this.chamados.push({
        id: this.proximoId(),
        ...this.chamado,
        situacao: 'Aberto',
      });
    }

    this.limparFormulario();
  }

  editarChamado(chamado: Chamado) {
    this.idEmEdicao = chamado.id;
    this.chamado = {
      titulo: chamado.titulo,
      categoria: chamado.categoria,
      prioridade: chamado.prioridade,
      setorSolicitante: chamado.setorSolicitante,
      descricao: chamado.descricao,
    };
  }

  excluirChamado(id: number) {
    this.chamados = this.chamados.filter((item) => item.id !== id);

    if (this.idEmEdicao === id) {
      this.limparFormulario();
    }
  }

  limparFormulario() {
    this.idEmEdicao = null;
    this.chamado = this.chamadoVazio();
  }

  private chamadoVazio() {
    return {
      titulo: '',
      categoria: 'TI',
      prioridade: 'Média',
      setorSolicitante: '',
      descricao: '',
    };
  }

  private proximoId(): number {
    return this.chamados.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
  }
}
