import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-aprovacoes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './aprovacoes.html',
  styleUrl: './aprovacoes.css',
})
export class AprovacoesComponent {
  gestor = 'João';
  empresa = 'Têxtil Vale Norte';
}
