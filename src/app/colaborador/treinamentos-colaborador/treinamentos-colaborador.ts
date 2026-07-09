import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-treinamentos-colaborador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './treinamentos-colaborador.html',
  styleUrl: './treinamentos-colaborador.css',
})
export class TreinamentosColaborador {
  inscritos: string[] = [];

  inscrever(treinamento: string) {
    if (!this.estaInscrito(treinamento)) {
      this.inscritos.push(treinamento);
    }
  }

  cancelarInscricao(treinamento: string) {
    this.inscritos = this.inscritos.filter((item) => item !== treinamento);
  }

  estaInscrito(treinamento: string): boolean {
    return this.inscritos.includes(treinamento);
  }
}
