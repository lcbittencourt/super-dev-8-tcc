import { Component } from '@angular/core';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [AcoesTopoComponent],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class Eventos {}
