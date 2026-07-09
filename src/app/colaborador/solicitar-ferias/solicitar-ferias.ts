import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface SolicitacaoFerias {
  id: number;
  inicio: string;
  dias: number;
  tipo: string;
  observacao: string;
  situacao: string;
}

@Component({
  selector: 'app-solicitar-ferias',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './solicitar-ferias.html',
  styleUrl: './solicitar-ferias.css',
})
export class SolicitarFerias {
  solicitacoes: SolicitacaoFerias[] = [];

  idEmEdicao: number | null = null;

  solicitacao = this.solicitacaoVazia();

  get modoEdicao(): boolean {
    return this.idEmEdicao !== null;
  }

  salvarSolicitacao() {
    if (!this.solicitacao.inicio || this.solicitacao.dias <= 0) {
      return;
    }

    if (this.modoEdicao) {
      this.solicitacoes = this.solicitacoes.map((item) =>
        item.id === this.idEmEdicao ? { ...item, ...this.solicitacao } : item,
      );
    } else {
      this.solicitacoes.push({
        id: this.proximoId(),
        ...this.solicitacao,
        situacao: 'Pendente',
      });
    }

    this.limparFormulario();
  }

  editarSolicitacao(solicitacao: SolicitacaoFerias) {
    this.idEmEdicao = solicitacao.id;
    this.solicitacao = {
      inicio: solicitacao.inicio,
      dias: solicitacao.dias,
      tipo: solicitacao.tipo,
      observacao: solicitacao.observacao,
    };
  }

  excluirSolicitacao(id: number) {
    this.solicitacoes = this.solicitacoes.filter((item) => item.id !== id);

    if (this.idEmEdicao === id) {
      this.limparFormulario();
    }
  }

  limparFormulario() {
    this.idEmEdicao = null;
    this.solicitacao = this.solicitacaoVazia();
  }

  private solicitacaoVazia() {
    return {
      inicio: '',
      dias: 15,
      tipo: 'Férias integrais',
      observacao: '',
    };
  }

  private proximoId(): number {
    return this.solicitacoes.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
  }
}
