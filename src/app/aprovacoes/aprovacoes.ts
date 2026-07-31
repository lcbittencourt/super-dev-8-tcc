import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';

@Component({
  selector: 'app-aprovacoes',
  standalone: true,
  imports: [RouterLink, AcoesTopoComponent],
  templateUrl: './aprovacoes.html',
  styleUrl: './aprovacoes.css',
})
export class AprovacoesComponent {
  gestor = 'João';
  empresa = 'Têxtil Vale Norte';
}
