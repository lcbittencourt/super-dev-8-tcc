import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AcoesTopoComponent } from '../../acoes-topo/acoes-topo';

@Component({
  selector: 'app-meus-dados',
  standalone: true,
  imports: [RouterLink, AcoesTopoComponent],
  templateUrl: './meus-dados.html',
  styleUrl: './meus-dados.css',
})
export class MeusDados {}
