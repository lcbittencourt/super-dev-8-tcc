import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';
@Component({
  selector: 'app-colaborador',
  standalone: true,
  imports: [RouterLink, AcoesTopoComponent],
  templateUrl: './colaborador.html',
  styleUrl: './colaborador.css',
})
export class ColaboradorComponent {}
