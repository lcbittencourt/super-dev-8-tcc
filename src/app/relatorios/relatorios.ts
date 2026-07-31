import { Component } from '@angular/core';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [AcoesTopoComponent],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css',
})
export class Relatorios {}
