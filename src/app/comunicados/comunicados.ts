import { Component } from '@angular/core';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';

@Component({
  selector: 'app-comunicados',
  standalone: true,
  imports: [AcoesTopoComponent],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.css',
})
export class Comunicados {}
